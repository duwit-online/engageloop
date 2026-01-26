import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { CapsuleBadge } from '@/components/CapsuleBadge';
import { PlatformIcon } from '@/components/PlatformIcon';
import { useApp } from '@/contexts/AppContext';
import { detectPlatform, getPlatformIcon, getPlatformName } from '@/lib/platforms';
import { taskValues, taskLabels, type TaskType } from '@/lib/economy';
import { supabase } from '@/integrations/supabase/client';
import { Link2, Heart, MessageCircle, UserPlus, Play, Rocket, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const taskOptions: { type: TaskType; icon: typeof Heart }[] = [
  { type: 'like', icon: Heart },
  { type: 'comment', icon: MessageCircle },
  { type: 'follow', icon: UserPlus },
  { type: 'stream', icon: Play },
];

function getUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const PromoteLinkPage = () => {
  const { capsuleBalance, spendCapsules } = useApp();
  const { toast } = useToast();
  
  const [url, setUrl] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<TaskType[]>(['like']);
  const [quantities, setQuantities] = useState<Record<TaskType, number>>({
    like: 10,
    comment: 5,
    follow: 5,
    stream: 5,
  });
  const [isLaunching, setIsLaunching] = useState(false);

  const detectedPlatform = useMemo(() => {
    if (!url) return null;
    return detectPlatform(url);
  }, [url]);

  const platformName = useMemo(() => getPlatformName(url), [url]);
  const platformIcon = useMemo(() => getPlatformIcon(url), [url]);

  const totalCost = useMemo(() => {
    return selectedTasks.reduce((total, task) => {
      return total + (taskValues[task] * quantities[task]);
    }, 0);
  }, [selectedTasks, quantities]);

  const handleTaskToggle = (type: TaskType) => {
    setSelectedTasks(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleQuantityChange = (type: TaskType, value: number[]) => {
    setQuantities(prev => ({ ...prev, [type]: value[0] }));
  };

  const handleLaunch = async () => {
    if (!url) {
      toast({
        title: 'Missing URL',
        description: 'Please enter a valid URL to promote.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedTasks.length === 0) {
      toast({
        title: 'No tasks selected',
        description: 'Please select at least one engagement type.',
        variant: 'destructive',
      });
      return;
    }

    if (totalCost > capsuleBalance) {
      toast({
        title: 'Insufficient Capsules',
        description: 'You don\'t have enough Capsules. Earn more or purchase from the store.',
        variant: 'destructive',
      });
      return;
    }

    setIsLaunching(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Authentication Error',
          description: 'Please log in to create tasks.',
          variant: 'destructive',
        });
        return;
      }

      // Create tasks in database
      const tasksToCreate = selectedTasks.map(taskType => {
        const reward = taskValues[taskType] || 0;
        const quantity = quantities[taskType] || 0;
        const budget = reward * quantity;
        const safePlatformName = platformName || 'Website';

        return {
          id: getUUID(),
          user_id: user.id,
          title: `${taskLabels[taskType] || taskType} on ${safePlatformName}`,
          description: `Please ${taskLabels[taskType]?.toLowerCase() || taskType} this content`,
          platform: safePlatformName,
          task_type: taskType,
          target_url: url,
          capsule_budget: Math.floor(budget),
          capsule_reward: Math.floor(reward),
          target_quantity: Math.floor(quantity),
          status: 'active',
          is_public: true,
        };
      });

      const { error } = await supabase
        .from('tasks')
        .insert(tasksToCreate)
        .select();

      if (error) {
        console.error('Error creating tasks:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to create promotion tasks.',
          variant: 'destructive',
        });
        return;
      }

      // Deduct capsules
      spendCapsules(totalCost);

      toast({
        title: 'Promotion Launched! 🚀',
        description: `Your tasks are now live. ${totalCost} Capsules spent.`,
      });

      setUrl('');
      setSelectedTasks(['like']);
      setQuantities({
        like: 10,
        comment: 5,
        follow: 5,
        stream: 5,
      });
    } catch (error) {
      console.error('Launch error:', error);
      toast({
        title: 'Error',
        description: 'Failed to launch promotion.',
        variant: 'destructive',
      });
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Promote Your Link</h2>
        <p className="text-muted-foreground">Get real engagement from community members</p>
      </div>

      {/* URL Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Link2 className="w-5 h-5" />
            Enter Your Link
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">Public URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://instagram.com/p/xyz123..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="text-base"
            />
          </div>

          {url && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <PlatformIcon icon={platformIcon} size={24} />
              <div>
                <p className="font-medium">{platformName}</p>
                <p className="text-xs text-muted-foreground truncate max-w-md">{url}</p>
              </div>
              {detectedPlatform && (
                <span className="ml-auto text-xs text-success">✓ Detected</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Engagement Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Engagement Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {taskOptions.map(({ type, icon: Icon }) => {
            const isSelected = selectedTasks.includes(type);
            const cost = taskValues[type] * quantities[type];
            
            return (
              <div key={type} className={`p-4 rounded-lg border transition-all ${
                isSelected ? 'border-primary bg-primary/5' : 'border-border'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={type}
                      checked={isSelected}
                      onCheckedChange={() => handleTaskToggle(type)}
                    />
                    <Label htmlFor={type} className="flex items-center gap-2 cursor-pointer">
                      <Icon className="w-4 h-4" />
                      {taskLabels[type]}
                    </Label>
                  </div>
                  {isSelected && (
                    <CapsuleBadge amount={cost} size="sm" />
                  )}
                </div>

                {isSelected && (
                  <div className="space-y-2 pl-7">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Quantity</span>
                      <span className="font-medium">{quantities[type]} engagements</span>
                    </div>
                    <Slider
                      value={[quantities[type]]}
                      onValueChange={(value) => handleQuantityChange(type, value)}
                      min={1}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1</span>
                      <span>50</span>
                      <span>100</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Cost Summary & Launch */}
      <Card className="border-primary/50">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Cost</p>
              <div className="flex items-center gap-3">
                <CapsuleBadge amount={totalCost} size="lg" />
                <span className="text-sm text-muted-foreground">
                  Balance: {capsuleBalance.toLocaleString()}
                </span>
              </div>
              {totalCost > capsuleBalance && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Insufficient balance
                </p>
              )}
            </div>

            <Button
              variant="gradient"
              size="lg"
              className="gap-2"
              onClick={handleLaunch}
              disabled={isLaunching || totalCost > capsuleBalance || !url || selectedTasks.length === 0}
            >
              <Rocket className="w-5 h-5" />
              {isLaunching ? 'Launching...' : 'Launch Promotion'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PromoteLinkPage;
