'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  QrCode,
  AlertCircle,
  Save,
  Copy,
  CheckCircle2,
  ArrowLeft,
  Calendar,
  BarChart3,
  Settings,
  Code,
  List,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';

interface Tool {
  id: string;
  name: string;
  description: string | null;
  type: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    qrCodes: number;
  };
}

interface QRCode {
  id: string;
  code: string;
  metadata: any;
  expiresAt: string | null;
  createdAt: string;
  usageCount: number;
  maxUses: number | null;
}

export default function QRToolDetailPage() {
  const router = useRouter();
  const params = useParams();
  const toolId = params.toolId as string;

  const [tool, setTool] = useState<Tool | null>(null);
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });

  useEffect(() => {
    const fetchToolData = async () => {
      const adminStr = localStorage.getItem('admin');
      if (!adminStr) {
        router.push('/login');
        return;
      }

      try {
        const admin = JSON.parse(adminStr);

        // Fetch tool details
        const toolResponse = await fetch(`/api/admin/tools/${toolId}?adminId=${admin.id}`);
        if (!toolResponse.ok) {
          throw new Error('Failed to fetch tool');
        }
        const toolData = await toolResponse.json();
        setTool(toolData);
        setFormData({
          name: toolData.name,
          description: toolData.description || '',
          isActive: toolData.isActive,
        });

        // Fetch QR codes for this tool
        const qrResponse = await fetch(`/api/admin/tools/${toolId}/qrcodes?adminId=${admin.id}`);
        if (qrResponse.ok) {
          const qrData = await qrResponse.json();
          setQrCodes(qrData.qrCodes || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tool data');
      } finally {
        setLoading(false);
      }
    };

    fetchToolData();
  }, [toolId, router]);

  const handleSave = async () => {
    const adminStr = localStorage.getItem('admin');
    if (!adminStr) return;

    setSaving(true);
    try {
      const admin = JSON.parse(adminStr);
      const response = await fetch(`/api/admin/tools/${toolId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: admin.id,
          name: formData.name,
          description: formData.description || null,
          isActive: formData.isActive,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update tool');
      }

      const updatedTool = await response.json();
      setTool(updatedTool);

      setSuccess('Tool updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tool');
      setTimeout(() => setError(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading tool details...</div>;
  }

  if (error || !tool) {
    return (
      <div className="space-y-4">
        <Link href="/qr-codes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to QR Codes
          </Button>
        </Link>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Tool not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const integrationExample = `{
  "tool_id": "${tool.id}",
  "manychat_user_id": "{{user_id}}",
  "type": "promotion",
  "expires_in_days": 30,
  "metadata": {
    "campaign": "your_campaign_name"
  }
}`;

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            {success}
          </AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/qr-codes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{tool.name}</h1>
              {!tool.isActive && (
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                  Inactive
                </Badge>
              )}
            </div>
            {tool.description && (
              <p className="text-muted-foreground mt-1">{tool.description}</p>
            )}
          </div>
        </div>
        <QrCode className="h-8 w-8 text-primary" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="integration">Integration</TabsTrigger>
          <TabsTrigger value="items">QR Codes ({qrCodes.length})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total QR Codes</CardTitle>
                <QrCode className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{qrCodes.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Codes</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {qrCodes.filter((qr) => !qr.expiresAt || new Date(qr.expiresAt) > new Date()).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {qrCodes.reduce((sum, qr) => sum + qr.usageCount, 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tool Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Tool ID:</div>
                <div className="font-mono">{tool.id}</div>
                <div className="text-muted-foreground">Type:</div>
                <div>QR Generator</div>
                <div className="text-muted-foreground">Status:</div>
                <div>{tool.isActive ? 'Active' : 'Inactive'}</div>
                <div className="text-muted-foreground">Created:</div>
                <div>{formatDate(tool.createdAt)}</div>
                <div className="text-muted-foreground">Last Updated:</div>
                <div>{formatDate(tool.updatedAt)}</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tool Settings</CardTitle>
              <CardDescription>Update your QR code generator configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tool Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My QR Generator"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this QR generator is for..."
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isActive">Active (allows new QR code generation)</Label>
              </div>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integration Tab */}
        <TabsContent value="integration" className="space-y-4">
          <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-900/20">
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              Use this tool ID in your Manychat automation to generate QR codes specific to this tool.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Tool ID</CardTitle>
              <CardDescription>Use this ID in your API requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-lg bg-muted p-3 font-mono text-sm break-all">
                  {tool.id}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(tool.id, 'toolId')}
                >
                  {copied === 'toolId' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manychat Integration Example</CardTitle>
              <CardDescription>
                Use this JSON in your External Request action to generate QR codes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-start gap-2">
                  <pre className="flex-1 rounded-lg bg-muted p-3 font-mono text-sm overflow-x-auto">
{integrationExample}
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(integrationExample, 'example')}
                  >
                    {copied === 'example' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <Alert>
                <AlertDescription className="text-xs">
                  <strong>Important:</strong> Keep the double curly braces {`"{{user_id}}"`} exactly as shown.
                  Manychat will automatically replace this with the actual user ID.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Items (QR Codes) Tab */}
        <TabsContent value="items" className="space-y-4">
          {qrCodes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <QrCode className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No QR Codes Yet</h3>
                <p className="text-muted-foreground text-center">
                  QR codes will appear here when users interact with your Manychat automation
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Generated QR Codes</CardTitle>
                <CardDescription>All QR codes created by this tool</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {qrCodes.map((qr) => (
                    <div
                      key={qr.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-mono text-sm">{qr.code}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Created: {formatDate(qr.createdAt)}
                          {qr.expiresAt && ` • Expires: ${formatDate(qr.expiresAt)}`}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {qr.usageCount} scans
                        {qr.maxUses && ` / ${qr.maxUses}`}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usage Analytics</CardTitle>
              <CardDescription>Performance metrics for this QR generator</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Average Scans per Code</div>
                  <div className="text-2xl font-bold">
                    {qrCodes.length > 0
                      ? (qrCodes.reduce((sum, qr) => sum + qr.usageCount, 0) / qrCodes.length).toFixed(1)
                      : '0'}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Codes Created This Month</div>
                  <div className="text-2xl font-bold">
                    {qrCodes.filter((qr) => {
                      const created = new Date(qr.createdAt);
                      const now = new Date();
                      return (
                        created.getMonth() === now.getMonth() &&
                        created.getFullYear() === now.getFullYear()
                      );
                    }).length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
