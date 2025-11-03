'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, CheckCircle2, AlertCircle, Tag, ArrowLeft, RefreshCw, Edit2, Save, X } from 'lucide-react';
import Link from 'next/link';

export default function TagsManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tags, setTags] = useState<any[]>([]);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [savingTagId, setSavingTagId] = useState<string | null>(null);

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

    loadTags();
  }, []);

  const loadTags = async () => {
    setLoading(true);
    setError('');

    try {
      const adminStr = localStorage.getItem('admin');
      if (!adminStr) return;

      const admin = JSON.parse(adminStr);
      const res = await fetch(`/api/admin/manychat-data?admin_id=${admin.id}`);

      if (res.ok) {
        const data = await res.json();
        setTags(data.tags || []);
      } else {
        setError('Failed to load tags');
      }
    } catch (err) {
      console.error('Failed to load tags:', err);
      setError('An error occurred while loading tags');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncTags = async () => {
    setSyncing(true);
    setError('');
    setSuccess('');

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

      setSuccess(`Successfully synced ${data.synced} tags from Manychat!`);
      setTimeout(() => setSuccess(''), 3000);

      // Reload tags
      loadTags();
    } catch (err) {
      setError('An error occurred while syncing tags');
    } finally {
      setSyncing(false);
    }
  };

  const handleStartEdit = (tag: any) => {
    setEditingTagId(tag.id);
    setEditName(tag.name);
  };

  const handleCancelEdit = () => {
    setEditingTagId(null);
    setEditName('');
  };

  const handleSaveEdit = async (tagId: string) => {
    if (!editName.trim()) {
      setError('Tag name cannot be empty');
      return;
    }

    setSavingTagId(tagId);
    setError('');

    try {
      const admin = JSON.parse(localStorage.getItem('admin') || '{}');
      const res = await fetch('/api/manychat/tags/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: admin.id,
          tag_id: tagId,
          name: editName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to update tag');
        return;
      }

      setSuccess('Tag updated successfully!');
      setTimeout(() => setSuccess(''), 3000);

      setEditingTagId(null);
      setEditName('');

      // Reload tags
      loadTags();
    } catch (err) {
      setError('An error occurred while updating tag');
    } finally {
      setSavingTagId(null);
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
              <Tag className="h-8 w-8" />
              Tags Management
            </h1>
            <p className="text-muted-foreground mt-2">
              View and manage all tags synced from Manychat
            </p>
          </div>
        </div>
        <Button onClick={handleSyncTags} disabled={syncing}>
          {syncing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Sync Tags
        </Button>
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
          <CardTitle>All Tags</CardTitle>
          <CardDescription>
            Tags are used to segment and categorize your contacts in Manychat
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tags.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Tag className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No tags synced yet</p>
              <p className="text-sm mb-4">
                Click "Sync Tags" above to import tags from your Manychat account
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {tags.length} {tags.length === 1 ? 'tag' : 'tags'}
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Manychat ID</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tags.map((tag) => {
                    const isEditing = editingTagId === tag.id;
                    const isSaving = savingTagId === tag.id;

                    return (
                      <TableRow key={tag.id}>
                        <TableCell className="font-medium">
                          {isEditing ? (
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="h-8"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <Tag className="h-4 w-4 text-muted-foreground" />
                              {tag.name}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-sm">
                          {tag.manychatTagId}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(tag.createdAt)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(tag.updatedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSaveEdit(tag.id)}
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
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleStartEdit(tag)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
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
          <CardTitle>How to Use Tags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong>In QR Code Generation:</strong> When creating QR codes, you can select tags to automatically apply when the QR code is scanned and validated.
          </p>
          <p>
            <strong>Automatic Application:</strong> Selected tags will be added to the contact in Manychat when they scan the QR code, allowing for instant segmentation.
          </p>
          <p>
            <strong>Syncing:</strong> Tags are synced from Manychat. Create new tags in your Manychat dashboard, then click "Sync Tags" to import them here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
