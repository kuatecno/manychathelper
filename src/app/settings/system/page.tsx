'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Database, Users, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JobStatus {
  running: boolean;
  lastRun?: string;
  status?: 'success' | 'error' | 'running';
  message?: string;
  details?: any;
}

export default function SystemPage() {
  const [manychatSync, setManychatSync] = useState<JobStatus>({ running: false });
  const [cacheRefresh, setCacheRefresh] = useState<JobStatus>({ running: false });

  const triggerManychatSync = async () => {
    setManychatSync({ running: true, status: 'running', message: 'Starting Manychat sync...' });

    try {
      const res = await fetch('/api/manychat/sync/daily', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || ''}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setManychatSync({
          running: false,
          status: 'success',
          lastRun: new Date().toISOString(),
          message: 'Sync completed successfully',
          details: data,
        });
      } else {
        setManychatSync({
          running: false,
          status: 'error',
          lastRun: new Date().toISOString(),
          message: data.error || 'Sync failed',
          details: data,
        });
      }
    } catch (error) {
      setManychatSync({
        running: false,
        status: 'error',
        lastRun: new Date().toISOString(),
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const triggerCacheRefresh = async () => {
    setCacheRefresh({ running: true, status: 'running', message: 'Refreshing cache...' });

    try {
      const res = await fetch('/api/cron/flowkick-refresh-cache', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || ''}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setCacheRefresh({
          running: false,
          status: 'success',
          lastRun: new Date().toISOString(),
          message: 'Cache refresh completed',
          details: data,
        });
      } else {
        setCacheRefresh({
          running: false,
          status: 'error',
          lastRun: new Date().toISOString(),
          message: data.error || 'Cache refresh failed',
          details: data,
        });
      }
    } catch (error) {
      setCacheRefresh({
        running: false,
        status: 'error',
        lastRun: new Date().toISOString(),
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status?: JobStatus['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status?: JobStatus['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'running':
        return <Badge variant="secondary">Running</Badge>;
      default:
        return <Badge variant="outline">Idle</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Maintenance</h1>
        <p className="text-muted-foreground">
          Manually trigger system jobs and maintenance tasks
        </p>
      </div>

      {/* Manychat Sync */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Manychat Contact Sync</CardTitle>
                <CardDescription>Sync contacts, tags, and custom fields from Manychat</CardDescription>
              </div>
            </div>
            {getStatusBadge(manychatSync.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Info */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              {getStatusIcon(manychatSync.status)}
              <div>
                <p className="text-sm font-medium">
                  {manychatSync.message || 'Ready to sync'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Last run: {formatDate(manychatSync.lastRun)}
                </p>
              </div>
            </div>
            <Button
              onClick={triggerManychatSync}
              disabled={manychatSync.running}
              size="sm"
            >
              <RefreshCw className={cn('mr-2 h-4 w-4', manychatSync.running && 'animate-spin')} />
              {manychatSync.running ? 'Syncing...' : 'Run Sync'}
            </Button>
          </div>

          {/* Details */}
          {manychatSync.details && (
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-medium mb-2">Sync Details:</p>
              <pre className="text-xs overflow-auto max-h-40">
                {JSON.stringify(manychatSync.details, null, 2)}
              </pre>
            </div>
          )}

          <div className="flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 p-3 text-sm">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-blue-800 dark:text-blue-200">
              <strong>Scheduled:</strong> Runs daily at 2:00 AM (configured in Vercel cron)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flowkick Cache Refresh */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <Database className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle>Flowkick Cache Refresh</CardTitle>
                <CardDescription>Refresh cached social media data (Instagram, TikTok, Google Reviews)</CardDescription>
              </div>
            </div>
            {getStatusBadge(cacheRefresh.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Info */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              {getStatusIcon(cacheRefresh.status)}
              <div>
                <p className="text-sm font-medium">
                  {cacheRefresh.message || 'Ready to refresh'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Last run: {formatDate(cacheRefresh.lastRun)}
                </p>
              </div>
            </div>
            <Button
              onClick={triggerCacheRefresh}
              disabled={cacheRefresh.running}
              size="sm"
              variant="outline"
            >
              <RefreshCw className={cn('mr-2 h-4 w-4', cacheRefresh.running && 'animate-spin')} />
              {cacheRefresh.running ? 'Refreshing...' : 'Refresh Cache'}
            </Button>
          </div>

          {/* Details */}
          {cacheRefresh.details && (
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-medium mb-2">Refresh Results:</p>
              <pre className="text-xs overflow-auto max-h-40">
                {JSON.stringify(cacheRefresh.details, null, 2)}
              </pre>
            </div>
          )}

          <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3 text-sm">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-amber-800 dark:text-amber-200">
              <strong>Manual only:</strong> Automatic refresh disabled due to Vercel plan limits. Trigger manually or cache refreshes on API requests.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">About System Jobs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Manychat Sync:</strong> Updates your local database with the latest contacts, tags, and custom fields from Manychat. Runs daily at 2:00 AM automatically.
          </p>
          <p>
            <strong className="text-foreground">Cache Refresh:</strong> Updates social media content (Instagram posts, TikTok videos, Google reviews) for all active Flowkick clients. Currently manual only due to Vercel plan limits.
          </p>
          <p className="pt-2 text-xs">
            💡 <strong>Tip:</strong> These jobs may take a few seconds to complete. Wait for the status to update before navigating away.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
