'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  UserCircle,
  ArrowLeft,
  Loader2,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  MessageCircle,
  Image as ImageIcon,
  TrendingUp,
  Mail,
  Phone,
  MapPin,
  Clock,
  Calendar,
  Instagram,
  Tag as TagIcon,
  History as HistoryIcon,
  BarChart3,
} from 'lucide-react';
import { format } from 'date-fns';
import { isCoreFlowField, getTrackerFieldInfo } from '@/lib/core-flows';
import { filterVisibleTags } from '@/lib/hidden-tags';

interface UserDetail {
  id: string;
  manychatId: string;
  instagramId: string | null;
  igUsername: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  whatsappPhone: string | null;
  profilePic: string | null;
  gender: string | null;
  locale: string | null;
  timezone: string | null;
  subscribedAt: string | null;
  optedInMessenger: boolean;
  optedInInstagram: boolean;
  optedInWhatsapp: boolean;
  optedInTelegram: boolean;
  lastSyncedAt: string | null;
  createdAt: string;
  customFields: Array<{
    name: string;
    type: string;
    value: any;
  }>;
  tags: Array<{
    name: string;
  }>;
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUser();
  }, [userId]);

  const loadUser = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/users/${userId}`);
      if (!res.ok) throw new Error('Failed to load user');
      const data = await res.json();
      setUser(data.user);
    } catch (err) {
      console.error('Error loading user:', err);
      setError('Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/users/${userId}/history`);
      const data = await res.json();
      setHistory(data.history || []);
    } catch (err) {
      console.error('Error loading history:', err);
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setError('');

    try {
      const admin = JSON.parse(localStorage.getItem('admin') || '{}');
      const res = await fetch('/api/manychat/sync/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: admin.id,
          contact_id: userId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to refresh contact');
        return;
      }

      await loadUser();
    } catch (err) {
      setError('An error occurred while refreshing contact');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>User not found</AlertDescription>
        </Alert>
        <Link href="/users">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        </Link>
      </div>
    );
  }

  const userName =
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.igUsername
      ? `@${user.igUsername}`
      : 'Unknown User';

  const messagesField = user.customFields.find((f) => f.name === 'messagescountinsta');
  const commentsField = user.customFields.find((f) => f.name === 'commentcountinsta');
  const storiesField = user.customFields.find((f) => f.name === 'storiescountinsta');

  // Separate trackers from regular custom fields
  const trackerFields = user.customFields.filter((f) => isCoreFlowField(f.name));
  const regularFields = user.customFields.filter((f) => !isCoreFlowField(f.name));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/users">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            {user.profilePic ? (
              <Image
                src={user.profilePic}
                alt={userName}
                width={64}
                height={64}
                className="rounded-full"
                unoptimized
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <UserCircle className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{userName}</h1>
              <p className="text-muted-foreground">
                {user.igUsername && `@${user.igUsername} · `}ID: {user.manychatId}
              </p>
            </div>
          </div>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      {(messagesField || commentsField || storiesField) && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {messagesField?.value || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comments</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {commentsField?.value || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stories</CardTitle>
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {storiesField?.value || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trackers">
            <BarChart3 className="h-4 w-4 mr-2" />
            Trackers ({trackerFields.length})
          </TabsTrigger>
          <TabsTrigger value="custom-fields">
            Custom Fields ({regularFields.length})
          </TabsTrigger>
          <TabsTrigger value="tags">Tags ({filterVisibleTags(user.tags).length})</TabsTrigger>
          <TabsTrigger value="history" onClick={() => history.length === 0 && loadHistory()}>
            <HistoryIcon className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {user.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Email</div>
                    <div className="font-medium">{user.email}</div>
                  </div>
                </div>
              )}

              {user.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Phone</div>
                    <div className="font-medium font-mono">{user.phone}</div>
                  </div>
                </div>
              )}

              {user.whatsappPhone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">WhatsApp</div>
                    <div className="font-medium font-mono">{user.whatsappPhone}</div>
                  </div>
                </div>
              )}

              {user.instagramId && (
                <div className="flex items-center gap-3">
                  <Instagram className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Instagram ID</div>
                    <div className="font-medium font-mono">{user.instagramId}</div>
                  </div>
                </div>
              )}

              {user.timezone && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Timezone</div>
                    <div className="font-medium">{user.timezone}</div>
                  </div>
                </div>
              )}

              {user.locale && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Locale</div>
                    <div className="font-medium">{user.locale}</div>
                  </div>
                </div>
              )}

              {user.subscribedAt && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Subscribed</div>
                    <div className="font-medium">
                      {format(new Date(user.subscribedAt), 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>
              )}

              {user.lastSyncedAt && (
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Last Synced</div>
                    <div className="font-medium">
                      {format(new Date(user.lastSyncedAt), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Channels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {user.optedInMessenger && (
                  <Badge variant="secondary" className="text-sm">
                    📱 Messenger
                  </Badge>
                )}
                {user.optedInInstagram && (
                  <Badge variant="secondary" className="text-sm">
                    📷 Instagram
                  </Badge>
                )}
                {user.optedInWhatsapp && (
                  <Badge variant="secondary" className="text-sm">
                    💬 WhatsApp
                  </Badge>
                )}
                {user.optedInTelegram && (
                  <Badge variant="secondary" className="text-sm">
                    ✈️ Telegram
                  </Badge>
                )}
                {!user.optedInMessenger &&
                  !user.optedInInstagram &&
                  !user.optedInWhatsapp &&
                  !user.optedInTelegram && (
                    <span className="text-muted-foreground">No channels</span>
                  )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trackers Tab */}
        <TabsContent value="trackers">
          <Card>
            <CardHeader>
              <CardTitle>Core Flow Trackers</CardTitle>
            </CardHeader>
            <CardContent>
              {trackerFields.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-2">No trackers configured yet</p>
                  <p className="text-sm text-muted-foreground">
                    Set up Core Flow trackers in{' '}
                    <Link href="/flows" className="text-primary hover:underline">
                      Flows
                    </Link>
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {trackerFields.map((field, idx) => {
                    const info = getTrackerFieldInfo(field.name);
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          {info?.icon && (
                            <div className="text-2xl">{info.icon}</div>
                          )}
                          <div>
                            <div className="font-medium">
                              {info?.flow.name.replace(/^[^\s]+\s/, '') || field.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {info?.field?.description || field.name}
                            </div>
                            <code className="text-xs bg-muted px-2 py-0.5 rounded mt-1 inline-block">
                              {field.name}
                            </code>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold">
                            {field.value !== null ? String(field.value) : '0'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {field.type}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Fields Tab */}
        <TabsContent value="custom-fields">
          <Card>
            <CardHeader>
              <CardTitle>Custom Fields</CardTitle>
            </CardHeader>
            <CardContent>
              {regularFields.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No custom fields
                </p>
              ) : (
                <div className="space-y-3">
                  {regularFields.map((field, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{field.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Type: {field.type}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-medium">
                          {field.value !== null ? String(field.value) : 'null'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tags Tab */}
        <TabsContent value="tags">
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const visibleTags = filterVisibleTags(user.tags);
                return visibleTags.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No visible tags</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {visibleTags.map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="text-sm">
                        <TagIcon className="h-3 w-3 mr-1" />
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : history.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No history available yet
                </p>
              ) : (
                <div className="space-y-4">
                  {history.map((snapshot) => (
                    <div key={snapshot.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-medium">
                          {format(
                            new Date(snapshot.createdAt),
                            'MMM d, yyyy h:mm a'
                          )}
                        </div>
                        {snapshot.changes.length > 0 && (
                          <Badge variant="secondary">
                            {snapshot.changes.length}{' '}
                            {snapshot.changes.length === 1 ? 'change' : 'changes'}
                          </Badge>
                        )}
                      </div>

                      {snapshot.changes.length > 0 && (
                        <div className="space-y-2 mb-3">
                          <div className="text-sm font-medium text-muted-foreground">
                            Changes:
                          </div>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            {snapshot.changes.map((change: string, idx: number) => (
                              <li key={idx}>{change}</li>
                            ))}
                          </ul>
                        </div>
                      )}

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

                      {(() => {
                        const visibleTags = filterVisibleTags(snapshot.tags);
                        return visibleTags.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="text-sm font-medium text-muted-foreground mb-2">
                              Tags:
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {visibleTags.map((tag: any, idx: number) => (
                                <Badge key={idx} variant="outline">
                                  {tag.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
