import { useState, useCallback, useEffect, useRef } from 'react';
import { TaskType } from '@/lib/economy';
import { 
  getTrustTier, 
  validationRules, 
  getRandomTaskQuestion,
  type TrustConfig,
  type ValidationRule,
  type TaskState 
} from '@/lib/trust';

export interface TaskValidationState {
  taskState: TaskState;
  timerProgress: number;
  timerSeconds: number;
  requiredSeconds: number;
  isTimerComplete: boolean;
  confirmationChecked: boolean;
  commentText: string;
  usernameInput: string;
  screenshotFile: File | null;
  screenshotRequired: boolean;
  contentQuestion: string;
  contentAnswer: string;
  canComplete: boolean;
  pendingDuration: number;
  trustTier: TrustConfig;
  requiresUsername: boolean;
  requiresComment: boolean;
  isWebsiteTask: boolean;
}

export interface TaskValidationActions {
  startTimer: () => void;
  pauseTimer: () => void;
  resetValidation: () => void;
  setConfirmationChecked: (checked: boolean) => void;
  setCommentText: (text: string) => void;
  setUsernameInput: (username: string) => void;
  setScreenshotFile: (file: File | null) => void;
  setContentAnswer: (answer: string) => void;
  completeTask: () => TaskState;
}

export function useTaskValidation(
  taskType: TaskType,
  trustScore: number,
  platform?: string
): [TaskValidationState, TaskValidationActions] {
  const trustTier = getTrustTier(trustScore);
  const rule = validationRules[taskType] || validationRules.like;
  
  // Check if this is a website visit task
  const isWebsiteTask = platform?.toLowerCase() === 'website';
  
  // Calculate required time with trust multiplier
  const baseTime = Math.floor((rule.minTimer + rule.maxTimer) / 2);
  const requiredSeconds = Math.floor(baseTime * trustTier.timerMultiplier);
  
  // Screenshot is ALWAYS required now
  const screenshotRequired = true;
  
  // Username is required for all tasks except website visits
  const requiresUsername = !isWebsiteTask;
  
  // Content question for ALL task types
  const [contentQuestion] = useState(() => getRandomTaskQuestion(taskType));

  const [taskState, setTaskState] = useState<TaskState>('started');
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [contentAnswer, setContentAnswer] = useState('');
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer logic
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning]);

  const timerProgress = Math.min((timerSeconds / requiredSeconds) * 100, 100);
  const isTimerComplete = timerSeconds >= requiredSeconds;

  // Validation rules - ALL are mandatory now
  const canComplete = (() => {
    if (!isTimerComplete) return false;
    if (!confirmationChecked) return false;
    
    // Username required for all except website visits
    if (requiresUsername && usernameInput.trim().length < 2) return false;
    
    // Comment required for comment tasks
    if (rule.requiresComment && commentText.trim().length < 5) return false;
    
    // Content question is ALWAYS required
    if (contentAnswer.trim().length < 3) return false;
    
    // Screenshot is ALWAYS required
    if (!screenshotFile) return false;
    
    return true;
  })();

  const startTimer = useCallback(() => {
    setIsTimerRunning(true);
  }, []);

  const pauseTimer = useCallback(() => {
    setIsTimerRunning(false);
  }, []);

  const resetValidation = useCallback(() => {
    setTaskState('started');
    setTimerSeconds(0);
    setIsTimerRunning(false);
    setConfirmationChecked(false);
    setCommentText('');
    setUsernameInput('');
    setScreenshotFile(null);
    setContentAnswer('');
  }, []);

  const completeTask = useCallback((): TaskState => {
    if (!canComplete) return 'started';
    
    setIsTimerRunning(false);
    setTaskState('pending');
    
    // State will be 'pending' - capsules released after pendingDuration
    return 'pending';
  }, [canComplete]);

  return [
    {
      taskState,
      timerProgress,
      timerSeconds,
      requiredSeconds,
      isTimerComplete,
      confirmationChecked,
      commentText,
      usernameInput,
      screenshotFile,
      screenshotRequired,
      contentQuestion,
      contentAnswer,
      canComplete,
      pendingDuration: trustTier.pendingDuration,
      trustTier,
      requiresUsername,
      requiresComment: rule.requiresComment,
      isWebsiteTask,
    },
    {
      startTimer,
      pauseTimer,
      resetValidation,
      setConfirmationChecked,
      setCommentText,
      setUsernameInput,
      setScreenshotFile,
      setContentAnswer,
      completeTask,
    },
  ];
}
