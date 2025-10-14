'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  UserCircle,
  Search,
  RefreshCw,
  Settings,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Download,
  History
} from 'lucide-react';
import { format } from 'date-fns';

interface User {
  id: string;
  manychatId: string;
  instagramId: string | null;
  igUsername: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  profilePic: string | null;
  gender: string | null;
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
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshingAll, setRefreshingAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userHistory, setUserHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

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
    setError('');
    fetch('/api/admin/users')
      .then((res) => res.json())
      .then((data) => {
        setUsers(data.users || []);
        setFilteredUsers(data.users || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching users:', err);
        setError('Failed to load contacts');
        setUsers([]);
        setFilteredUsers([]);
        setLoading(false);
      });
  };

  const handleRefreshAll = async () => {
    setRefreshingAll(true);
    setError('');
    setSuccess('');

    try {
      const admin = JSON.parse(localStorage.getItem('admin') || '{}');
      const res = await fetch('/api/manychat/sync/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: admin.id,
          refresh_all: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to refresh contacts');
        return;
      }

      setSuccess(`Refreshed ${data.synced} contacts successfully!`);
      setTimeout(() => setSuccess(''), 5000);

      // Reload users
      loadUsers();
    } catch (err) {
      setError('An error occurred while refreshing contacts');
    } finally {
      setRefreshingAll(false);
    }
  };

  const handleRefreshContact = async (contactId: string) => {
    setRefreshing(true);
    setError('');

    try {
      const admin = JSON.parse(localStorage.getItem('admin') || '{}');
      const res = await fetch('/api/manychat/sync/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: admin.id,
          contact_id: contactId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to refresh contact');
        return;
      }

      setSuccess('Contact refreshed successfully!');
      setTimeout(() => setSuccess(''), 3000);

      // Reload users
      loadUsers();
    } catch (err) {
      setError('An error occurred while refreshing contact');
    } finally {
      setRefreshing(false);
    }
  };

  const needsSync = (user: User) => {
    if (!user.lastSyncedAt) return true;
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return new Date(user.lastSyncedAt) < dayAgo;
  };

  const loadUserHistory = async (userId: string) => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/users/${userId}/history`);
      const data = await res.json();
      setUserHistory(data.history || []);
    } catch (err) {
      console.error('Error loading history:', err);
      setUserHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const openHistory = (user: User) => {
    setSelectedUser(user);
    loadUserHistory(user.id);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground">
            Manychat subscribers synced from your account
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={refreshingAll || users.length === 0}
          >
            {refreshingAll ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Sync All
          </Button>
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
            <div className="flex h-32 flex-col items-center justify-center text-center">
              <p className="text-muted-foreground">
                {searchTerm ? 'No contacts found matching your search.' : 'No contacts found.'}
              </p>
              {!searchTerm && (
                <Link href="/settings/manychat/webhook-helper">
                  <Button variant="link" className="mt-2">
                    Set up Manychat integration →
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Channels</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow
                    key={user.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/users/${user.id}`)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        {user.profilePic ? (
                          <Image
                            src={user.profilePic}
                            alt={`${user.firstName || 'User'}'s profile`}
                            width={40}
                            height={40}
                            className="rounded-full"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                            <UserCircle className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">
                            {(() => {
                              const firstName = user.firstName || '';
                              const lastName = user.lastName || '';
                              const fullName = `${firstName} ${lastName}`.trim();

                              // Show username if no name or both first and last names are 2 chars or shorter
                              if (!fullName || (firstName.length <= 2 && lastName.length <= 2)) {
                                return user.igUsername ? `@${user.igUsername}` : (user.instagramId || 'Unknown');
                              }
                              return fullName;
                            })()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {user.igUsername ? `@${user.igUsername}` : user.manychatId}
                          </div>
                        </div>
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
                        {user.igUsername && (
                          <div className="text-xs text-muted-foreground">
                            📷 @{user.igUsername}
                          </div>
                        )}
                        {user.timezone && (
                          <div className="text-xs text-muted-foreground">
                            🌍 {user.timezone}
                          </div>
                        )}
                        {!user.email && !user.phone && !user.igUsername && !user.timezone && (
                          <span className="text-muted-foreground">No contact info</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.optedInMessenger && (
                          <Badge variant="secondary" className="text-xs">📱 Messenger</Badge>
                        )}
                        {user.optedInInstagram && (
                          <Badge variant="secondary" className="text-xs">📷 Instagram</Badge>
                        )}
                        {user.optedInWhatsapp && (
                          <Badge variant="secondary" className="text-xs">💬 WhatsApp</Badge>
                        )}
                        {user.optedInTelegram && (
                          <Badge variant="secondary" className="text-xs">✈️ Telegram</Badge>
                        )}
                        {!user.optedInMessenger && !user.optedInInstagram && !user.optedInWhatsapp && !user.optedInTelegram && (
                          <span className="text-muted-foreground text-xs">None</span>
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
                        <span className="text-muted-foreground text-sm">No tags</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {user.lastSyncedAt ? (
                          <>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(user.lastSyncedAt), 'MMM d, yyyy')}
                            </div>
                            {needsSync(user) && (
                              <Badge variant="outline" className="text-xs">
                                Needs sync
                              </Badge>
                            )}
                          </>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            Never synced
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRefreshContact(user.id)}
                          disabled={refreshing}
                          title="Refresh contact data"
                        >
                          {refreshing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openHistory(user)}
                          title="View history"
                        >
                          <History className="h-4 w-4" />
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

      {users.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Sync Information</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="list-disc list-inside space-y-1">
              <li>Contacts are automatically added when they interact with your Manychat bot</li>
              <li>Full contact data is synced daily at 2 AM UTC</li>
              <li>Use "Sync All" to manually update all contacts immediately</li>
              <li>Individual contacts can be refreshed using the refresh button</li>
            </ul>
          </CardContent>
        </Card>
      )}

      {/* History Modal */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedUser(null)}
        >
          <Card
            className="w-full max-w-4xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>History</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedUser.firstName && selectedUser.lastName
                    ? `${selectedUser.firstName} ${selectedUser.lastName}`
                    : selectedUser.igUsername
                    ? `@${selectedUser.igUsername}`
                    : 'Unknown User'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedUser(null)}
              >
                Close
              </Button>
            </CardHeader>
            <CardContent className="overflow-y-auto max-h-[70vh]">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : userHistory.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No history available yet
                </p>
              ) : (
                <div className="space-y-4">
                  {userHistory.map((snapshot) => (
                    <div key={snapshot.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-medium">
                          {format(new Date(snapshot.createdAt), 'MMM d, yyyy h:mm a')}
                        </div>
                        {snapshot.changes.length > 0 && (
                          <Badge variant="secondary">
                            {snapshot.changes.length} {snapshot.changes.length === 1 ? 'change' : 'changes'}
                          </Badge>
                        )}
                      </div>

                      {snapshot.changes.length > 0 && (
                        <div className="space-y-2 mb-3">
                          <div className="text-sm font-medium text-muted-foreground">Changes:</div>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            {snapshot.changes.map((change: string, idx: number) => (
                              <li key={idx}>{change}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Custom Fields */}
                      {snapshot.customFields.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="text-sm font-medium text-muted-foreground mb-2">
                            Custom Fields:
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {snapshot.customFields.map((field: any, idx: number) => (
                              <div key={idx} className="text-sm">
                                <span className="font-medium">{field.name}:</span>{' '}
                                <span className="text-muted-foreground">
                                  {field.value !== null ? String(field.value) : 'null'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tags */}
                      {snapshot.tags.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="text-sm font-medium text-muted-foreground mb-2">
                            Tags:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {snapshot.tags.map((tag: any, idx: number) => (
                              <Badge key={idx} variant="outline">
                                {tag.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
