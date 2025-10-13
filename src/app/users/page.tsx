'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { UserCircle, Search, RefreshCw, Settings } from 'lucide-react';
import { format } from 'date-fns';

interface User {
  id: string;
  manychatId: string;
  instagramId: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  optedInMessenger: boolean;
  optedInInstagram: boolean;
  optedInWhatsapp: boolean;
  optedInTelegram: boolean;
  lastSyncedAt: string | null;
  timezone: string | null;
  bookingsCount: number;
  qrCodesCount: number;
  createdAt: string;
  tags?: Array<{ name: string }>;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter((user) => {
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
        const search = searchTerm.toLowerCase();
        return (
          fullName.includes(search) ||
          user.email?.toLowerCase().includes(search) ||
          user.phone?.includes(search) ||
          user.manychatId.includes(search)
        );
      });
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const loadUsers = () => {
    setLoading(true);
    fetch('/api/admin/users')
      .then((res) => res.json())
      .then((data) => {
        setUsers(data.users || []);
        setFilteredUsers(data.users || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching users:', err);
        setUsers([]);
        setFilteredUsers([]);
        setLoading(false);
      });
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
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground">
            Manychat subscribers synced from your account
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadUsers}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Link href="/settings/manychat">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, phone, or Manychat ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5" />
            All Contacts ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              {searchTerm ? 'No contacts found matching your search.' : 'No contacts found. Sync your Manychat account to see contacts here.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Channels</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Last Synced</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div>
                        {`${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                          'Unknown'}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {user.manychatId}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        {user.email && (
                          <div className="text-xs">{user.email}</div>
                        )}
                        {user.phone && (
                          <div className="text-xs font-mono">{user.phone}</div>
                        )}
                        {!user.email && !user.phone && (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.optedInMessenger && (
                          <Badge variant="secondary" className="text-xs">Messenger</Badge>
                        )}
                        {user.optedInInstagram && (
                          <Badge variant="secondary" className="text-xs">Instagram</Badge>
                        )}
                        {user.optedInWhatsapp && (
                          <Badge variant="secondary" className="text-xs">WhatsApp</Badge>
                        )}
                        {user.optedInTelegram && (
                          <Badge variant="secondary" className="text-xs">Telegram</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.tags && user.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.tags.slice(0, 2).map((tag, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {tag.name}
                            </Badge>
                          ))}
                          {user.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{user.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.lastSyncedAt ? (
                        format(new Date(user.lastSyncedAt), 'MMM d, yyyy')
                      ) : (
                        <span className="text-muted-foreground">Never</span>
                      )}
                    </TableCell>
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
