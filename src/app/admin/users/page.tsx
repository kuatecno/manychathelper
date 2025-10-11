'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { UserCircle } from 'lucide-react';
import { format } from 'date-fns';

interface User {
  id: string;
  manychatId: string;
  instagramId: string | null;
  firstName: string | null;
  lastName: string | null;
  timezone: string | null;
  bookingsCount: number;
  qrCodesCount: number;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/users')
      .then((res) => res.json())
      .then((data) => {
        setUsers(data.users);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching users:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground">
          Instagram users who have interacted with your Manychat bot
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5" />
            All Users ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              No users found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Manychat ID</TableHead>
                  <TableHead>Instagram ID</TableHead>
                  <TableHead>Timezone</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead>QR Codes</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {`${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                        'Unknown'}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {user.manychatId}
                    </TableCell>
                    <TableCell>
                      {user.instagramId ? (
                        <span className="font-mono text-xs">{user.instagramId}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{user.timezone || '-'}</TableCell>
                    <TableCell>{user.bookingsCount}</TableCell>
                    <TableCell>{user.qrCodesCount}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(user.createdAt), 'MMM d, yyyy')}
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
