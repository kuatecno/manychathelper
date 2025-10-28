'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, Wrench, Palette, Code, Settings } from 'lucide-react';
import { format } from 'date-fns';

interface Tool {
  id: string;
  name: string;
  type: string;
  description: string | null;
  active: boolean;
  bookingsCount: number;
  availabilitiesCount: number;
  createdAt: string;
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
  type: string;
  expiresInDays: number | null;
  defaultMetadata: string; // JSON string
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
  type: 'promotion',
  expiresInDays: 30,
  defaultMetadata: '{}',
};

// Helper function to generate slug from tool name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/-+/g, '_') // Replace hyphens with underscores
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .trim();
};

// Generate contextual metadata based on tool configuration
const generateDefaultMetadata = (
  toolName: string,
  description: string,
  campaignType: string
): string => {
  if (!toolName.trim()) {
    return '{}';
  }

  const metadata = {
    tool_name: toolName,
    tool_code: generateSlug(toolName),
    campaign_type: campaignType,
    ...(description.trim() && { description: description }),
  };

  return JSON.stringify(metadata, null, 2);
};

export default function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'qr_generator',
    description: '',
  });
  const [qrConfig, setQRConfig] = useState<QRConfig>(defaultQRConfig);

  useEffect(() => {
    fetchTools();
  }, []);

  // Auto-generate metadata when tool name, description, or campaign type changes
  useEffect(() => {
    if (formData.type === 'qr_generator' && formData.name.trim()) {
      const newMetadata = generateDefaultMetadata(
        formData.name,
        formData.description,
        qrConfig.type
      );

      // Only update if current metadata is empty or matches the old default pattern
      const currentMeta = qrConfig.defaultMetadata.trim();
      if (
        currentMeta === '{}' ||
        currentMeta === '' ||
        currentMeta.includes('"campaign": "summer_sale"')
      ) {
        setQRConfig((prev) => ({ ...prev, defaultMetadata: newMetadata }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.name, formData.description, qrConfig.type]);

  const fetchTools = async () => {
    try {
      const res = await fetch('/api/admin/tools');
      const data = await res.json();
      setTools(data.tools || []);
    } catch (error) {
      console.error('Error fetching tools:', error);
      setTools([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      await fetch(`/api/admin/tools/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      });
      fetchTools();
    } catch (error) {
      console.error('Error updating tool:', error);
    }
  };

  const deleteTool = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tool?')) return;

    try {
      await fetch(`/api/admin/tools/${id}`, {
        method: 'DELETE',
      });
      fetchTools();
    } catch (error) {
      console.error('Error deleting tool:', error);
    }
  };

  const openEditDialog = async (tool: Tool) => {
    setEditingId(tool.id);
    setFormData({
      name: tool.name,
      type: tool.type,
      description: tool.description || '',
    });

    // Fetch full tool config
    try {
      const res = await fetch(`/api/admin/tools/${tool.id}`);
      const data = await res.json();

      if (data.tool.config && tool.type === 'qr_generator') {
        setQRConfig(JSON.parse(data.tool.config));
      }
    } catch (error) {
      console.error('Error fetching tool details:', error);
    }

    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setFormData({ name: '', type: 'qr_generator', description: '' });
    setQRConfig(defaultQRConfig);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Prepare config based on tool type
      let config = null;
      if (formData.type === 'qr_generator') {
        config = qrConfig;
      }

      const url = editingId ? `/api/admin/tools/${editingId}` : '/api/admin/tools';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          config: config ? JSON.stringify(config) : null,
        }),
      });

      if (res.ok) {
        closeDialog();
        fetchTools();
      }
    } catch (error) {
      console.error(`Error ${editingId ? 'updating' : 'creating'} tool:`, error);
    }
  };

  const generatePreviewCode = () => {
    let preview = qrConfig.qrFormat.customFormat;
    preview = preview.replace('{PREFIX}', qrConfig.qrFormat.prefix);
    preview = preview.replace('{USER_ID}', 'clx8h2j9');
    preview = preview.replace('{TIMESTAMP}', Date.now().toString());
    preview = preview.replace('{RANDOM}', 'a7k9p2');
    preview = preview.replace('{TYPE}', qrConfig.type.toUpperCase());
    return preview;
  };

  const getToolTypeBadge = (type: string) => {
    const badges: Record<string, { label: string; variant: any }> = {
      qr_generator: { label: 'QR Generator', variant: 'default' },
      ai_chat: { label: 'AI Chat', variant: 'default' },
      ai_assistant: { label: 'AI Assistant', variant: 'default' },
      booking: { label: 'Booking', variant: 'secondary' },
      form_builder: { label: 'Form Builder', variant: 'outline' },
      event_rsvp: { label: 'Event RSVP', variant: 'outline' },
      poll: { label: 'Poll', variant: 'outline' },
      waitlist: { label: 'Waitlist', variant: 'outline' },
    };

    const badge = badges[type] || { label: type, variant: 'outline' };
    return <Badge variant={badge.variant}>{badge.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tools</h1>
          <p className="text-muted-foreground">
            Manage mini-applications that users can access through Manychat
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Tool
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Tool' : 'Add New Tool'}</DialogTitle>
              <DialogDescription>
                {editingId
                  ? 'Update the tool configuration.'
                  : 'Create a new tool for users to interact with via Manychat.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tool type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="qr_generator">QR Generator</SelectItem>
                      <SelectItem value="ai_chat">AI Chat</SelectItem>
                      <SelectItem value="ai_assistant">AI Assistant</SelectItem>
                      <SelectItem value="booking">Booking</SelectItem>
                      <SelectItem value="form_builder">Form Builder</SelectItem>
                      <SelectItem value="event_rsvp">Event RSVP</SelectItem>
                      <SelectItem value="poll">Poll</SelectItem>
                      <SelectItem value="waitlist">Waitlist</SelectItem>
                    </SelectContent>                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                {/* QR Generator Configuration */}
                {formData.type === 'qr_generator' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">QR Code Configuration</CardTitle>
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
                            Campaign
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
                                value={qrConfig.qrAppearance.width}
                                onChange={(e) =>
                                  setQRConfig({
                                    ...qrConfig,
                                    qrAppearance: {
                                      ...qrConfig.qrAppearance,
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
                                value={qrConfig.qrAppearance.margin}
                                onChange={(e) =>
                                  setQRConfig({
                                    ...qrConfig,
                                    qrAppearance: {
                                      ...qrConfig.qrAppearance,
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
                                  value={qrConfig.qrAppearance.darkColor}
                                  onChange={(e) =>
                                    setQRConfig({
                                      ...qrConfig,
                                      qrAppearance: {
                                        ...qrConfig.qrAppearance,
                                        darkColor: e.target.value,
                                      },
                                    })
                                  }
                                  className="w-20"
                                />
                                <Input
                                  type="text"
                                  value={qrConfig.qrAppearance.darkColor}
                                  onChange={(e) =>
                                    setQRConfig({
                                      ...qrConfig,
                                      qrAppearance: {
                                        ...qrConfig.qrAppearance,
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
                                  value={qrConfig.qrAppearance.lightColor}
                                  onChange={(e) =>
                                    setQRConfig({
                                      ...qrConfig,
                                      qrAppearance: {
                                        ...qrConfig.qrAppearance,
                                        lightColor: e.target.value,
                                      },
                                    })
                                  }
                                  className="w-20"
                                />
                                <Input
                                  type="text"
                                  value={qrConfig.qrAppearance.lightColor}
                                  onChange={(e) =>
                                    setQRConfig({
                                      ...qrConfig,
                                      qrAppearance: {
                                        ...qrConfig.qrAppearance,
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
                                value={qrConfig.qrAppearance.errorCorrectionLevel}
                                onChange={(e) =>
                                  setQRConfig({
                                    ...qrConfig,
                                    qrAppearance: {
                                      ...qrConfig.qrAppearance,
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
                          <div className="space-y-2">
                            <Label htmlFor="prefix">Prefix</Label>
                            <Input
                              id="prefix"
                              value={qrConfig.qrFormat.prefix}
                              onChange={(e) =>
                                setQRConfig({
                                  ...qrConfig,
                                  qrFormat: { ...qrConfig.qrFormat, prefix: e.target.value },
                                })
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Include in QR Code:</Label>
                            <div className="space-y-2">
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={qrConfig.qrFormat.includeUserId}
                                  onChange={(e) =>
                                    setQRConfig({
                                      ...qrConfig,
                                      qrFormat: {
                                        ...qrConfig.qrFormat,
                                        includeUserId: e.target.checked,
                                      },
                                    })
                                  }
                                  className="h-4 w-4"
                                />
                                <span className="text-sm">User ID</span>
                              </label>
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={qrConfig.qrFormat.includeTimestamp}
                                  onChange={(e) =>
                                    setQRConfig({
                                      ...qrConfig,
                                      qrFormat: {
                                        ...qrConfig.qrFormat,
                                        includeTimestamp: e.target.checked,
                                      },
                                    })
                                  }
                                  className="h-4 w-4"
                                />
                                <span className="text-sm">Timestamp</span>
                              </label>
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={qrConfig.qrFormat.includeRandom}
                                  onChange={(e) =>
                                    setQRConfig({
                                      ...qrConfig,
                                      qrFormat: {
                                        ...qrConfig.qrFormat,
                                        includeRandom: e.target.checked,
                                      },
                                    })
                                  }
                                  className="h-4 w-4"
                                />
                                <span className="text-sm">Random string</span>
                              </label>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="customFormat">Custom Format</Label>
                            <Input
                              id="customFormat"
                              value={qrConfig.qrFormat.customFormat}
                              onChange={(e) =>
                                setQRConfig({
                                  ...qrConfig,
                                  qrFormat: {
                                    ...qrConfig.qrFormat,
                                    customFormat: e.target.value,
                                  },
                                })
                              }
                            />
                            <p className="text-xs text-muted-foreground">
                              Variables: {'{PREFIX}'}, {'{TYPE}'}, {'{USER_ID}'}, {'{TIMESTAMP}'},{' '}
                              {'{RANDOM}'}
                            </p>
                          </div>

                          <div className="rounded-lg border bg-muted/50 p-4">
                            <Label className="text-sm font-semibold">Preview:</Label>
                            <p className="mt-2 font-mono text-sm">{generatePreviewCode()}</p>
                          </div>
                        </TabsContent>

                        {/* Campaign Tab */}
                        <TabsContent value="campaign" className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="qrType">Default Type</Label>
                            <Select
                              value={qrConfig.type}
                              onValueChange={(value) =>
                                setQRConfig({ ...qrConfig, type: value })
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
                              value={qrConfig.expiresInDays || ''}
                              onChange={(e) =>
                                setQRConfig({
                                  ...qrConfig,
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
                            <Label htmlFor="metadata">Default Metadata (JSON)</Label>
                            <Textarea
                              id="metadata"
                              value={qrConfig.defaultMetadata}
                              onChange={(e) =>
                                setQRConfig({ ...qrConfig, defaultMetadata: e.target.value })
                              }
                              placeholder='{\n  "tool_name": "Your Tool Name",\n  "tool_code": "your_tool_name",\n  "campaign_type": "promotion",\n  "description": "Tool description"\n}'
                              rows={6}
                              className="font-mono text-xs"
                            />
                            <p className="text-xs text-muted-foreground">
                              Auto-generated from tool name and configuration. Can be merged with Manychat request metadata
                            </p>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeDialog}
                >
                  Cancel
                </Button>
                <Button type="submit">{editingId ? 'Update Tool' : 'Create Tool'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            All Tools ({tools.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tools.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              No tools found. Add your first tool to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead>Availability</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tools.map((tool) => (
                  <TableRow key={tool.id}>
                    <TableCell className="font-medium">{tool.name}</TableCell>
                    <TableCell>{getToolTypeBadge(tool.type)}</TableCell>
                    <TableCell>{tool.description || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={tool.active ? 'success' : 'secondary'}>
                        {tool.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{tool.bookingsCount}</TableCell>
                    <TableCell>{tool.availabilitiesCount} slots</TableCell>
                    <TableCell>
                      {format(new Date(tool.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleActive(tool.id, tool.active)}
                        >
                          {tool.active ? '⏸' : '▶️'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(tool)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteTool(tool.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
