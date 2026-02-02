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

export const useCropScan = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { language } = useLanguage();

  // Initialize session on mount
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

  const uploadImage = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    setError(null);

    try {
      // Ensure we have a session
      const currentSessionId = sessionId || await ensureAnonymousSession();
      if (!currentSessionId) {
        throw new Error('Failed to create session');
      }
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentSessionId}/${Date.now()}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from('crop-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Use signed URL since bucket is now private (1 hour expiry)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('crop-images')
        .createSignedUrl(data.path, 3600);

      if (signedUrlError) {
        throw new Error(signedUrlError.message);
      }

      return signedUrlData.signedUrl;
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
      const currentSessionId = sessionId || await ensureAnonymousSession();
      if (!currentSessionId) {
        throw new Error('Failed to create session');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scan-crop`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'x-session-id': currentSessionId,
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
      const currentSessionId = sessionId || await ensureAnonymousSession();
      if (!currentSessionId) {
        throw new Error('Failed to create session');
      }
      
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

      if (insertError) {
        throw new Error(insertError.message);
      }

      return data.id;
    } catch (err) {
      console.error('Failed to save scan result:', err);
      return null;
    }
  };

  // Helper to get signed URL for stored images
  const getSignedImageUrl = async (storedUrl: string): Promise<string> => {
    try {
      // Extract the path from the stored URL
      const urlMatch = storedUrl.match(/crop-images\/(.+)/);
      if (!urlMatch) return storedUrl;
      
      const filePath = urlMatch[1].split('?')[0]; // Remove any query params
      const { data, error } = await supabase.storage
        .from('crop-images')
        .createSignedUrl(filePath, 3600);
      
      if (error || !data) return storedUrl;
      return data.signedUrl;
    } catch {
      return storedUrl;
    }
  };

  const getScanHistory = async (): Promise<ScanResult[]> => {
    try {
      const currentSessionId = sessionId || await ensureAnonymousSession();
      if (!currentSessionId) {
        return [];
      }
      
      const { data, error: queryError } = await supabase
        .from('crop_scans')
        .select('*')
        .eq('session_id', currentSessionId)
        .order('created_at', { ascending: false });

      if (queryError) {
        throw new Error(queryError.message);
      }

      // Get signed URLs for all images
      const results = await Promise.all(
        (data || []).map(async scan => ({
          id: scan.id,
          image_url: await getSignedImageUrl(scan.image_url),
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
        }))
      );

      return results;
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

      if (queryError) {
        throw new Error(queryError.message);
      }

      if (!data) {
        return null;
      }

      // Get signed URL for the image
      const signedImageUrl = await getSignedImageUrl(data.image_url);

      return {
        id: data.id,
        image_url: signedImageUrl,
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
    sessionId,
  };
};
