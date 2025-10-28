'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Trash2, Tag, FileText, Sparkles, AlertCircle } from 'lucide-react';

interface Tag {
  id: string;
  manychatTagId: string;
  name: string;
}

interface CustomField {
  id: string;
  manychatFieldId: string;
  name: string;
  type: string;
  description: string | null;
}

interface MetadataEntry {
  key: string;
  value: string;
  type: 'static' | 'tag' | 'custom_field';
  fieldType?: string;
}

interface MetadataBuilderProps {
  value: string; // JSON string
  onChange: (value: string) => void;
  toolName: string;
  toolCode: string;
  campaignType: string;
}

const TEMPLATES = {
  discount: {
    name: 'Discount Campaign',
    metadata: {
      campaign_type: 'discount',
      discount_percent: 25,
      min_purchase: 50,
    },
  },
  event: {
    name: 'Event Ticket',
    metadata: {
      campaign_type: 'event',
      event_name: 'VIP Event',
      event_date: '2025-12-31',
      location: 'Main Venue',
    },
  },
  loyalty: {
    name: 'Loyalty Points',
    metadata: {
      campaign_type: 'loyalty',
      points_earned: 100,
      tier: 'gold',
      program_name: 'Rewards',
    },
  },
  product: {
    name: 'Product Promo',
    metadata: {
      campaign_type: 'product',
      product_id: 'PROD-001',
      special_offer: '2x1',
    },
  },
};

export function MetadataBuilder({ value, onChange, toolName, toolCode, campaignType }: MetadataBuilderProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<MetadataEntry[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    loadManychatData();
  }, []);

  useEffect(() => {
    // Parse existing metadata value
    try {
      if (value && value !== '{}') {
        const parsed = JSON.parse(value);
        const newEntries: MetadataEntry[] = [];

        Object.entries(parsed).forEach(([key, val]) => {
          if (key === 'tool_name' || key === 'tool_code' || key === 'campaign_type' || key === 'description') {
            // Skip auto-generated fields
            return;
          }
          newEntries.push({
            key,
            value: String(val),
            type: 'static',
          });
        });

        if (newEntries.length > 0) {
          setEntries(newEntries);
        }
      }
    } catch (e) {
      console.error('Failed to parse metadata:', e);
    }
  }, [value]);

  useEffect(() => {
    // Generate new metadata whenever entries change
    updateMetadata();
  }, [entries, toolName, toolCode, campaignType]);

  const loadManychatData = async () => {
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
      console.error('Failed to load Manychat data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateMetadata = () => {
    const metadata: Record<string, any> = {
      tool_name: toolName,
      tool_code: toolCode,
      campaign_type: campaignType,
    };

    // Add custom entries
    entries.forEach(entry => {
      if (entry.key) {
        // Try to parse as number or boolean
        let parsedValue: any = entry.value;
        if (entry.value === 'true') parsedValue = true;
        else if (entry.value === 'false') parsedValue = false;
        else if (!isNaN(Number(entry.value)) && entry.value !== '') {
          parsedValue = Number(entry.value);
        }

        metadata[entry.key] = parsedValue;
      }
    });

    onChange(JSON.stringify(metadata, null, 2));
  };

  const addEntry = (type: 'static' | 'tag' | 'custom_field') => {
    setEntries([
      ...entries,
      {
        key: '',
        value: '',
        type,
      },
    ]);
  };

  const updateEntry = (index: number, field: keyof MetadataEntry, value: string) => {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setEntries(newEntries);
  };

  const removeEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  const applyTemplate = (templateKey: keyof typeof TEMPLATES) => {
    const template = TEMPLATES[templateKey];
    const newEntries: MetadataEntry[] = [];

    Object.entries(template.metadata).forEach(([key, val]) => {
      if (key !== 'campaign_type') { // Skip campaign_type as it's auto-generated
        newEntries.push({
          key,
          value: String(val),
          type: 'static',
        });
      }
    });

    setEntries(newEntries);
  };

  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'tag':
        return <Tag className="h-4 w-4" />;
      case 'custom_field':
        return <FileText className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading Manychat data...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Templates */}
      <div className="space-y-2">
        <Label>Quick Start Templates</Label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(TEMPLATES).map(([key, template]) => (
            <Button
              key={key}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyTemplate(key as keyof typeof TEMPLATES)}
            >
              {template.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Core Fields (Auto-generated) */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          <strong>Auto-generated fields:</strong> tool_name, tool_code, campaign_type
          <br />
          Add your custom metadata fields below
        </AlertDescription>
      </Alert>

      {/* Add Buttons */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addEntry('static')}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Static Value
        </Button>
        {tags.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addEntry('tag')}
          >
            <Tag className="mr-2 h-4 w-4" />
            Add Tag Reference
          </Button>
        )}
        {customFields.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addEntry('custom_field')}
          >
            <FileText className="mr-2 h-4 w-4" />
            Add Custom Field
          </Button>
        )}
      </div>

      {/* Entries */}
      <div className="space-y-2">
        {entries.map((entry, index) => (
          <Card key={index}>
            <CardContent className="pt-4">
              <div className="flex items-start gap-2">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Key</Label>
                    <Input
                      placeholder="discount_percent"
                      value={entry.key}
                      onChange={(e) => updateEntry(index, 'key', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs flex items-center gap-1">
                      {getFieldIcon(entry.type)}
                      Value
                    </Label>
                    {entry.type === 'tag' ? (
                      <Select
                        value={entry.value}
                        onValueChange={(val) => updateEntry(index, 'value', val)}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Select tag" />
                        </SelectTrigger>
                        <SelectContent>
                          {tags.map((tag) => (
                            <SelectItem key={tag.id} value={tag.manychatTagId}>
                              {tag.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : entry.type === 'custom_field' ? (
                      <Select
                        value={entry.value}
                        onValueChange={(val) => updateEntry(index, 'value', val)}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          {customFields.map((field) => (
                            <SelectItem key={field.id} value={field.manychatFieldId}>
                              {field.name} ({field.type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        placeholder="25 or true or text"
                        value={entry.value}
                        onChange={(e) => updateEntry(index, 'value', e.target.value)}
                        className="text-sm"
                      />
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeEntry(index)}
                  className="mt-6"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {entries.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          No custom metadata fields added. Click the buttons above to add fields.
        </div>
      )}

      {/* Advanced Mode Toggle */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Label className="text-sm">Show Raw JSON</Label>
        <Switch checked={showAdvanced} onCheckedChange={setShowAdvanced} />
      </div>

      {/* Raw JSON Preview */}
      {showAdvanced && (
        <div className="rounded-lg bg-muted p-4">
          <pre className="text-xs overflow-x-auto">
            {value}
          </pre>
        </div>
      )}

      {/* Help Text */}
      {(tags.length === 0 && customFields.length === 0) && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>No Manychat data synced yet.</strong> Go to Settings → Manychat Integration to sync your tags and custom fields.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
