'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, CheckCircle2, AlertCircle, FileText, ArrowLeft, Plus, RefreshCw, Edit2, Save, X, Trash2, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { isCoreFlowField, getTrackerFieldInfo } from '@/lib/core-flows';

export default function CustomFieldsManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [createFieldDialogOpen, setCreateFieldDialogOpen] = useState(false);
  const [creatingField, setCreatingField] = useState(false);
  const [newField, setNewField] = useState({
    name: '',
    type: 'text' as 'text' | 'number' | 'date' | 'datetime' | 'boolean' | 'array',
    description: '',
  });
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ name: string; description: string }>({ name: '', description: '' });
  const [savingFieldId, setSavingFieldId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deletingFieldId, setDeletingFieldId] = useState<string | null>(null);

  const formatDate = (date: any) => {
    if (!date) return '—';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleString();
    } catch {
      return '—';
    }
  };

  useEffect(() => {
    // Validate admin
    const adminStr = localStorage.getItem('admin');
    if (!adminStr) {
      setError('Please log in to access settings');
      router.push('/login');
      return;
    }

    loadCustomFields();
  }, []);

  const loadCustomFields = async () => {
    setLoading(true);
    setError('');

    try {
      const adminStr = localStorage.getItem('admin');
      if (!adminStr) return;

      const admin = JSON.parse(adminStr);
      const res = await fetch(`/api/admin/manychat-data?admin_id=${admin.id}`);

      if (res.ok) {
        const data = await res.json();
        setCustomFields(data.customFields || []);
      } else {
        setError('Failed to load custom fields');
      }
    } catch (err) {
      console.error('Failed to load custom fields:', err);
      setError('An error occurred while loading custom fields');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncFields = async () => {
    setSyncing(true);
    setError('');
    setSuccess('');

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

      setSuccess(`Successfully synced ${data.synced} custom fields from Manychat!`);
      setTimeout(() => setSuccess(''), 3000);

      // Reload fields
      loadCustomFields();
    } catch (err) {
      setError('An error occurred while syncing custom fields');
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateCustomField = async () => {
    if (!newField.name.trim()) {
      setError('Field name is required');
      return;
    }

    setCreatingField(true);
    setError('');

    try {
      const admin = JSON.parse(localStorage.getItem('admin') || '{}');
      const res = await fetch('/api/manychat/fields/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: admin.id,
          name: newField.name,
          type: newField.type,
          description: newField.description || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create custom field');
        return;
      }

      setSuccess(`Custom field "${newField.name}" created successfully!`);
      setTimeout(() => setSuccess(''), 3000);

      // Reset form and close dialog
      setNewField({ name: '', type: 'text', description: '' });
      setCreateFieldDialogOpen(false);

      // Reload fields
      loadCustomFields();
    } catch (err) {
      setError('An error occurred while creating custom field');
    } finally {
      setCreatingField(false);
    }
  };

  const handleStartEdit = (field: any) => {
    setEditingFieldId(field.id);
    setEditValues({
      name: field.name,
      description: field.description || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingFieldId(null);
    setEditValues({ name: '', description: '' });
  };

  const handleSaveEdit = async (fieldId: string) => {
    if (!editValues.name.trim()) {
      setError('Field name cannot be empty');
      return;
    }

    setSavingFieldId(fieldId);
    setError('');

    try {
      const admin = JSON.parse(localStorage.getItem('admin') || '{}');
      const res = await fetch('/api/manychat/fields/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: admin.id,
          field_id: fieldId,
          name: editValues.name,
          description: editValues.description || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to update custom field');
        return;
      }

      setSuccess('Custom field updated successfully!');
      setTimeout(() => setSuccess(''), 3000);

      setEditingFieldId(null);
      setEditValues({ name: '', description: '' });

      // Reload fields
      loadCustomFields();
    } catch (err) {
      setError('An error occurred while updating custom field');
    } finally {
      setSavingFieldId(null);
    }
  };

  const handleDeleteClick = (field: any) => {
    setFieldToDelete({ id: field.id, name: field.name });
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!fieldToDelete) return;

    setDeletingFieldId(fieldToDelete.id);
    setError('');

    try {
      const admin = JSON.parse(localStorage.getItem('admin') || '{}');
      const res = await fetch('/api/manychat/fields/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: admin.id,
          field_id: fieldToDelete.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to delete custom field');
        return;
      }

      setSuccess(`Custom field "${fieldToDelete.name}" deleted successfully!`);
      setTimeout(() => setSuccess(''), 3000);

      setDeleteConfirmOpen(false);
      setFieldToDelete(null);

      // Reload fields
      loadCustomFields();
    } catch (err) {
      setError('An error occurred while deleting custom field');
    } finally {
      setDeletingFieldId(null);
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/settings/manychat">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="h-8 w-8" />
              Custom Fields Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Create and manage custom fields for storing contact data
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSyncFields} disabled={syncing}>
            {syncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Sync Fields
          </Button>
          <Button onClick={() => setCreateFieldDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Field
          </Button>
        </div>
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
          <CardTitle>All Custom Fields</CardTitle>
          <CardDescription>
            Custom fields store additional data about your contacts beyond the default Manychat fields
          </CardDescription>
        </CardHeader>
        <CardContent>
          {customFields.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No custom fields yet</p>
              <p className="text-sm mb-4">
                Create a new custom field or sync existing ones from your Manychat account
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => setCreateFieldDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Field
                </Button>
                <Button variant="outline" onClick={handleSyncFields}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync Fields
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {customFields.length} {customFields.length === 1 ? 'field' : 'fields'}
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Manychat ID</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customFields.map((field) => {
                    const isEditing = editingFieldId === field.id;
                    const isSaving = savingFieldId === field.id;

                    return (
                      <TableRow key={field.id}>
                        <TableCell className="font-medium">
                          {isEditing ? (
                            <Input
                              value={editValues.name}
                              onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                              className="h-8"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              {isCoreFlowField(field.name) ? (
                                <>
                                  {getTrackerFieldInfo(field.name)?.icon && (
                                    <span className="text-lg">{getTrackerFieldInfo(field.name)?.icon}</span>
                                  )}
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                      {field.name}
                                      <Badge variant="secondary" className="text-xs">
                                        <BarChart3 className="h-3 w-3 mr-1" />
                                        Core Flow Tracker
                                      </Badge>
                                    </div>
                                    {getTrackerFieldInfo(field.name)?.flow && (
                                      <span className="text-xs text-muted-foreground">
                                        {getTrackerFieldInfo(field.name)?.flow.name.replace(/^[^\s]+\s/, '')}
                                      </span>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                  {field.name}
                                </>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                            {field.type}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-sm">
                          {field.manychatFieldId}
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-xs">
                          {isEditing ? (
                            <Input
                              value={editValues.description}
                              onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                              placeholder="Optional description"
                              className="h-8"
                            />
                          ) : (
                            <span className="truncate">{field.description || '—'}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(field.createdAt)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(field.updatedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSaveEdit(field.id)}
                                disabled={isSaving}
                              >
                                {isSaving ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Save className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCancelEdit}
                                disabled={isSaving}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleStartEdit(field)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteClick(field)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How to Use Custom Fields</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong>Field Types:</strong> Choose from text, number, date, datetime, boolean, or array depending on what data you want to store.
          </p>
          <p>
            <strong>In QR Code Generation:</strong> When creating QR codes, you can specify custom field values to automatically set when the QR code is scanned.
          </p>
          <p>
            <strong>Automatic Updates:</strong> Selected custom fields will be updated in Manychat when contacts scan the QR code, enabling dynamic data collection.
          </p>
          <p>
            <strong>Create vs Sync:</strong> Create new fields here that will be added to Manychat, or sync existing fields from your Manychat dashboard.
          </p>
        </CardContent>
      </Card>

      {/* Create Custom Field Dialog */}
      <Dialog open={createFieldDialogOpen} onOpenChange={setCreateFieldDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Custom Field</DialogTitle>
            <DialogDescription>
              Create a new custom field in Manychat to store contact data
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="field-name">Field Name *</Label>
              <Input
                id="field-name"
                value={newField.name}
                onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                placeholder="e.g., Birthday, Favorite Color, Points"
              />
              <p className="text-xs text-muted-foreground">
                Use a descriptive name that clearly indicates what data this field stores
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="field-type">Field Type *</Label>
              <Select
                value={newField.type}
                onValueChange={(value: any) => setNewField({ ...newField, type: value })}
              >
                <SelectTrigger id="field-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="datetime">Date & Time</SelectItem>
                  <SelectItem value="boolean">Boolean (True/False)</SelectItem>
                  <SelectItem value="array">Array (Multiple Values)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose the data type that matches the kind of information you'll store
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="field-description">Description (Optional)</Label>
              <Input
                id="field-description"
                value={newField.description}
                onChange={(e) => setNewField({ ...newField, description: e.target.value })}
                placeholder="Brief description of this field"
              />
              <p className="text-xs text-muted-foreground">
                Add a description to help remember what this field is used for
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateFieldDialogOpen(false);
                setNewField({ name: '', type: 'text', description: '' });
              }}
              disabled={creatingField}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCustomField}
              disabled={creatingField || !newField.name.trim()}
            >
              {creatingField && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Field
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Custom Field</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the custom field "{fieldToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Warning: This will only remove the field from your local database. The field will still exist in Manychat.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setFieldToDelete(null);
              }}
              disabled={deletingFieldId !== null}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deletingFieldId !== null}
            >
              {deletingFieldId !== null && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Field
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
