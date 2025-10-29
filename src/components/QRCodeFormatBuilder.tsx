'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Trash2, Tag, FileText, AlertCircle, Settings2, Hash, Shuffle } from 'lucide-react';

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

interface FormatPart {
  type: 'static' | 'tag' | 'custom_field' | 'system_field' | 'random';
  value: string;
  displayName?: string;
  length?: number; // For random strings
}

interface QRCodeFormatBuilderProps {
  value: string; // The format pattern string
  onChange: (value: string) => void;
}

const SYSTEM_FIELDS = [
  { id: 'first_name', name: 'First Name' },
  { id: 'last_name', name: 'Last Name' },
  { id: 'full_name', name: 'Full Name' },
  { id: 'email', name: 'Email' },
  { id: 'phone', name: 'Phone' },
  { id: 'id', name: 'User ID' },
];

const TEMPLATES = [
  {
    id: 'simple',
    name: 'Simple (User Name)',
    pattern: 'QR-{{first_name}}-{{last_name}}',
  },
  {
    id: 'email',
    name: 'Email Based',
    pattern: 'QR-{{email}}',
  },
  {
    id: 'user_id',
    name: 'User ID Based',
    pattern: 'QR-{{id}}',
  },
];

export function QRCodeFormatBuilder({ value, onChange }: QRCodeFormatBuilderProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [parts, setParts] = useState<FormatPart[]>([]);
  const [showRawPattern, setShowRawPattern] = useState(false);

  useEffect(() => {
    loadManychatData();
  }, []);

  useEffect(() => {
    // Parse existing pattern into parts
    if (value && value !== 'QR-{{id}}') {
      parsePattern(value);
    } else {
      // Default pattern
      setParts([
        { type: 'static', value: 'QR-' },
        { type: 'system_field', value: 'id', displayName: 'User ID' },
      ]);
    }
  }, [value]);

  useEffect(() => {
    // Build pattern from parts
    const pattern = parts.map(part => part.value).join('');
    onChange(pattern);
  }, [parts]);

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

  const parsePattern = (pattern: string) => {
    const regex = /\{\{([^}]+)\}\}|([^{]+)/g;
    const parsed: FormatPart[] = [];
    let match;

    while ((match = regex.exec(pattern)) !== null) {
      if (match[1]) {
        // Placeholder: {{something}}
        const placeholder = match[1];
        if (placeholder.startsWith('tag:')) {
          const tagId = placeholder.substring(4);
          const tag = tags.find(t => t.manychatTagId === tagId);
          parsed.push({
            type: 'tag',
            value: `{{${placeholder}}}`,
            displayName: tag?.name || tagId,
          });
        } else if (placeholder.startsWith('custom_field:')) {
          const fieldId = placeholder.substring(13);
          const field = customFields.find(f => f.manychatFieldId === fieldId);
          parsed.push({
            type: 'custom_field',
            value: `{{${placeholder}}}`,
            displayName: field?.name || fieldId,
          });
        } else if (placeholder.startsWith('random')) {
          // Random string: {{random}} or {{random:6}}
          const lengthMatch = placeholder.match(/random:(\d+)/);
          const length = lengthMatch ? parseInt(lengthMatch[1]) : 6;
          parsed.push({
            type: 'random',
            value: `{{${placeholder}}}`,
            displayName: `Random (${length} chars)`,
            length,
          });
        } else {
          // System field
          const field = SYSTEM_FIELDS.find(f => f.id === placeholder);
          parsed.push({
            type: 'system_field',
            value: `{{${placeholder}}}`,
            displayName: field?.name || placeholder,
          });
        }
      } else if (match[2]) {
        // Static text
        parsed.push({
          type: 'static',
          value: match[2],
        });
      }
    }

    if (parsed.length > 0) {
      setParts(parsed);
    }
  };

  const addPart = (type: 'static' | 'tag' | 'custom_field' | 'system_field' | 'random') => {
    if (type === 'static') {
      setParts([...parts, { type: 'static', value: '-' }]);
    } else if (type === 'random') {
      setParts([...parts, { type: 'random', value: '{{random:6}}', displayName: 'Random (6 chars)', length: 6 }]);
    } else {
      setParts([...parts, { type, value: '', displayName: '' }]);
    }
  };

  const updatePart = (index: number, newValue: string) => {
    const newParts = [...parts];
    const part = newParts[index];

    if (part.type === 'static') {
      part.value = newValue;
    } else if (part.type === 'system_field') {
      const field = SYSTEM_FIELDS.find(f => f.id === newValue);
      part.value = `{{${newValue}}}`;
      part.displayName = field?.name;
    } else if (part.type === 'tag') {
      const tag = tags.find(t => t.manychatTagId === newValue);
      part.value = `{{tag:${newValue}}}`;
      part.displayName = tag?.name;
    } else if (part.type === 'custom_field') {
      const field = customFields.find(f => f.manychatFieldId === newValue);
      part.value = `{{custom_field:${newValue}}}`;
      part.displayName = field?.name;
    }

    setParts(newParts);
  };

  const removePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const applyTemplate = (templateId: string) => {
    const template = TEMPLATES.find(t => t.id === templateId);
    if (template) {
      onChange(template.pattern);
      parsePattern(template.pattern);
    }
  };

  const updateRandomLength = (index: number, length: number) => {
    const newParts = [...parts];
    const part = newParts[index];
    if (part.type === 'random') {
      part.length = length;
      part.value = `{{random:${length}}}`;
      part.displayName = `Random (${length} chars)`;
      setParts(newParts);
    }
  };

  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'tag':
        return <Tag className="h-4 w-4" />;
      case 'custom_field':
        return <FileText className="h-4 w-4" />;
      case 'system_field':
        return <Settings2 className="h-4 w-4" />;
      case 'random':
        return <Shuffle className="h-4 w-4" />;
      default:
        return <Hash className="h-4 w-4" />;
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading Manychat data...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Explanation Card */}
      <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>🔤 QR Code Format</strong>
          <div className="mt-2 space-y-1">
            <div>• Build the actual QR code string that gets encoded in the image</div>
            <div>• Use dynamic placeholders like <code className="bg-green-200 dark:bg-green-800 px-1">{'{{first_name}}'}</code> that get replaced with real user data</div>
            <div>• Example: <code className="bg-green-200 dark:bg-green-800 px-1">QR-{'{{email}}'}</code> → <code>QR-john@example.com</code></div>
            <div className="mt-2 pt-2 border-t border-green-300">
              <strong>Use case:</strong> Self-contained QR codes with user info that work offline
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Templates */}
      <div className="space-y-2">
        <Label>Quick Templates</Label>
        <div className="grid grid-cols-3 gap-2">
          {TEMPLATES.map((template) => (
            <Button
              key={template.id}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyTemplate(template.id)}
            >
              {template.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Add Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addPart('static')}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Text
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addPart('system_field')}
        >
          <Settings2 className="mr-2 h-4 w-4" />
          Add System Field
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addPart('random')}
        >
          <Shuffle className="mr-2 h-4 w-4" />
          Add Random String
        </Button>
        {tags.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addPart('tag')}
          >
            <Tag className="mr-2 h-4 w-4" />
            Add Tag
          </Button>
        )}
        {customFields.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addPart('custom_field')}
          >
            <FileText className="mr-2 h-4 w-4" />
            Add Custom Field
          </Button>
        )}
      </div>

      {/* Parts */}
      <div className="space-y-2">
        <Label>QR Code Pattern Parts</Label>
        {parts.map((part, index) => (
          <Card key={index}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                  {getFieldIcon(part.type)}
                </div>
                <div className="flex-1">
                  {part.type === 'static' ? (
                    <Input
                      placeholder="- or text"
                      value={part.value}
                      onChange={(e) => {
                        const newParts = [...parts];
                        newParts[index].value = e.target.value;
                        setParts(newParts);
                      }}
                      className="text-sm"
                    />
                  ) : part.type === 'system_field' ? (
                    <Select
                      value={part.value.replace(/\{\{|\}\}/g, '')}
                      onValueChange={(val) => updatePart(index, val)}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Select system field" />
                      </SelectTrigger>
                      <SelectContent>
                        {SYSTEM_FIELDS.map((field) => (
                          <SelectItem key={field.id} value={field.id}>
                            {field.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : part.type === 'tag' ? (
                    <Select
                      value={part.value.replace(/\{\{tag:|\}\}/g, '')}
                      onValueChange={(val) => updatePart(index, val)}
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
                  ) : part.type === 'random' ? (
                    <div className="space-y-1">
                      <Label className="text-xs">Random String Length</Label>
                      <Input
                        type="number"
                        placeholder="6"
                        value={part.length || 6}
                        onChange={(e) => {
                          const length = parseInt(e.target.value) || 6;
                          updateRandomLength(index, length);
                        }}
                        min={1}
                        max={32}
                        className="text-sm"
                      />
                    </div>
                  ) : part.type === 'custom_field' ? (
                    <Select
                      value={part.value.replace(/\{\{custom_field:|\}\}/g, '')}
                      onValueChange={(val) => updatePart(index, val)}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Select custom field" />
                      </SelectTrigger>
                      <SelectContent>
                        {customFields.map((field) => (
                          <SelectItem key={field.id} value={field.manychatFieldId}>
                            {field.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removePart(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {parts.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          No pattern parts added. Click the buttons above to build your QR code format.
        </div>
      )}

      {/* Preview */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Preview Pattern:</strong>
          <div className="mt-2 font-mono text-xs bg-muted p-2 rounded break-all">
            {parts.map(part => part.value).join('') || 'QR-{{id}}'}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Example output: {parts.map(part => {
              if (part.type === 'static') return part.value;
              if (part.type === 'system_field') return part.displayName || 'value';
              return `[${part.displayName || 'value'}]`;
            }).join('') || 'QR-123456'}
          </div>
        </AlertDescription>
      </Alert>

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
