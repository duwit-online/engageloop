import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CapsuleBadge } from '@/components/CapsuleBadge';
import { PlatformIcon } from '@/components/PlatformIcon';
import { TaskStatusBadge } from '@/components/TaskStatusBadge';
import { TrustScoreBadge } from '@/components/TrustScoreBadge';
import { useTaskValidation } from '@/hooks/useTaskValidation';
import { useTaskSubmission } from '@/hooks/useTaskSubmission';
import { taskLabels, type TaskType } from '@/lib/economy';
import { generateVerificationUrl } from '@/lib/trust';
import { toast } from 'sonner';
import { 
  ExternalLink, 
  Clock, 
  Upload, 
  CheckCircle, 
  AlertTriangle,
  ShieldAlert,
  Camera,
  MessageCircle,
  HelpCircle,
  Timer,
  Loader2,
  AtSign,
  Shield,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export interface TaskInfo {
  id: string;
  url: string;
  platform: string;
  platformIcon: string;
  username: string;
  type: TaskType;
  reward: number;
  description?: string | null;
  isPromoted?: boolean;
  priority?: number;
}

interface TaskValidationDialogProps {
  task: TaskInfo | null;
  trustScore: number;
  multiplier: number;
  onClose: () => void;
  onComplete: (task: TaskInfo, state: 'pending' | 'released', pendingDuration: number) => void;
}

export function TaskValidationDialog({
  task,
  trustScore,
  multiplier,
  onClose,
  onComplete,
}: TaskValidationDialogProps) {
  const [linkOpened, setLinkOpened] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameVerified, setUsernameVerified] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [state, actions] = useTaskValidation(
    task?.type || 'like',
    trustScore,
    task?.platform
  );

  const { verifyUsername, isVerifying, submitTask } = useTaskSubmission();

  const handleOpenLink = () => {
    if (task) {
      window.open(task.url, '_blank');
      setLinkOpened(true);
      actions.startTimer();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      actions.setScreenshotFile(file);
    }
  };

  const handleUsernameBlur = async () => {
    if (!task || !state.requiresUsername || state.usernameInput.length < 2) return;
    
    const result = await verifyUsername(task.platform, state.usernameInput);
    setUsernameVerified(result.isValid);
    
    if (!result.isValid) {
      toast.error('Username not found on ' + task.platform);
    }
  };

  const handleComplete = async () => {
    if (!task || !state.canComplete) return;
    
    setIsSubmitting(true);
    
    try {
      const finalReward = Math.floor(task.reward * multiplier);
      
      const result = await submitTask({
        taskId: task.id,
        platform: task.platform,
        taskType: task.type,
        platformUsername: state.usernameInput,
        contentQuestion: state.contentQuestion,
        contentAnswer: state.contentAnswer,
        screenshotFile: state.screenshotFile,
        timerSeconds: state.timerSeconds,
        capsulesEarned: finalReward,
      });

      if (!result.success) {
        toast.error(result.error || 'Submission failed');
        setIsSubmitting(false);
        return;
      }

      const taskState = actions.completeTask();
      onComplete(task, taskState as 'pending' | 'released', state.pendingDuration);
      toast.success('Task submitted for verification!');
      
      // Reset for next task
      setLinkOpened(false);
      setUsernameVerified(null);
      actions.resetValidation();
    } catch (error) {
      toast.error('Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setLinkOpened(false);
    setUsernameVerified(null);
    actions.resetValidation();
    onClose();
  };

  if (!task) return null;

  const finalReward = Math.floor(task.reward * multiplier);
  const isSuspended = state.trustTier.tier === 'suspended';
  const isRestricted = state.trustTier.tier === 'restricted';

  return (
    <Dialog open={!!task} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center gap-2 flex-wrap text-base sm:text-lg">
            Complete Task
            <TaskStatusBadge status={state.taskState} />
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Complete all verification steps to earn Capsules
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Suspended Warning */}
          {isSuspended && (
            <Alert variant="destructive" className="py-2">
              <ShieldAlert className="h-4 w-4" />
              <AlertDescription className="text-xs sm:text-sm">
                Your account is suspended. You cannot earn Capsules.
              </AlertDescription>
            </Alert>
          )}

          {/* Restricted Warning */}
          {isRestricted && (
            <Alert className="border-warning bg-warning/10 py-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription className="text-xs sm:text-sm text-warning">
                Restricted: Extended timers and delayed rewards apply.
              </AlertDescription>
            </Alert>
          )}

          {/* Task Info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-background flex items-center justify-center shrink-0">
              <PlatformIcon icon={task.platformIcon} size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm sm:text-base truncate">{task.username}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">{task.platform} • {taskLabels[task.type]}</p>
            </div>
            <CapsuleBadge amount={finalReward} showPlus size="sm" />
          </div>

          {/* Trust & Timer Info */}
          <div className="flex items-center justify-between text-xs sm:text-sm flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <TrustScoreBadge score={trustScore} />
              <span className="text-muted-foreground">• {state.trustTier.label}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Min: {state.requiredSeconds}s</span>
            </div>
          </div>

          {/* Step 1: Open Link */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                linkOpened ? 'bg-success text-success-foreground' : 'bg-primary text-primary-foreground'
              }`}>
                1
              </div>
              <span className="font-medium text-sm sm:text-base">Open link & complete action</span>
            </div>
            <Button 
              variant={linkOpened ? 'secondary' : 'gradient'}
              className="w-full gap-2"
              onClick={handleOpenLink}
              disabled={isSuspended}
              size="sm"
            >
              <ExternalLink className="w-4 h-4" />
              {linkOpened ? 'Link Opened' : 'Open Link'}
            </Button>
          </div>

          {/* Timer Progress */}
          {linkOpened && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Engagement time
                </span>
                <span className={state.isTimerComplete ? 'text-success font-medium' : ''}>
                  {state.timerSeconds}s / {state.requiredSeconds}s
                </span>
              </div>
              <Progress 
                value={state.timerProgress} 
                className={`h-2 ${state.isTimerComplete ? '[&>div]:bg-success' : ''}`}
              />
            </div>
          )}

          {/* Step 2: Verification - Only show after timer complete */}
          {state.isTimerComplete && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <span className="font-medium text-sm sm:text-base">Complete verification</span>
              </div>

              {/* Username Input - Required for all except website */}
              {state.requiresUsername && (
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                    <AtSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Your {task.platform} username <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      placeholder={`@your${task.platform.toLowerCase().replace(/[^a-z]/g, '')}username`}
                      value={state.usernameInput}
                      onChange={(e) => {
                        actions.setUsernameInput(e.target.value);
                        setUsernameVerified(null);
                      }}
                      onBlur={handleUsernameBlur}
                      className="h-9 text-sm pr-8"
                    />
                    {isVerifying && (
                      <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                    )}
                    {!isVerifying && usernameVerified === true && (
                      <CheckCircle2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-success" />
                    )}
                    {!isVerifying && usernameVerified === false && (
                      <XCircle className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive" />
                    )}
                  </div>
                  {state.usernameInput.length >= 2 && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Shield className="w-3 h-3" />
                      <span>Verifying: <span className="text-primary font-medium">
                        {generateVerificationUrl(task.platform, state.usernameInput).verificationUrl || 'N/A'}
                      </span></span>
                    </div>
                  )}
                  {usernameVerified === false && (
                    <p className="text-xs text-destructive">Username not found. Please check and try again.</p>
                  )}
                  {state.usernameInput.length > 0 && state.usernameInput.length < 2 && (
                    <p className="text-xs text-destructive">Username must be at least 2 characters</p>
                  )}
                </div>
              )}

              {/* Comment Input - For comment tasks */}
              {state.requiresComment && (
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Your comment <span className="text-destructive">*</span>
                  </label>
                  <Textarea
                    placeholder="Paste your exact comment here (min 5 characters)..."
                    value={state.commentText}
                    onChange={(e) => actions.setCommentText(e.target.value)}
                    className="resize-none text-sm"
                    rows={2}
                  />
                  {state.commentText.length > 0 && state.commentText.length < 5 && (
                    <p className="text-xs text-destructive">Comment must be at least 5 characters</p>
                  )}
                </div>
              )}

              {/* Content Question - REQUIRED for ALL tasks - Dynamic Random */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Verification question <span className="text-destructive">*</span>
                  </label>
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <RefreshCw className="w-2.5 h-2.5" />
                    Random
                  </Badge>
                </div>
                <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs sm:text-sm font-medium">{state.contentQuestion}</p>
                </div>
                <Input
                  placeholder="Your answer (min 3 characters)..."
                  value={state.contentAnswer}
                  onChange={(e) => actions.setContentAnswer(e.target.value)}
                  className="h-9 text-sm"
                />
                {state.contentAnswer.length > 0 && state.contentAnswer.length < 3 && (
                  <p className="text-xs text-destructive">Answer must be at least 3 characters</p>
                )}
              </div>

              {/* Screenshot Upload - REQUIRED for ALL tasks */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Screenshot proof <span className="text-destructive">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button
                  variant="outline"
                  className="w-full gap-2 h-9 text-sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4" />
                  {state.screenshotFile ? (
                    <span className="truncate max-w-[200px]">{state.screenshotFile.name}</span>
                  ) : (
                    'Upload Screenshot'
                  )}
                </Button>
                {state.screenshotFile && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <CheckCircle className="w-3 h-3" />
                    Screenshot attached
                  </Badge>
                )}
              </div>

              {/* Confirmation Checkbox */}
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/50">
                <Checkbox
                  id="confirmation"
                  checked={state.confirmationChecked}
                  onCheckedChange={(checked) => actions.setConfirmationChecked(!!checked)}
                  className="mt-0.5"
                />
                <label htmlFor="confirmation" className="text-xs sm:text-sm cursor-pointer leading-snug">
                  I confirm I genuinely completed this task. False claims reduce my trust score and may result in penalties.
                </label>
              </div>

              {/* Pending Duration Info - Now in minutes */}
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/20 text-xs sm:text-sm">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
                <span>
                  Capsules released after <strong>
                    {state.pendingDuration >= 1 
                      ? `${state.pendingDuration}h` 
                      : `${Math.round(state.pendingDuration * 60)}min`}
                  </strong> verification
                </span>
              </div>

              {/* Warning */}
              <Alert className="border-warning/50 bg-warning/5 py-2">
                <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-warning" />
                <AlertDescription className="text-xs sm:text-sm">
                  False claims: trust score reduction + 150% capsule penalty.
                </AlertDescription>
              </Alert>

              {/* Submit Button */}
              <Button 
                variant="gradient" 
                className="w-full"
                onClick={handleComplete}
                disabled={!state.canComplete || isSubmitting || isSuspended}
                size="sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Verifying...
                  </>
                ) : (
                  'Confirm & Submit Task'
                )}
              </Button>
            </div>
          )}

          {/* Legal Disclaimer */}
          <p className="text-[10px] sm:text-xs text-muted-foreground text-center leading-snug">
            EngageLoop uses community verification and best-effort public signals. We do not access social media accounts, automate actions, or guarantee engagement outcomes.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
