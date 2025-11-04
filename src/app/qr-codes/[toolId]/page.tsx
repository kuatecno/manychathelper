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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Palette,
  Grid3x3,
} from 'lucide-react';
import Link from 'next/link';
import { MetadataBuilder } from '@/components/MetadataBuilder';
import { QRCodeFormatBuilder } from '@/components/QRCodeFormatBuilder';

interface Tool {
  id: string;
  name: string;
  description: string | null;
  type: string;
  isActive: boolean;
  config: string | null;
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

interface QRConfig {
  qrAppearance: {
    width: number;
    margin: number;
    errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
    darkColor: string;
    lightColor: string;
  };
  qrFormat: {
    prefix: string;
    includeUserId: boolean;
    includeTimestamp: boolean;
    includeRandom: boolean;
    customFormat: string;
  };
  qrCodeFormat?: string;
  type: string;
  expiresInDays: number | null;
  defaultMetadata: string;
}

const defaultQRConfig: QRConfig = {
  qrAppearance: {
    width: 300,
    margin: 2,
    errorCorrectionLevel: 'H',
    darkColor: '#000000',
    lightColor: '#FFFFFF',
  },
  qrFormat: {
    prefix: 'QR',
    includeUserId: true,
    includeTimestamp: true,
    includeRandom: true,
    customFormat: '{PREFIX}-{USER_ID}-{TIMESTAMP}-{RANDOM}',
  },
  qrCodeFormat: 'QR-{{id}}',
  type: 'promotion',
  expiresInDays: 30,
  defaultMetadata: '{}',
};

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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });
  const [configData, setConfigData] = useState<QRConfig>(defaultQRConfig);

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

        // Parse and set config
        if (toolData.config) {
          try {
            const parsedConfig = typeof toolData.config === 'string'
              ? JSON.parse(toolData.config)
              : toolData.config;
            setConfigData(parsedConfig);
          } catch (e) {
            console.error('Failed to parse tool config:', e);
            setConfigData(defaultQRConfig);
          }
        }

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
          config: JSON.stringify(configData),
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

  const deleteQRCode = async (qrId: string) => {
    if (!confirm('Are you sure you want to delete this QR code?')) return;

    try {
      const adminStr = localStorage.getItem('admin');
      if (!adminStr) return;

      const admin = JSON.parse(adminStr);
      const response = await fetch(`/api/admin/qrcodes/${qrId}?adminId=${admin.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete QR code');
      }

      // Refresh QR codes list
      setQRCodes(qrCodes.filter(qr => qr.id !== qrId));
      setSuccess('QR code deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete QR code');
      setTimeout(() => setError(''), 5000);
    }
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

  // Parse tool config to get QR settings
  let qrConfig: any = {};
  try {
    if (tool.config) {
      qrConfig = typeof tool.config === 'string' ? JSON.parse(tool.config) : tool.config;
    }
  } catch (e) {
    console.error('Failed to parse tool config:', e);
  }

  // Generate campaign slug from tool name
  const campaignSlug = tool.name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '_')
    .replace(/-+/g, '_')
    .replace(/_+/g, '_')
    .trim();

  // Build integration example with ALL configured settings
  const exampleObj: any = {
    tool_id: tool.id,
    manychat_user_id: "{{user_id}}",
    subscriber_data: "{{subscriber_data|to_json:true}}",
    type: qrConfig.type || "promotion",
  };

  // Add expires_in_days if configured
  if (qrConfig.expiresInDays) {
    exampleObj.expires_in_days = qrConfig.expiresInDays;
  }

  // Parse and merge default metadata from config
  let defaultMeta: any = {
    campaign: campaignSlug,
    tool_name: tool.name,
  };

  if (qrConfig.defaultMetadata) {
    try {
      const configMeta = typeof qrConfig.defaultMetadata === 'string'
        ? JSON.parse(qrConfig.defaultMetadata)
        : qrConfig.defaultMetadata;
      defaultMeta = { ...defaultMeta, ...configMeta };
    } catch (e) {
      console.error('Failed to parse default metadata:', e);
    }
  }

  exampleObj.metadata = defaultMeta;

  // Format with special handling for subscriber_data to avoid double-stringification
  const { subscriber_data, ...rest } = exampleObj;
  const formattedExample = JSON.stringify(rest, null, 2);

  // Insert subscriber_data line after manychat_user_id
  const lines = formattedExample.split('\n');
  const userIdIndex = lines.findIndex(line => line.includes('"manychat_user_id"'));
  if (userIdIndex !== -1) {
    lines.splice(userIdIndex + 1, 0, `  "subscriber_data": ${subscriber_data},`);
  }

  const integrationExample = lines.join('\n');

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
              <CardTitle>Basic Settings</CardTitle>
              <CardDescription>Update tool name, description, and status</CardDescription>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>QR Code Configuration</CardTitle>
              <CardDescription>
                Configure appearance, format, and campaign settings for this QR generator
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="appearance" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="appearance">
                    <Palette className="mr-2 h-4 w-4" />
                    Appearance
                  </TabsTrigger>
                  <TabsTrigger value="format">
                    <Code className="mr-2 h-4 w-4" />
                    Format
                  </TabsTrigger>
                  <TabsTrigger value="campaign">
                    <Settings className="mr-2 h-4 w-4" />
                    Content
                  </TabsTrigger>
                </TabsList>

                {/* Appearance Tab */}
                <TabsContent value="appearance" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="width">Size (pixels)</Label>
                      <Input
                        id="width"
                        type="number"
                        value={configData.qrAppearance.width}
                        onChange={(e) =>
                          setConfigData({
                            ...configData,
                            qrAppearance: {
                              ...configData.qrAppearance,
                              width: parseInt(e.target.value),
                            },
                          })
                        }
                        min={100}
                        max={1000}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="margin">Margin</Label>
                      <Input
                        id="margin"
                        type="number"
                        value={configData.qrAppearance.margin}
                        onChange={(e) =>
                          setConfigData({
                            ...configData,
                            qrAppearance: {
                              ...configData.qrAppearance,
                              margin: parseInt(e.target.value),
                            },
                          })
                        }
                        min={0}
                        max={10}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="darkColor">QR Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="darkColor"
                          type="color"
                          value={configData.qrAppearance.darkColor}
                          onChange={(e) =>
                            setConfigData({
                              ...configData,
                              qrAppearance: {
                                ...configData.qrAppearance,
                                darkColor: e.target.value,
                              },
                            })
                          }
                          className="w-20"
                        />
                        <Input
                          type="text"
                          value={configData.qrAppearance.darkColor}
                          onChange={(e) =>
                            setConfigData({
                              ...configData,
                              qrAppearance: {
                                ...configData.qrAppearance,
                                darkColor: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lightColor">Background Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="lightColor"
                          type="color"
                          value={configData.qrAppearance.lightColor}
                          onChange={(e) =>
                            setConfigData({
                              ...configData,
                              qrAppearance: {
                                ...configData.qrAppearance,
                                lightColor: e.target.value,
                              },
                            })
                          }
                          className="w-20"
                        />
                        <Input
                          type="text"
                          value={configData.qrAppearance.lightColor}
                          onChange={(e) =>
                            setConfigData({
                              ...configData,
                              qrAppearance: {
                                ...configData.qrAppearance,
                                lightColor: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="errorCorrection">Error Correction</Label>
                      <select
                        id="errorCorrection"
                        value={configData.qrAppearance.errorCorrectionLevel}
                        onChange={(e) =>
                          setConfigData({
                            ...configData,
                            qrAppearance: {
                              ...configData.qrAppearance,
                              errorCorrectionLevel: e.target.value as 'L' | 'M' | 'Q' | 'H',
                            },
                          })
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="L">Low (7%)</option>
                        <option value="M">Medium (15%)</option>
                        <option value="Q">Quartile (25%)</option>
                        <option value="H">High (30%)</option>
                      </select>
                    </div>
                  </div>
                </TabsContent>

                {/* Format Tab */}
                <TabsContent value="format" className="space-y-4">
                  <QRCodeFormatBuilder
                    value={configData.qrCodeFormat || 'QR-{{id}}'}
                    onChange={(value) =>
                      setConfigData({ ...configData, qrCodeFormat: value })
                    }
                  />
                </TabsContent>

                {/* Campaign Tab */}
                <TabsContent value="campaign" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="qrType">Default Type</Label>
                    <Select
                      value={configData.type}
                      onValueChange={(value) =>
                        setConfigData({ ...configData, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="promotion">Promotion</SelectItem>
                        <SelectItem value="discount">Discount</SelectItem>
                        <SelectItem value="validation">Validation</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Can be overridden in Manychat request
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiresInDays">Default Expiration (days)</Label>
                    <Input
                      id="expiresInDays"
                      type="number"
                      value={configData.expiresInDays || ''}
                      onChange={(e) =>
                        setConfigData({
                          ...configData,
                          expiresInDays: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                      placeholder="Leave empty for no expiration"
                    />
                    <p className="text-xs text-muted-foreground">
                      Can be overridden in Manychat request
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Validation Data (returned when QR is scanned)</Label>
                    <MetadataBuilder
                      value={configData.defaultMetadata}
                      onChange={(value) =>
                        setConfigData({ ...configData, defaultMetadata: value })
                      }
                      toolName={formData.name}
                      toolCode={formData.name
                        .toLowerCase()
                        .replace(/[^a-z0-9\s-]/g, '')
                        .replace(/\s+/g, '_')
                        .replace(/-+/g, '_')
                        .replace(/_+/g, '_')
                        .trim()}
                      campaignType={configData.type}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save All Changes'}
            </Button>
          </div>
        </TabsContent>

        {/* Integration Tab */}
        <TabsContent value="integration" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  1
                </div>
                <CardTitle>Generate QR Code in Manychat</CardTitle>
              </div>
              <CardDescription>
                Add "External Request" action with these settings:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Request Method */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Request Method</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-lg bg-muted p-3 font-mono text-sm">
                    POST
                  </div>
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

              {/* Request URL */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Request URL</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-lg bg-muted p-3 font-mono text-sm break-all">
                    {window.location.origin}/api/qr/generate
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(`${window.location.origin}/api/qr/generate`, 'url')}
                  >
                    {copied === 'url' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Header */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Header</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Key:</Label>
                    <div className="rounded-lg bg-muted p-2 font-mono text-sm mt-1">
                      Content-Type
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Value:</Label>
                    <div className="rounded-lg bg-muted p-2 font-mono text-sm mt-1">
                      application/json
                    </div>
                  </div>
                </div>
              </div>

              {/* Request Body */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Request Body (JSON)</Label>
                <div className="flex items-start gap-2">
                  <pre className="flex-1 rounded-lg bg-muted p-3 font-mono text-sm overflow-x-auto">
{integrationExample}
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(integrationExample, 'body')}
                  >
                    {copied === 'body' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Important Note */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> Keep the double curly braces {`{{user_id}}`} exactly as shown.
                  Manychat will replace it automatically.
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Generated QR Codes</CardTitle>
                    <CardDescription>All QR codes created by this tool</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid3x3 className="h-4 w-4 mr-2" />
                      Grid
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="h-4 w-4 mr-2" />
                      List
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {viewMode === 'grid' ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {qrCodes.map((qr) => (
                      <Card key={qr.id}>
                        <CardContent className="p-4">
                          <div className="flex flex-col items-center space-y-3">
                            {/* QR Code Image */}
                            <div className="bg-white p-3 rounded-lg border-2">
                              <img
                                src={`/api/qr/image/${encodeURIComponent(qr.code)}`}
                                alt={qr.code}
                                className="w-48 h-48"
                              />
                            </div>

                            {/* QR Code Info */}
                            <div className="w-full space-y-2">
                              <div className="font-mono text-sm text-center break-all px-2">
                                {qr.code}
                              </div>

                              <div className="text-xs text-muted-foreground text-center">
                                Created: {formatDate(qr.createdAt)}
                              </div>

                              {qr.expiresAt && (
                                <div className="text-xs text-muted-foreground text-center">
                                  Expires: {formatDate(qr.expiresAt)}
                                </div>
                              )}

                              <div className="flex items-center justify-center gap-2 text-sm">
                                <Badge variant="secondary">
                                  {qr.usageCount} scans
                                  {qr.maxUses && ` / ${qr.maxUses}`}
                                </Badge>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = `/api/qr/image/${encodeURIComponent(qr.code)}`;
                                    link.download = `${qr.code}.png`;
                                    link.click();
                                  }}
                                >
                                  Download
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteQRCode(qr.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {qrCodes.map((qr) => (
                      <div
                        key={qr.id}
                        className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        {/* Small QR Code Image */}
                        <div className="bg-white p-2 rounded border flex-shrink-0">
                          <img
                            src={`/api/qr/image/${encodeURIComponent(qr.code)}`}
                            alt={qr.code}
                            className="w-16 h-16"
                          />
                        </div>

                        {/* QR Code Info */}
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-sm break-all">{qr.code}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Created: {formatDate(qr.createdAt)}
                            {qr.expiresAt && ` • Expires: ${formatDate(qr.expiresAt)}`}
                          </div>
                        </div>

                        {/* Stats and Actions */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <Badge variant="secondary">
                            {qr.usageCount} scans
                            {qr.maxUses && ` / ${qr.maxUses}`}
                          </Badge>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = `/api/qr/image/${encodeURIComponent(qr.code)}`;
                              link.download = `${qr.code}.png`;
                              link.click();
                            }}
                          >
                            Download
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteQRCode(qr.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
