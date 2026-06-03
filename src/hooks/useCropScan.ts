import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { ensureAnonymousSession, cacheUserId, getSessionId } from '@/lib/sessionSupabase';

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

type CompressedImage = {
  blob: Blob;
  previewUrl: string;
  ext: string;
  mime: string;
};

const compressImage = async (
  file: File,
  maxDim = 640,
  quality = 0.7,
): Promise<CompressedImage> => {
  const sourceUrl = URL.createObjectURL(file);

  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(sourceUrl);
        resolve({
          blob: file,
          previewUrl: URL.createObjectURL(file),
          ext: file.type === 'image/webp' ? 'webp' : 'jpg',
          mime: file.type || 'image/jpeg',
        });
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      const settle = (blob: Blob, mime: string, ext: string) => {
        URL.revokeObjectURL(sourceUrl);
        resolve({ blob, previewUrl: URL.createObjectURL(blob), mime, ext });
      };

      if (width === img.width && height === img.height && file.type === 'image/webp' && file.size < 700 * 1024) {
        URL.revokeObjectURL(sourceUrl);
        resolve({ blob: file, previewUrl: URL.createObjectURL(file), mime: 'image/webp', ext: 'webp' });
        return;
      }

      canvas.toBlob(
        (webpBlob) => {
          if (webpBlob) {
            settle(webpBlob, 'image/webp', 'webp');
            return;
          }

          canvas.toBlob(
            (jpegBlob) => {
              if (jpegBlob) {
                settle(jpegBlob, 'image/jpeg', 'jpg');
                return;
              }

              URL.revokeObjectURL(sourceUrl);
              resolve({
                blob: file,
                previewUrl: URL.createObjectURL(file),
                ext: file.type === 'image/webp' ? 'webp' : 'jpg',
                mime: file.type || 'image/jpeg',
              });
            },
            'image/jpeg',
            quality,
          );
        },
        'image/webp',
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(sourceUrl);
      resolve({
        blob: file,
        previewUrl: URL.createObjectURL(file),
        ext: file.type === 'image/webp' ? 'webp' : 'jpg',
        mime: file.type || 'image/jpeg',
      });
    };

    img.src = sourceUrl;
  });
};

const uploadCompressedImage = async (blob: Blob, ext: string, mime: string) => {
  const path = `uploads/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from('crop-scan-uploads')
    .upload(path, blob, { contentType: mime, upsert: false, cacheControl: '3600' });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from('crop-scan-uploads').getPublicUrl(path);
  return data.publicUrl;
};

const callScanFunction = async (imageUrl: string, language: string) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45_000);

  try {
    return await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scan-crop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ imageUrl, language }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
};

export const useCropScan = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stage, setStage] = useState<ScanStage>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { language } = useLanguage();

  const ensureSessionState = async (): Promise<string | null> => {
    const currentSession = sessionId || await getSessionId();
    if (currentSession) {
      if (currentSession !== sessionId) {
        setSessionId(currentSession);
        cacheUserId(currentSession);
      }
      return currentSession;
    }

    const newSessionId = await ensureAnonymousSession();
    if (newSessionId && newSessionId !== sessionId) {
      setSessionId(newSessionId);
      cacheUserId(newSessionId);
    }
    return newSessionId;
  };

  useEffect(() => {
    void ensureSessionState();
  }, []);

  const scanImage = async (
    file: File,
  ): Promise<{ diagnosis: CropDiagnosis; imageDataUrl: string; imageUrl: string } | null> => {
    if (isAnalyzing) return null;

    setIsAnalyzing(true);
    setError(null);
    setStage('compressing');
    setProgress(5);

    try {
      void ensureSessionState();

      const { blob, previewUrl, ext, mime } = await compressImage(file);
      setProgress(30);

      setStage('uploading');
      const publicUrl = await uploadCompressedImage(blob, ext, mime);
      setProgress(55);

      setStage('analyzing');
      setProgress(70);

      let response: Response;
      try {
        response = await callScanFunction(publicUrl, language);
        if (!response.ok && response.status >= 500) throw new Error('retry');
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 800));
        response = await callScanFunction(publicUrl, language);
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
      const message = err instanceof Error
        ? (err.name === 'AbortError' ? 'Analysis timed out. Check your connection and try again.' : err.message)
        : 'Failed to analyze image';
      setError(message);
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
      const currentSessionId = sessionId || await ensureSessionState();
      if (!currentSessionId) return null;

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
      const currentSessionId = sessionId || await ensureSessionState();
      if (!currentSessionId) return [];

      const { data, error: queryError } = await supabase
        .from('crop_scans')
        .select('*')
        .eq('session_id', currentSessionId)
        .order('created_at', { ascending: false });

      if (queryError) throw new Error(queryError.message);

      return (data || []).map((scan) => ({
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
