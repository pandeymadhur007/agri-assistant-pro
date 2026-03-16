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

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const useCropScan = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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

  const scanImage = async (file: File): Promise<{ diagnosis: CropDiagnosis; imageDataUrl: string } | null> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const currentSessionId = sessionId || await ensureAnonymousSession();
      if (!currentSessionId) throw new Error('Failed to create session');

      const base64DataUrl = await fileToBase64(file);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scan-crop`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ imageBase64: base64DataUrl, language }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze image');
      }

      const data = await response.json();
      return { diagnosis: data.diagnosis, imageDataUrl: base64DataUrl };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze image');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveScanResult = async (imageDataUrl: string, diagnosis: CropDiagnosis): Promise<string | null> => {
    try {
      const currentSessionId = sessionId || await ensureAnonymousSession();
      if (!currentSessionId) throw new Error('Failed to create session');

      const { data, error: insertError } = await supabase
        .from('crop_scans')
        .insert([{
          session_id: currentSessionId,
          image_url: imageDataUrl.substring(0, 500), // Store truncated reference
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
    error,
    sessionId,
  };
};
