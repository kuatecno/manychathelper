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
  MessageSquare,
  AlertCircle,
  Save,
  Copy,
  CheckCircle2,
  ArrowLeft,
  BarChart3,
  Users,
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import { MetadataBuilder } from '@/components/MetadataBuilder';

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
    conversations: number;
  };
}

interface Conversation {
  id: string;
  createdAt: string;
  updatedAt: string;
  user: {
    name: string;
    email: string;
  };
  _count?: {
    messages: number;
  };
}

interface ChatConfig {
  defaultContext: string;
}

const defaultChatConfig: ChatConfig = {
  defaultContext: '{}',
};

export default function AIChatToolDetailPage() {
  const router = useRouter();
  const params = useParams();
  const toolId = params.toolId as string;

  const [tool, setTool] = useState<Tool | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
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
  const [configData, setConfigData] = useState<ChatConfig>(defaultChatConfig);

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
            setConfigData(defaultChatConfig);
          }
        }

        // Fetch conversations for this tool
        const conversationsResponse = await fetch(`/api/admin/tools/${toolId}/conversations?adminId=${admin.id}`);
        if (conversationsResponse.ok) {
          const conversationsData = await conversationsResponse.json();
          setConversations(conversationsData.conversations || []);
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
        <Link href="/ai-chat">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to AI Chat
          </Button>
        </Link>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Tool not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Parse tool config to get chat settings
  let chatConfig: any = {};
  try {
    if (tool.config) {
      chatConfig = typeof tool.config === 'string' ? JSON.parse(tool.config) : tool.config;
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

  // Build integration example with all configured settings
  const exampleObj: any = {
    tool_id: tool.id,
    manychat_user_id: "{{user_id}}",
    subscriber_data: "{{subscriber_data|to_json:true}}",
    message: "{{user_message}}",
  };

  // Parse and merge context from config
  let contextObj: any = {
    campaign: campaignSlug,
    tool_name: tool.name,
  };

  if (chatConfig.defaultContext) {
    try {
      const configContext = typeof chatConfig.defaultContext === 'string'
        ? JSON.parse(chatConfig.defaultContext)
        : chatConfig.defaultContext;
      contextObj = { ...contextObj, ...configContext };
    } catch (e) {
      console.error('Failed to parse default context:', e);
    }
  }

  exampleObj.context = contextObj;

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
          <Link href="/ai-chat">
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
        <MessageSquare className="h-8 w-8 text-primary" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="integration">Integration</TabsTrigger>
          <TabsTrigger value="items">Conversations ({conversations.length})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{conversations.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {conversations.reduce((sum, conv) => sum + (conv._count?.messages || 0), 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(conversations.map(c => c.user.email)).size}
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
                <div>AI Chat</div>
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
                  placeholder="My AI Chat"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this AI chat is for..."
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
                <Label htmlFor="isActive">Active (allows new conversations)</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Chat Configuration</CardTitle>
              <CardDescription>
                Configure default context and settings for AI conversations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Default Context</Label>
                <MetadataBuilder
                  value={configData.defaultContext}
                  onChange={(value) =>
                    setConfigData({ ...configData, defaultContext: value })
                  }
                  toolName={formData.name}
                  toolCode={formData.name
                    .toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '_')
                    .replace(/-+/g, '_')
                    .replace(/_+/g, '_')
                    .trim()}
                  campaignType="ai_chat"
                />
                <p className="text-xs text-muted-foreground">
                  Context data to include with each conversation. Can be overridden in Manychat request.
                </p>
              </div>
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
                <CardTitle>Enable AI Chat in Manychat</CardTitle>
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
                    https://flowkick.kua.cl/api/chat/message
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard('https://flowkick.kua.cl/api/chat/message', 'url')}
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

        {/* Items (Conversations) Tab */}
        <TabsContent value="items" className="space-y-4">
          {conversations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Conversations Yet</h3>
                <p className="text-muted-foreground text-center">
                  Conversations will appear here when users interact with your AI chat through Manychat
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>All Conversations</CardTitle>
                <CardDescription>Chat sessions managed by this tool</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{conversation.user.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {conversation._count?.messages || 0} messages
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Started: {formatDate(conversation.createdAt)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Last activity: {formatDate(conversation.updatedAt)}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {conversation.user.email}
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
              <CardTitle>Conversation Analytics</CardTitle>
              <CardDescription>Performance metrics for this AI chat tool</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Average Messages per Conversation</div>
                  <div className="text-2xl font-bold">
                    {conversations.length > 0
                      ? (conversations.reduce((sum, conv) => sum + (conv._count?.messages || 0), 0) / conversations.length).toFixed(1)
                      : '0'}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Conversations This Month</div>
                  <div className="text-2xl font-bold">
                    {conversations.filter((conv) => {
                      const created = new Date(conv.createdAt);
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
