import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

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

// Generate or retrieve session ID
const getSessionId = (): string => {
  let sessionId = localStorage.getItem('gram_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('gram_session_id', sessionId);
  }
  return sessionId;
};

export const useCropScan = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguage();

  const uploadImage = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    setError(null);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${getSessionId()}/${Date.now()}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from('crop-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: urlData } = supabase.storage
        .from('crop-images')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const analyzeImage = async (imageUrl: string): Promise<CropDiagnosis | null> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scan-crop`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ imageUrl, language }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze image');
      }

      const data = await response.json();
      return data.diagnosis;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze image');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveScanResult = async (imageUrl: string, diagnosis: CropDiagnosis): Promise<string | null> => {
    try {
      const { data, error: insertError } = await supabase
        .from('crop_scans')
        .insert([{
          session_id: getSessionId(),
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

      if (insertError) {
        throw new Error(insertError.message);
      }

      return data.id;
    } catch (err) {
      console.error('Failed to save scan result:', err);
      return null;
    }
  };

  const getScanHistory = async (): Promise<ScanResult[]> => {
    try {
      const { data, error: queryError } = await supabase
        .from('crop_scans')
        .select('*')
        .eq('session_id', getSessionId())
        .order('created_at', { ascending: false });

      if (queryError) {
        throw new Error(queryError.message);
      }

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
        .single();

      if (queryError) {
        throw new Error(queryError.message);
      }

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
    uploadImage,
    analyzeImage,
    saveScanResult,
    getScanHistory,
    getScanById,
    isUploading,
    isAnalyzing,
    error,
  };
};
