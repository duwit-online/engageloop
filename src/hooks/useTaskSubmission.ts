import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TaskType } from '@/lib/economy';

export interface TaskSubmissionData {
  taskId: string;
  platform: string;
  taskType: TaskType;
  platformUsername: string;
  contentQuestion: string;
  contentAnswer: string;
  screenshotFile: File | null;
  timerSeconds: number;
  capsulesEarned: number;
}

export interface VerificationResult {
  isValid: boolean;
  profileData: {
    username: string;
    displayName?: string;
    profileUrl: string;
    avatarUrl?: string;
    followers?: number;
    isVerified?: boolean;
    bio?: string;
  } | null;
  cached?: boolean;
  error?: string;
}

export interface SubmissionResult {
  success: boolean;
  submissionId?: string;
  error?: string;
}

export function useTaskSubmission() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  // Verify username against platform
  const verifyUsername = useCallback(async (platform: string, username: string): Promise<VerificationResult> => {
    if (!username || username.length < 2) {
      return { isValid: false, profileData: null, error: 'Username too short' };
    }

    // Skip verification for website tasks
    if (platform.toLowerCase() === 'website') {
      return { isValid: true, profileData: null };
    }

    setIsVerifying(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('verify-username', {
        body: { platform, username },
      });

      if (error) {
        console.error('Verification error:', error);
        return { isValid: false, profileData: null, error: error.message };
      }

      const result: VerificationResult = data;
      setVerificationResult(result);
      return result;
    } catch (error) {
      console.error('Verification failed:', error);
      return { isValid: false, profileData: null, error: 'Verification failed' };
    } finally {
      setIsVerifying(false);
    }
  }, []);

  // Upload screenshot to storage (now uses signed URLs since bucket is private)
  const uploadScreenshot = useCallback(async (file: File, taskId: string): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated for screenshot upload');
        return null;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${taskId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('screenshots')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Screenshot upload error:', uploadError);
        return null;
      }

      // Use signed URL since bucket is now private
      const { data: urlData, error: signError } = await supabase.storage
        .from('screenshots')
        .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year expiry

      if (signError || !urlData?.signedUrl) {
        console.error('Error creating signed URL:', signError);
        return null;
      }

      return urlData.signedUrl;
    } catch (error) {
      console.error('Screenshot upload failed:', error);
      return null;
    }
  }, []);

  // Submit task for verification
  const submitTask = useCallback(async (data: TaskSubmissionData): Promise<SubmissionResult> => {
    setIsSubmitting(true);

    try {
      // Upload screenshot first
      let screenshotUrl: string | null = null;
      if (data.screenshotFile) {
        screenshotUrl = await uploadScreenshot(data.screenshotFile, data.taskId);
        if (!screenshotUrl) {
          return { success: false, error: 'Failed to upload screenshot' };
        }
      }

      // Verify username before submission (skip for website)
      if (data.platform.toLowerCase() !== 'website') {
        const verification = await verifyUsername(data.platform, data.platformUsername);
        if (!verification.isValid) {
          return { 
            success: false, 
            error: `Username verification failed: ${verification.error || 'Invalid username'}` 
          };
        }
      }

      // Insert task submission using type assertion for generated types
      const insertData = {
        task_id: data.taskId,
        platform: data.platform,
        task_type: data.taskType,
        platform_username: data.platformUsername,
        content_question: data.contentQuestion,
        content_answer: data.contentAnswer,
        screenshot_url: screenshotUrl,
        timer_seconds: data.timerSeconds,
        capsules_earned: data.capsulesEarned,
        status: 'pending' as const,
        verification_result: verificationResult as unknown,
      };

      const { data: submission, error } = await supabase
        .from('task_submissions')
        .insert(insertData as never)
        .select('id')
        .single();

      if (error) {
        console.error('Submission error:', error);
        return { success: false, error: 'Failed to submit task' };
      }

      return { success: true, submissionId: submission?.id };
    } catch (error) {
      console.error('Submission failed:', error);
      return { success: false, error: 'Submission failed' };
    } finally {
      setIsSubmitting(false);
    }
  }, [uploadScreenshot, verifyUsername, verificationResult]);

  // Get user's pending submissions
  const getPendingSubmissions = useCallback(async () => {
    const { data, error } = await supabase
      .from('task_submissions')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending submissions:', error);
      return [];
    }

    return data || [];
  }, []);

  // Reset verification state
  const resetVerification = useCallback(() => {
    setVerificationResult(null);
  }, []);

  return {
    isSubmitting,
    isVerifying,
    verificationResult,
    verifyUsername,
    submitTask,
    getPendingSubmissions,
    resetVerification,
  };
}
