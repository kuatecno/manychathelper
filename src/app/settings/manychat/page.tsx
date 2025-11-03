'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle, BookOpen, Tag, FileText } from 'lucide-react';
import Link from 'next/link';

export default function ManychatSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncingTags, setSyncingTags] = useState(false);
  const [syncingFields, setSyncingFields] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [config, setConfig] = useState({
    apiToken: '',
    pageId: '',
    syncEnabled: true,
    webhookSecret: '',
  });
  const [testResult, setTestResult] = useState<any>(null);
  const [syncResult, setSyncResult] = useState<any>(null);

  // Tag and field counts for navigation cards
  const [tags, setTags] = useState<any[]>([]);
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    // Set webhook URL client-side only to avoid hydration error
    setWebhookUrl(`${window.location.origin}/api/manychat/webhook`);

    // Validate admin
    const adminStr = localStorage.getItem('admin');
    if (!adminStr) {
      setError('Please log in to access settings');
      router.push('/login');
      return;
    }

    try {
      const admin = JSON.parse(adminStr);
      if (!admin.id) {
        setError('Invalid admin session. Please log in again');
        router.push('/login');
        return;
      }
    } catch (err) {
      setError('Invalid admin session. Please log in again');
      router.push('/login');
      return;
    }

    loadConfig();
    loadTagsAndFields();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const admin = JSON.parse(localStorage.getItem('admin') || '{}');
      const res = await fetch(`/api/manychat/config?admin_id=${admin.id}`);

      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setConfig({
            apiToken: data.config.apiToken || '',
            pageId: data.config.pageId || '',
            syncEnabled: data.config.syncEnabled ?? true,
            webhookSecret: data.config.webhookSecret || '',
          });
        }
      }
    } catch (err) {
      console.error('Failed to load config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const admin = JSON.parse(localStorage.getItem('admin') || '{}');
      const res = await fetch('/api/manychat/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: admin.id,
          ...config,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.details ? `${data.error} ${data.details}` : data.error || 'Failed to save configuration';
        setError(errorMsg);
        if (res.status === 404) {
          setTimeout(() => router.push('/login'), 3000);
        }
        return;
      }

      setSuccess('Configuration saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setError('');
    setTestResult(null);

    try {
      const admin = JSON.parse(localStorage.getItem('admin') || '{}');
      const res = await fetch('/api/manychat/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: admin.id,
          api_token: config.apiToken,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.details ? `${data.error}\n${data.details}` : data.error || 'Connection test failed';
        setError(errorMsg);
        return;
      }

      setTestResult(data);
      setSuccess('Connection test successful!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred during connection test';
      setError(errorMsg);
    } finally {
      setTesting(false);
    }
  };

  const handleSyncTags = async () => {
    setSyncingTags(true);
    setError('');
    setSyncResult(null);

    try {
      const admin = JSON.parse(localStorage.getItem('admin') || '{}');
      const res = await fetch('/api/manychat/sync/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_id: admin.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to sync tags');
        return;
      }

      setSyncResult({ type: 'tags', ...data });
      setSuccess(`Synced ${data.synced} tags successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('An error occurred while syncing tags');
    } finally {
      setSyncingTags(false);
    }
  };

  const handleSyncFields = async () => {
    setSyncingFields(true);
    setError('');
    setSyncResult(null);

    try {
      const admin = JSON.parse(localStorage.getItem('admin') || '{}');
      const res = await fetch('/api/manychat/sync/fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_id: admin.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to sync custom fields');
        return;
      }

      setSyncResult({ type: 'fields', ...data });
      setSuccess(`Synced ${data.synced} custom fields successfully!`);
      setTimeout(() => setSuccess(''), 3000);

      // Reload tags and fields
      loadTagsAndFields();
    } catch (err) {
      setError('An error occurred while syncing custom fields');
    } finally {
      setSyncingFields(false);
    }
  };

  const loadTagsAndFields = async () => {
    setLoadingData(true);
    try {
      const adminStr = localStorage.getItem('admin');
      if (!adminStr) return;

      const admin = JSON.parse(adminStr);
      const res = await fetch(`/api/admin/manychat-data?admin_id=${admin.id}`);

      if (res.ok) {
        const data = await res.json();
        setTags(data.tags || []);
        setCustomFields(data.customFields || []);
      }
    } catch (error) {
      console.error('Failed to load tags and fields:', error);
    } finally {
      setLoadingData(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manychat Integration</h1>
          <p className="text-muted-foreground mt-2">
            Configure your Manychat API connection to sync contacts and data
          </p>
        </div>
        <Link href="/settings/manychat/instructions">
          <Button variant="outline">
            <BookOpen className="mr-2 h-4 w-4" />
            Integration Guide
          </Button>
        </Link>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            {success}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>
            Enter your Manychat API credentials. You can generate an API token in your Manychat
            account settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiToken">API Token *</Label>
            <Input
              id="apiToken"
              type="password"
              value={config.apiToken}
              onChange={(e) => setConfig({ ...config, apiToken: e.target.value })}
              placeholder="Enter your Manychat API token"
            />
            <p className="text-xs text-muted-foreground">
              Generate your API token at: Manychat Settings → API
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pageId">Page ID (Optional)</Label>
            <Input
              id="pageId"
              value={config.pageId}
              onChange={(e) => setConfig({ ...config, pageId: e.target.value })}
              placeholder="Your Manychat page ID"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhookSecret">Webhook Secret (Optional)</Label>
            <Input
              id="webhookSecret"
              type="password"
              value={config.webhookSecret}
              onChange={(e) => setConfig({ ...config, webhookSecret: e.target.value })}
              placeholder="Secret for webhook validation"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="syncEnabled">Enable Automatic Sync</Label>
              <p className="text-sm text-muted-foreground">
                Automatically sync data when webhooks are received
              </p>
            </div>
            <Switch
              id="syncEnabled"
              checked={config.syncEnabled}
              onCheckedChange={(checked) => setConfig({ ...config, syncEnabled: checked })}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving || !config.apiToken}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Configuration
            </Button>
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing || !config.apiToken}
            >
              {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>

      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle>Connection Test Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-medium">Connection successful!</span>
              </div>
              {testResult.page && (
                <div className="rounded-lg bg-muted p-3 space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">Page Name:</span> {testResult.page.name}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Page ID:</span> {testResult.page.id}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {config.apiToken && (
        <Card>
          <CardHeader>
            <CardTitle>Sync Data</CardTitle>
            <CardDescription>
              Sync tags and custom fields from your Manychat account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-medium">Tags</h3>
                <p className="text-sm text-muted-foreground">
                  Sync all tags from Manychat to use for contact segmentation
                </p>
                <Button
                  onClick={handleSyncTags}
                  disabled={syncingTags}
                  size="sm"
                  variant="outline"
                  className="w-full"
                >
                  {syncingTags && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sync Tags
                </Button>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Custom Fields</h3>
                <p className="text-sm text-muted-foreground">
                  Sync custom field definitions to store contact data
                </p>
                <Button
                  onClick={handleSyncFields}
                  disabled={syncingFields}
                  size="sm"
                  variant="outline"
                  className="w-full"
                >
                  {syncingFields && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sync Custom Fields
                </Button>
              </div>
            </div>

            {syncResult && (
              <div className="rounded-lg bg-muted p-3 space-y-1">
                <p className="text-sm font-medium">Sync Complete</p>
                <p className="text-sm">
                  <span className="font-medium">Synced:</span> {syncResult.synced}
                </p>
                {syncResult.failed > 0 && (
                  <p className="text-sm text-destructive">
                    <span className="font-medium">Failed:</span> {syncResult.failed}
                  </p>
                )}
              </div>
            )}

            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-2">
                <strong>Note:</strong> Contacts are synced automatically when they interact with your Manychat flows.
                To manually sync a specific contact, you can use the API endpoint with their Manychat subscriber ID.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Management Navigation */}
      {config.apiToken && (
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>
              Manage tags and custom fields for contact segmentation and data storage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                onClick={() => router.push('/settings/manychat/tags')}
                className="cursor-pointer group rounded-lg border p-6 hover:border-primary hover:bg-accent transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Tag className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                      Tags Management
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      View and sync tags from Manychat for contact segmentation
                    </p>
                    {loadingData ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mt-2" />
                    ) : (
                      <p className="text-xs text-muted-foreground mt-2">
                        {tags.length} {tags.length === 1 ? 'tag' : 'tags'} available
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div
                onClick={() => router.push('/settings/manychat/fields')}
                className="cursor-pointer group rounded-lg border p-6 hover:border-primary hover:bg-accent transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                      Custom Fields Management
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Create and manage custom fields for storing contact data
                    </p>
                    {loadingData ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mt-2" />
                    ) : (
                      <p className="text-xs text-muted-foreground mt-2">
                        {customFields.length} {customFields.length === 1 ? 'field' : 'fields'} available
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Webhook Configuration</CardTitle>
          <CardDescription>
            Set up Manychat automations to sync contacts automatically
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              To automatically import contacts when they interact with your Manychat bot, you need to configure an automation with an External Request.
            </p>
            <Button
              onClick={() => router.push('/settings/manychat/instructions')}
              variant="default"
            >
              View Setup Instructions
            </Button>
          </div>
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-2">Webhook URL Reference:</p>
            <div className="rounded-lg bg-muted p-3 font-mono text-sm break-all">
              {webhookUrl || 'Loading...'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
