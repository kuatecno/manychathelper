'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle2, AlertCircle, Plus, RefreshCw } from 'lucide-react';
import type { CoreFlow } from '@/lib/core-flows';

interface CustomFieldSetupProps {
  flow: CoreFlow;
  onComplete?: () => void;
}

export function CustomFieldSetup({ flow, onComplete }: CustomFieldSetupProps) {
  const [adminId, setAdminId] = useState<string>('');
  const [existingFields, setExistingFields] = useState<any[]>([]);
  const [fieldMappings, setFieldMappings] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Get admin ID from localStorage
    const adminStr = localStorage.getItem('admin');
    if (adminStr) {
      try {
        const admin = JSON.parse(adminStr);
        setAdminId(admin.id);
        loadCustomFields(admin.id);
      } catch (e) {
        setError('Failed to load admin data');
      }
    }

    // Initialize field mappings
    const initialMappings: Record<string, string | null> = {};
    flow.customFields.forEach((field) => {
      initialMappings[field.name] = null;
    });
    setFieldMappings(initialMappings);
  }, [flow]);

  const loadCustomFields = async (adminId: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/manychat/fields?adminId=${adminId}`);
      if (!response.ok) throw new Error('Failed to load custom fields');
      const data = await response.json();
      setExistingFields(data.customFields || []);

      // Auto-match fields by name
      const autoMappings: Record<string, string | null> = {};
      flow.customFields.forEach((field) => {
        const match = data.customFields.find((f: any) => f.name === field.name);
        autoMappings[field.name] = match ? 'existing:' + field.name : null;
      });
      setFieldMappings(autoMappings);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const createCustomField = async (fieldName: string, fieldType: string) => {
    setCreating(fieldName);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/manychat/custom-fields/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId,
          fieldName,
          fieldType,
          description: `Flowkick tracker: ${fieldName}`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to create field');
      }

      setSuccess(`Created "${fieldName}" successfully!`);

      // Reload fields
      await loadCustomFields(adminId);

      // Update mapping to the newly created field
      setFieldMappings((prev) => ({
        ...prev,
        [fieldName]: 'existing:' + fieldName,
      }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreating(null);
    }
  };

  const getFieldStatus = (fieldName: string) => {
    const mapping = fieldMappings[fieldName];
    if (!mapping) return 'unmapped';
    if (mapping.startsWith('existing:')) {
      const existingFieldName = mapping.replace('existing:', '');
      return existingFieldName === fieldName ? 'matched' : 'remapped';
    }
    return 'unmapped';
  };

  const allFieldsConfigured = flow.customFields.every((field) => {
    const status = getFieldStatus(field.name);
    return status === 'matched' || status === 'remapped';
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Custom Field Setup</CardTitle>
          <CardDescription>
            Map or create the required custom fields for this flow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-100">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm">{success}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {flow.customFields.map((field) => {
                const status = getFieldStatus(field.name);
                const existingField = existingFields.find((f) => f.name === field.name);

                return (
                  <Card key={field.name}>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                {field.name}
                              </code>
                              <Badge variant="outline" className="text-xs">
                                {field.type}
                              </Badge>
                              {status === 'matched' && (
                                <Badge variant="default" className="text-xs bg-green-500">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Ready
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {field.description}
                            </p>
                          </div>
                        </div>

                        {!existingField ? (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => createCustomField(field.name, field.type)}
                              disabled={creating === field.name}
                            >
                              {creating === field.name ? (
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Plus className="h-4 w-4 mr-2" />
                              )}
                              Create in Manychat
                            </Button>
                            <span className="text-xs text-muted-foreground">
                              or map to existing field
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-green-700 dark:text-green-400">
                              Field exists in Manychat
                            </span>
                          </div>
                        )}

                        {existingFields.length > 0 && !existingField && (
                          <div className="space-y-2">
                            <label className="text-xs text-muted-foreground">
                              Or select existing field with tracking automation:
                            </label>
                            <Select
                              value={fieldMappings[field.name] || undefined}
                              onValueChange={(value) => {
                                setFieldMappings((prev) => ({
                                  ...prev,
                                  [field.name]: value,
                                }));
                              }}
                            >
                              <SelectTrigger className="text-xs">
                                <SelectValue placeholder="Select existing field..." />
                              </SelectTrigger>
                              <SelectContent>
                                {existingFields
                                  .filter((f) => f.type === field.type)
                                  .map((f) => (
                                    <SelectItem
                                      key={f.id}
                                      value={`existing:${f.name}`}
                                      className="text-xs"
                                    >
                                      {f.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {allFieldsConfigured && (
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-semibold text-green-900 dark:text-green-100">
                    All fields configured!
                  </p>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    You can now create the automation in Manychat using these custom fields.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
