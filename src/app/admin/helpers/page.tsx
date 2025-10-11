'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { format } from 'date-fns';

interface Helper {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  active: boolean;
  bookingsCount: number;
  availabilitiesCount: number;
  createdAt: string;
}

export default function HelpersPage() {
  const [helpers, setHelpers] = useState<Helper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHelpers();
  }, []);

  const fetchHelpers = async () => {
    try {
      const res = await fetch('/api/admin/helpers');
      const data = await res.json();
      setHelpers(data.helpers);
    } catch (error) {
      console.error('Error fetching helpers:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      await fetch(`/api/admin/helpers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      });
      fetchHelpers();
    } catch (error) {
      console.error('Error updating helper:', error);
    }
  };

  const deleteHelper = async (id: string) => {
    if (!confirm('Are you sure you want to delete this helper?')) return;

    try {
      await fetch(`/api/admin/helpers/${id}`, {
        method: 'DELETE',
      });
      fetchHelpers();
    } catch (error) {
      console.error('Error deleting helper:', error);
    }
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
          <h1 className="text-3xl font-bold tracking-tight">Helpers</h1>
          <p className="text-muted-foreground">
            Manage your staff members and their availability
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Helper
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Helpers ({helpers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {helpers.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              No helpers found. Add your first helper to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead>Availability</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {helpers.map((helper) => (
                  <TableRow key={helper.id}>
                    <TableCell className="font-medium">{helper.name}</TableCell>
                    <TableCell>{helper.email || '-'}</TableCell>
                    <TableCell>{helper.phone || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={helper.active ? 'success' : 'secondary'}>
                        {helper.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{helper.bookingsCount}</TableCell>
                    <TableCell>{helper.availabilitiesCount} slots</TableCell>
                    <TableCell>
                      {format(new Date(helper.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleActive(helper.id, helper.active)}
                        >
                          {helper.active ? '⏸' : '▶️'}
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteHelper(helper.id)}
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
