import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CapsuleBadge } from '@/components/CapsuleBadge';
import { PlatformIcon } from '@/components/PlatformIcon';
import { useAdminData } from '@/hooks/useAdminData';
import { taskLabels } from '@/lib/economy';
import { formatDistanceToNow } from 'date-fns';
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  ExternalLink,
  Loader2,
  Image as ImageIcon,
  MessageSquare,
  User,
  Timer,
  AlertTriangle,
  RefreshCw,
  Inbox,
  CheckCheck,
  Trash2,
} from 'lucide-react';

type FilterStatus = 'pending' | 'verified' | 'rejected' | 'released' | 'all';

export default function SubmissionReview() {
  const {
    submissions,
    isLoading,
    refetch,
    approveSubmission,
    rejectSubmission,
    releaseSubmission,
    deleteSubmission,
    bulkApprove,
    bulkReject,
    bulkRelease,
  } = useAdminData();

  const [filter, setFilter] = useState<FilterStatus>('pending');
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkNotes, setBulkNotes] = useState('');
  const [showBulkDialog, setShowBulkDialog] = useState<'approve' | 'reject' | null>(null);

  const filteredSubmissions = filter === 'all' 
    ? submissions 
    : submissions.filter(s => s.status === filter);

  const stats = {
    total: submissions.length,
    pending: submissions.filter(s => s.status === 'pending').length,
    verified: submissions.filter(s => s.status === 'verified').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
    released: submissions.filter(s => s.status === 'released').length,
  };

  const handleApprove = async (submission: any) => {
    setActionLoading(submission.id);
    await approveSubmission(submission.id, reviewNotes);
    setSelectedSubmission(null);
    setReviewNotes('');
    setActionLoading(null);
  };

  const handleReject = async (submission: any) => {
    if (!reviewNotes.trim()) {
      return;
    }
    setActionLoading(submission.id);
    await rejectSubmission(submission.id, reviewNotes);
    setSelectedSubmission(null);
    setReviewNotes('');
    setActionLoading(null);
  };

  const handleRelease = async (submission: any) => {
    setActionLoading(submission.id);
    await releaseSubmission(submission.id);
    setActionLoading(null);
  };

  const handleDelete = async (id: string) => {
    setActionLoading(id);
    await deleteSubmission(id);
    setActionLoading(null);
  };

  const handleBulkApprove = async () => {
    setActionLoading('bulk');
    await bulkApprove(selectedIds, bulkNotes);
    setSelectedIds([]);
    setBulkNotes('');
    setShowBulkDialog(null);
    setActionLoading(null);
  };

  const handleBulkReject = async () => {
    if (!bulkNotes.trim()) return;
    setActionLoading('bulk');
    await bulkReject(selectedIds, bulkNotes);
    setSelectedIds([]);
    setBulkNotes('');
    setShowBulkDialog(null);
    setActionLoading(null);
  };

  const handleBulkRelease = async () => {
    setActionLoading('bulk');
    await bulkRelease(selectedIds);
    setSelectedIds([]);
    setActionLoading(null);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === filteredSubmissions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSubmissions.map(s => s.id));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning/10 text-warning border-warning/20';
      case 'verified': return 'bg-success/10 text-success border-success/20';
      case 'rejected': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'released': return 'bg-primary/10 text-primary border-primary/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Submission Review</h1>
          <p className="text-sm text-muted-foreground">Review and moderate task submissions</p>
        </div>
        <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4">
        <Card className="p-3">
          <div className="text-xs text-muted-foreground">Total</div>
          <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
        </Card>
        <Card className="p-3 border-warning/30">
          <div className="text-xs text-warning">Pending</div>
          <div className="text-xl sm:text-2xl font-bold text-warning">{stats.pending}</div>
        </Card>
        <Card className="p-3 border-success/30">
          <div className="text-xs text-success">Verified</div>
          <div className="text-xl sm:text-2xl font-bold text-success">{stats.verified}</div>
        </Card>
        <Card className="p-3 border-destructive/30">
          <div className="text-xs text-destructive">Rejected</div>
          <div className="text-xl sm:text-2xl font-bold text-destructive">{stats.rejected}</div>
        </Card>
        <Card className="p-3 border-primary/30 col-span-2 sm:col-span-1">
          <div className="text-xs text-primary">Released</div>
          <div className="text-xl sm:text-2xl font-bold text-primary">{stats.released}</div>
        </Card>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <Card className="p-3 bg-primary/5 border-primary/20">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{selectedIds.length} selected</span>
            <div className="flex-1" />
            {filter === 'pending' && (
              <>
                <Button size="sm" variant="outline" onClick={() => setShowBulkDialog('approve')}>
                  <CheckCircle className="w-4 h-4 mr-2 text-success" />
                  Approve All
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowBulkDialog('reject')}>
                  <XCircle className="w-4 h-4 mr-2 text-destructive" />
                  Reject All
                </Button>
              </>
            )}
            {filter === 'verified' && (
              <Button size="sm" variant="outline" onClick={handleBulkRelease} disabled={actionLoading === 'bulk'}>
                {actionLoading === 'bulk' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCheck className="w-4 h-4 mr-2 text-primary" />}
                Release All
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
              Clear
            </Button>
          </div>
        </Card>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-4">
        <Checkbox 
          checked={selectedIds.length === filteredSubmissions.length && filteredSubmissions.length > 0}
          onCheckedChange={selectAll}
        />
        <Tabs value={filter} onValueChange={(v) => { setFilter(v as FilterStatus); setSelectedIds([]); }}>
          <TabsList className="w-full sm:w-auto grid grid-cols-5 sm:flex">
            <TabsTrigger value="pending" className="text-xs sm:text-sm">Pending</TabsTrigger>
            <TabsTrigger value="verified" className="text-xs sm:text-sm">Verified</TabsTrigger>
            <TabsTrigger value="rejected" className="text-xs sm:text-sm">Rejected</TabsTrigger>
            <TabsTrigger value="released" className="text-xs sm:text-sm">Released</TabsTrigger>
            <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Submissions List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <Card className="py-12">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Inbox className="w-12 h-12" />
            <p>No {filter === 'all' ? '' : filter} submissions</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredSubmissions.map((submission) => (
            <Card key={submission.id} className="overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
                <Checkbox 
                  checked={selectedIds.includes(submission.id)}
                  onCheckedChange={() => toggleSelect(submission.id)}
                />
                
                {/* Platform & Task Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <PlatformIcon icon={submission.platform.toLowerCase()} size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm truncate">@{submission.platform_username}</span>
                      <Badge variant="secondary" className="text-xs">
                        {taskLabels[submission.task_type as keyof typeof taskLabels] || submission.task_type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{submission.platform}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(submission.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>

                {/* Status & Reward */}
                <div className="flex items-center gap-2 sm:gap-4">
                  <Badge className={`${getStatusColor(submission.status)} text-xs`}>
                    {submission.status}
                  </Badge>
                  <CapsuleBadge amount={submission.capsules_earned} size="sm" />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 sm:ml-4">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedSubmission(submission)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  {submission.status === 'pending' && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-success hover:text-success"
                        onClick={() => handleApprove(submission)}
                        disabled={actionLoading === submission.id}
                      >
                        {actionLoading === submission.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => { setSelectedSubmission(submission); setReviewNotes(''); }}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  {submission.status === 'verified' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary"
                      onClick={() => handleRelease(submission)}
                      disabled={actionLoading === submission.id}
                    >
                      {actionLoading === submission.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(submission.id)}
                    disabled={actionLoading === submission.id}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Submission Detail Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Review Submission
              {selectedSubmission && (
                <Badge className={getStatusColor(selectedSubmission.status)}>
                  {selectedSubmission.status}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>Review task details and take action</DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <PlatformIcon icon={selectedSubmission.platform.toLowerCase()} size={16} />
                      {selectedSubmission.platform} - {taskLabels[selectedSubmission.task_type as keyof typeof taskLabels]}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Username:</span>
                      <span className="font-medium">@{selectedSubmission.platform_username}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Timer className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Time spent:</span>
                      <span>{selectedSubmission.timer_seconds}s</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Submitted:</span>
                      <span>{formatDistanceToNow(new Date(selectedSubmission.created_at), { addSuffix: true })}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Verification Question
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="p-2 rounded bg-muted/50 text-sm">
                      {selectedSubmission.content_question}
                    </div>
                    <div className="p-2 rounded bg-primary/5 border border-primary/20 text-sm">
                      <span className="text-muted-foreground">Answer: </span>
                      {selectedSubmission.content_answer}
                    </div>
                  </CardContent>
                </Card>

                {selectedSubmission.screenshot_url && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        Screenshot Proof
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <a href={selectedSubmission.screenshot_url} target="_blank" rel="noopener noreferrer" className="block">
                        <img 
                          src={selectedSubmission.screenshot_url} 
                          alt="Task screenshot" 
                          className="w-full rounded-lg border max-h-64 object-contain bg-muted"
                        />
                      </a>
                    </CardContent>
                  </Card>
                )}

                {selectedSubmission.status === 'pending' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Review Notes</label>
                    <Textarea
                      placeholder="Add notes (required for rejection)..."
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      rows={2}
                    />
                  </div>
                )}

                {selectedSubmission.review_notes && (
                  <Card className="border-warning/30">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <span className="font-medium">Review notes: </span>
                          {selectedSubmission.review_notes}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          )}

          <DialogFooter className="flex-row gap-2 sm:gap-0">
            {selectedSubmission?.status === 'pending' && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => handleReject(selectedSubmission)}
                  disabled={actionLoading === selectedSubmission.id || !reviewNotes.trim()}
                >
                  {actionLoading === selectedSubmission.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                  Reject
                </Button>
                <Button
                  className="bg-success hover:bg-success/90"
                  onClick={() => handleApprove(selectedSubmission)}
                  disabled={actionLoading === selectedSubmission.id}
                >
                  {actionLoading === selectedSubmission.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Approve
                </Button>
              </>
            )}
            {selectedSubmission?.status === 'verified' && (
              <Button
                className="bg-primary"
                onClick={() => handleRelease(selectedSubmission)}
                disabled={actionLoading === selectedSubmission.id}
              >
                {actionLoading === selectedSubmission.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCheck className="w-4 h-4 mr-2" />}
                Release Capsules
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Action Dialog */}
      <Dialog open={!!showBulkDialog} onOpenChange={() => setShowBulkDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {showBulkDialog === 'approve' ? 'Bulk Approve' : 'Bulk Reject'} {selectedIds.length} Submissions
            </DialogTitle>
            <DialogDescription>
              {showBulkDialog === 'approve' 
                ? 'Add optional notes for approval'
                : 'Provide a reason for rejection (required)'}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={showBulkDialog === 'approve' ? 'Optional notes...' : 'Rejection reason (required)...'}
            value={bulkNotes}
            onChange={(e) => setBulkNotes(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDialog(null)}>Cancel</Button>
            <Button 
              onClick={showBulkDialog === 'approve' ? handleBulkApprove : handleBulkReject}
              disabled={actionLoading === 'bulk' || (showBulkDialog === 'reject' && !bulkNotes.trim())}
              variant={showBulkDialog === 'reject' ? 'destructive' : 'default'}
            >
              {actionLoading === 'bulk' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {showBulkDialog === 'approve' ? 'Approve All' : 'Reject All'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
