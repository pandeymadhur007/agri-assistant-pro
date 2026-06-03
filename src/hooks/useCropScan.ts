import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { ensureAnonymousSession, cacheUserId } from '@/lib/sessionSupabase';

export interface CropDiagnosis {
  is_plant: boolean;
  crop_name: string;
  disease_name: string;
  severity: 'healthy' | 'mild' | 'moderate' | 'severe' | 'critical';
  cause: string;
  treatment: string;
  pesticide: string;
  prevention: string;
  additional_notes?: string;
}

export interface ScanResult {
  id: string;
  image_url: string;
  diagnosis: CropDiagnosis;
  created_at: string;
}

export type ScanStage = 'idle' | 'compressing' | 'uploading' | 'analyzing' | 'done' | 'error';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Aggressive resize + WebP encode. Typical 3MB phone photo -> ~60-90KB.
// 640px is enough resolution for AI leaf disease detection — keeps payload tiny.
const compressImage = async (
  file: File,
  maxDim = 640,
  quality = 0.7,
): Promise<{ blob: Blob; previewUrl: string; ext: string; mime: string }> => {
  const dataUrl = await fileToBase64(file);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Fallback: send original
        fetch(dataUrl).then(r => r.blob()).then(blob => {
          resolve({ blob, previewUrl: dataUrl, ext: 'jpg', mime: 'image/jpeg' });
        });
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      // Prefer WebP; fall back to JPEG on old browsers.
      const tryFormat = (mime: 'image/webp' | 'image/jpeg', ext: 'webp' | 'jpg') => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const previewUrl = canvas.toDataURL(mime, quality);
              resolve({ blob, previewUrl, ext, mime });
            } else if (mime === 'image/webp') {
              tryFormat('image/jpeg', 'jpg');
            } else {
              fetch(dataUrl).then(r => r.blob()).then(blob => {
                resolve({ blob, previewUrl: dataUrl, ext: 'jpg', mime: 'image/jpeg' });
              });
            }
          },
          mime,
          quality,
        );
      };
      tryFormat('image/webp', 'webp');
    };
    img.onerror = () => {
      fetch(dataUrl).then(r => r.blob()).then(blob => {
        resolve({ blob, previewUrl: dataUrl, ext: 'jpg', mime: 'image/jpeg' });
      });
    };
    img.src = dataUrl;
  });
};

export const useCropScan = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stage, setStage] = useState<ScanStage>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { language } = useLanguage();

  useEffect(() => {
    const initSession = async () => {
      const id = await ensureAnonymousSession();
      if (id) {
        setSessionId(id);
        cacheUserId(id);
      }
    };
    initSession();
  }, []);

  const scanImage = async (
    file: File,
  ): Promise<{ diagnosis: CropDiagnosis; imageDataUrl: string; imageUrl: string } | null> => {
    // Re-entry guard — prevent duplicate scans from rapid double-clicks
    if (isAnalyzing) return null;
    setIsAnalyzing(true);
    setError(null);
    setStage('compressing');
    setProgress(5);

    try {
      const currentSessionId = sessionId || await ensureAnonymousSession();
      if (!currentSessionId) throw new Error('Failed to create session');

      // Stage 1: compress
      const { blob, previewUrl, ext, mime } = await compressImage(file);
      setProgress(30);

      // Stage 2: upload to storage
      setStage('uploading');
      const path = `${currentSessionId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('crop-scan-uploads')
        .upload(path, blob, { contentType: mime, upsert: false });
      if (upErr) throw new Error(upErr.message);
      const { data: pub } = supabase.storage.from('crop-scan-uploads').getPublicUrl(path);
      const publicUrl = pub.publicUrl;
      setProgress(55);

      // Stage 3: analyze
      setStage('analyzing');
      setProgress(70);

      // Timeout + 1 retry on transient failures (network / 5xx / gateway hiccups)
      const callScan = async (): Promise<Response> => {
        const ac = new AbortController();
        const timer = setTimeout(() => ac.abort(), 45_000);
        try {
          return await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scan-crop`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              },
              body: JSON.stringify({ imageUrl: publicUrl, language }),
              signal: ac.signal,
            }
          );
        } finally {
          clearTimeout(timer);
        }
      };

      let response: Response;
      try {
        response = await callScan();
        if (!response.ok && response.status >= 500) throw new Error('retry');
      } catch {
        // One retry after brief backoff
        await new Promise(r => setTimeout(r, 800));
        response = await callScan();
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          throw new Error('Too many requests. Please wait a moment and try again.');
        }
        throw new Error(errorData.error || 'Failed to analyze image');
      }

      const data = await response.json();
      setProgress(100);
      setStage('done');
      return { diagnosis: data.diagnosis, imageDataUrl: previewUrl, imageUrl: publicUrl };
    } catch (err) {
      const msg = err instanceof Error
        ? (err.name === 'AbortError' ? 'Analysis timed out. Check your connection and try again.' : err.message)
        : 'Failed to analyze image';
      setError(msg);
      setStage('error');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveScanResult = async (
    imageUrl: string,
    diagnosis: CropDiagnosis,
  ): Promise<string | null> => {
    try {
      const currentSessionId = sessionId || await ensureAnonymousSession();
      if (!currentSessionId) throw new Error('Failed to create session');

      const { data, error: insertError } = await supabase
        .from('crop_scans')
        .insert([{
          session_id: currentSessionId,
          image_url: imageUrl,
          crop_name: diagnosis.crop_name,
          disease_name: diagnosis.disease_name,
          severity: diagnosis.severity,
          cause: diagnosis.cause,
          treatment: diagnosis.treatment,
          pesticide: diagnosis.pesticide,
          prevention: diagnosis.prevention,
          language,
          raw_result: JSON.parse(JSON.stringify(diagnosis)),
        }])
        .select('id')
        .single();

      if (insertError) throw new Error(insertError.message);
      return data.id;
    } catch (err) {
      console.error('Failed to save scan result:', err);
      return null;
    }
  };

  const getScanHistory = async (): Promise<ScanResult[]> => {
    try {
      const currentSessionId = sessionId || await ensureAnonymousSession();
      if (!currentSessionId) return [];

      const { data, error: queryError } = await supabase
        .from('crop_scans')
        .select('*')
        .eq('session_id', currentSessionId)
        .order('created_at', { ascending: false });

      if (queryError) throw new Error(queryError.message);

      return (data || []).map(scan => ({
        id: scan.id,
        image_url: scan.image_url,
        diagnosis: {
          is_plant: true,
          crop_name: scan.crop_name || '',
          disease_name: scan.disease_name || '',
          severity: (scan.severity as CropDiagnosis['severity']) || 'healthy',
          cause: scan.cause || '',
          treatment: scan.treatment || '',
          pesticide: scan.pesticide || '',
          prevention: scan.prevention || '',
        },
        created_at: scan.created_at,
      }));
    } catch (err) {
      console.error('Failed to fetch scan history:', err);
      return [];
    }
  };

  const getScanById = async (id: string): Promise<ScanResult | null> => {
    try {
      const { data, error: queryError } = await supabase
        .from('crop_scans')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (queryError) throw new Error(queryError.message);
      if (!data) return null;

      return {
        id: data.id,
        image_url: data.image_url,
        diagnosis: {
          is_plant: true,
          crop_name: data.crop_name || '',
          disease_name: data.disease_name || '',
          severity: (data.severity as CropDiagnosis['severity']) || 'healthy',
          cause: data.cause || '',
          treatment: data.treatment || '',
          pesticide: data.pesticide || '',
          prevention: data.prevention || '',
        },
        created_at: data.created_at,
      };
    } catch (err) {
      console.error('Failed to fetch scan:', err);
      return null;
    }
  };

  return {
    scanImage,
    saveScanResult,
    getScanHistory,
    getScanById,
    isAnalyzing,
    stage,
    progress,
    error,
    sessionId,
  };
};
