'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, CheckCircle2, AlertCircle } from 'lucide-react';

export default function WebhookHelperPage() {
  const router = useRouter();
  const [adminId, setAdminId] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Set webhook URL
    setWebhookUrl(`${window.location.origin}/api/manychat/sync/contact`);

    // Get admin ID
    const adminStr = localStorage.getItem('admin');
    if (!adminStr) {
      setError('Please log in to access webhook configuration');
      router.push('/login');
      return;
    }

    try {
      const admin = JSON.parse(adminStr);
      if (!admin.id) {
        setError('Invalid admin session');
        router.push('/login');
        return;
      }
      setAdminId(admin.id);
    } catch (err) {
      setError('Failed to parse admin session');
      router.push('/login');
    }
  }, [router]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const requestBody = `{
  "admin_id": "${adminId}",
  "subscriber_id": {{subscriber_id}}
}`;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!adminId) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Webhook Configuration Helper</h1>
        <p className="text-muted-foreground mt-2">
          Copy these values to configure your Manychat automation
        </p>
      </div>

      <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-900/20">
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          Use these settings in your Manychat automation's "External Request" action to automatically
          sync contacts when they interact with your bot.
        </AlertDescription>
      </Alert>

      {/* Admin ID */}
      <Card>
        <CardHeader>
          <CardTitle>Your Admin ID</CardTitle>
          <CardDescription>This identifies your account in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-lg bg-muted p-3 font-mono text-sm break-all">
              {adminId}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(adminId, 'adminId')}
            >
              {copied === 'adminId' ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Step by Step Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Manychat Automation Setup</CardTitle>
          <CardDescription>Follow these steps to configure your automation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                1
              </div>
              <h3 className="font-semibold">Create Automation</h3>
            </div>
            <p className="text-sm text-muted-foreground ml-8">
              In Manychat, create a new automation with trigger "New Contact" or any other trigger you want
            </p>
          </div>

          {/* Step 2 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                2
              </div>
              <h3 className="font-semibold">Add External Request Action</h3>
            </div>
            <p className="text-sm text-muted-foreground ml-8">
              Add an "External Request" action to your flow
            </p>
          </div>

          {/* Step 3 - Method */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                3
              </div>
              <h3 className="font-semibold">Request Method</h3>
            </div>
            <div className="ml-8 space-y-2">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-muted px-3 py-1 font-mono text-sm">POST</div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard('POST', 'method')}
                >
                  {copied === 'method' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Step 4 - URL */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                4
              </div>
              <h3 className="font-semibold">Request URL</h3>
            </div>
            <div className="ml-8 space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-lg bg-muted p-3 font-mono text-sm break-all">
                  {webhookUrl}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(webhookUrl, 'url')}
                >
                  {copied === 'url' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Step 5 - Headers */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                5
              </div>
              <h3 className="font-semibold">Headers</h3>
            </div>
            <div className="ml-8 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-muted p-2">
                  <p className="text-xs text-muted-foreground mb-1">Key</p>
                  <p className="font-mono text-sm">Content-Type</p>
                </div>
                <div className="rounded-lg bg-muted p-2">
                  <p className="text-xs text-muted-foreground mb-1">Value</p>
                  <p className="font-mono text-sm">application/json</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard('Content-Type: application/json', 'headers')}
              >
                {copied === 'headers' ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                Copy Header
              </Button>
            </div>
          </div>

          {/* Step 6 - Body */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                6
              </div>
              <h3 className="font-semibold">Request Body (JSON)</h3>
            </div>
            <div className="ml-8 space-y-2">
              <div className="flex items-start gap-2">
                <pre className="flex-1 rounded-lg bg-muted p-3 font-mono text-sm overflow-x-auto">
{requestBody}
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(requestBody, 'body')}
                >
                  {copied === 'body' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Alert>
                <AlertDescription className="text-xs">
                  <strong>Important:</strong> Keep the double curly braces {`{{subscriber_id}}`} exactly as shown.
                  Manychat will automatically replace this with the actual subscriber ID.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Section */}
      <Card>
        <CardHeader>
          <CardTitle>Testing</CardTitle>
          <CardDescription>How to verify the integration is working</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Save your automation in Manychat</li>
            <li>Trigger the automation (e.g., send a message to your bot)</li>
            <li>Check the "Contacts" page in this dashboard to see if the contact was synced</li>
            <li>The contact should appear with their Manychat data (name, tags, custom fields, etc.)</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
