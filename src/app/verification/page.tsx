'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Key,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  Copy,
  Eye,
  EyeOff,
  Trash2,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ApiKey {
  id: string;
  name: string;
  websiteDomain: string;
  servicePrefix: string;
  active: boolean;
  maxRequestsPerHour: number;
  maxRequestsPerDay: number;
  lastUsedAt: string | null;
  requestCount: number;
  createdAt: string;
}

interface Stats {
  total: number;
  successful: number;
  pending: number;
  expired: number;
  failed: number;
  recent_24h: number;
  success_rate: number;
}

const SERVICE_PREFIXES = {
  H45: 'E-commerce Auth',
  H46: 'Event Check-in',
  H47: 'Subscription Verify',
  H48: 'General Purpose',
};

export default function VerificationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    website_domain: '',
    service_prefix: 'H45',
    max_requests_per_hour: 100,
    max_requests_per_day: 1000,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const adminStr = localStorage.getItem('admin');
      if (!adminStr) {
        router.push('/login');
        return;
      }

      const admin = JSON.parse(adminStr);

      // Fetch stats and API keys in parallel
      const [statsRes, keysRes] = await Promise.all([
        fetch(`/api/admin/verification/stats?adminId=${admin.id}`),
        fetch(`/api/admin/verification/api-keys?adminId=${admin.id}`),
      ]);

      const statsData = await statsRes.json();
      const keysData = await keysRes.json();

      setStats(statsData.stats);
      setApiKeys(keysData.api_keys || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const adminStr = localStorage.getItem('admin');
      if (!adminStr) return;

      const admin = JSON.parse(adminStr);

      const res = await fetch('/api/admin/verification/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: admin.id,
          ...formData,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setNewApiKey(data.api_key.key);
        fetchData();
        setFormData({
          name: '',
          website_domain: '',
          service_prefix: 'H45',
          max_requests_per_hour: 100,
          max_requests_per_day: 1000,
        });
      }
    } catch (error) {
      console.error('Error creating API key:', error);
    }
  };

  const handleDeleteApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    try {
      await fetch(`/api/admin/verification/api-keys/${keyId}`, {
        method: 'DELETE',
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting API key:', error);
    }
  };

  const handleToggleActive = async (keyId: string, currentActive: boolean) => {
    try {
      await fetch(`/api/admin/verification/api-keys/${keyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      });
      fetchData();
    } catch (error) {
      console.error('Error toggling API key:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setNewApiKey(null);
    setShowApiKey(false);
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
          <h1 className="text-3xl font-bold tracking-tight">Instagram Verification</h1>
          <p className="text-muted-foreground">
            Manage Instagram DM verification for external websites
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Verifications</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.recent_24h} in last 24 hours
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.success_rate}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.successful} successful
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting verification
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed/Expired</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.failed + stats.expired}</div>
              <p className="text-xs text-muted-foreground">
                {stats.expired} expired, {stats.failed} failed
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="api-keys" className="space-y-4">
        <TabsList>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="api-keys" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>
                  Manage API keys for external websites to use the verification service
                </CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create API Key
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New API Key</DialogTitle>
                    <DialogDescription>
                      Generate an API key for an external website to use the verification service
                    </DialogDescription>
                  </DialogHeader>

                  {newApiKey ? (
                    <div className="space-y-4">
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Important:</strong> Save this API key now. You won't be able to see it again!
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-2">
                        <Label>Your API Key</Label>
                        <div className="flex gap-2">
                          <Input
                            value={newApiKey}
                            readOnly
                            type={showApiKey ? 'text' : 'password'}
                            className="font-mono text-sm"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setShowApiKey(!showApiKey)}
                          >
                            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => copyToClipboard(newApiKey)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <DialogFooter>
                        <Button onClick={closeDialog}>Done</Button>
                      </DialogFooter>
                    </div>
                  ) : (
                    <form onSubmit={handleCreateApiKey}>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Name *</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="My E-commerce Site"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="domain">Website Domain *</Label>
                          <Input
                            id="domain"
                            value={formData.website_domain}
                            onChange={(e) => setFormData({ ...formData, website_domain: e.target.value })}
                            placeholder="myshop.com"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="prefix">Service Prefix *</Label>
                          <Select
                            value={formData.service_prefix}
                            onValueChange={(value) => setFormData({ ...formData, service_prefix: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(SERVICE_PREFIXES).map(([code, label]) => (
                                <SelectItem key={code} value={code}>
                                  {code} - {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="hourly">Max Per Hour</Label>
                            <Input
                              id="hourly"
                              type="number"
                              value={formData.max_requests_per_hour}
                              onChange={(e) => setFormData({ ...formData, max_requests_per_hour: parseInt(e.target.value) })}
                              min={1}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="daily">Max Per Day</Label>
                            <Input
                              id="daily"
                              type="number"
                              value={formData.max_requests_per_day}
                              onChange={(e) => setFormData({ ...formData, max_requests_per_day: parseInt(e.target.value) })}
                              min={1}
                            />
                          </div>
                        </div>
                      </div>

                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={closeDialog}>
                          Cancel
                        </Button>
                        <Button type="submit">Create API Key</Button>
                      </DialogFooter>
                    </form>
                  )}
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {apiKeys.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-muted-foreground">
                  No API keys created yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Domain</TableHead>
                      <TableHead>Prefix</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiKeys.map((key) => (
                      <TableRow key={key.id}>
                        <TableCell className="font-medium">{key.name}</TableCell>
                        <TableCell>{key.websiteDomain}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{key.servicePrefix}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={key.active ? 'success' : 'secondary'}>
                            {key.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {key.requestCount} / {key.maxRequestsPerDay}
                        </TableCell>
                        <TableCell>
                          {key.lastUsedAt
                            ? new Date(key.lastUsedAt).toLocaleDateString()
                            : 'Never'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleActive(key.id, key.active)}
                            >
                              {key.active ? '⏸' : '▶️'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteApiKey(key.id)}
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
        </TabsContent>

        <TabsContent value="documentation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Documentation</CardTitle>
              <CardDescription>
                How to integrate Instagram verification into your website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">1. Generate Verification Code</h3>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">
{`POST /api/verification/generate
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "external_website": "myshop.com",
  "external_user_id": "user123",
  "webhook_url": "https://myshop.com/webhooks/ig-verified",
  "expires_in_minutes": 10
}`}
                </pre>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">2. Display Code to User</h3>
                <p className="text-sm text-muted-foreground">
                  Show the generated code to your user and ask them to send it via Instagram DM to your bot account.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">3. Poll for Verification</h3>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">
{`GET /api/verification/check?session=SESSION_ID

Response:
{
  "status": "verified",
  "ig_username": "@johndoe",
  "verified_at": "2025-11-05T01:10:00Z"
}`}
                </pre>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">4. Webhook (Optional)</h3>
                <p className="text-sm text-muted-foreground">
                  If you provide a webhook URL, we'll POST to it when verification succeeds:
                </p>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">
{`POST https://your-site.com/webhook
X-Flowkick-Signature: HMAC_SIGNATURE

{
  "event": "verification.success",
  "ig_username": "@johndoe",
  "external_user_id": "user123",
  "verified_at": "2025-11-05T01:10:00Z"
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
