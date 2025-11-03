'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QrCode, Plus, AlertCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface Tool {
  id: string;
  name: string;
  description: string | null;
  type: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    qrCodes: number;
  };
}

export default function QRCodesPage() {
  const router = useRouter();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTools = async () => {
      const adminStr = localStorage.getItem('admin');
      if (!adminStr) {
        router.push('/login');
        return;
      }

      try {
        const admin = JSON.parse(adminStr);
        const response = await fetch(`/api/admin/tools?adminId=${admin.id}&type=qr_generator`);

        if (!response.ok) {
          throw new Error('Failed to fetch QR generator tools');
        }

        const data = await response.json();
        setTools(data.tools || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tools');
      } finally {
        setLoading(false);
      }
    };

    fetchTools();
  }, [router]);

  if (loading) {
    return <div className="text-muted-foreground">Loading QR generator tools...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <QrCode className="h-8 w-8" />
            QR Code Generators
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your QR code generator tools and their generated codes
          </p>
        </div>
        <Link href="/tools?create=qr_generator">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New QR Generator
          </Button>
        </Link>
      </div>

      {/* Tools Grid */}
      {tools.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <QrCode className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No QR Generator Tools Yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first QR code generator tool to start generating QR codes for your campaigns
            </p>
            <Link href="/tools?create=qr_generator">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create QR Generator
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Link key={tool.id} href={`/qr-codes/${tool.id}`}>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <QrCode className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{tool.name}</CardTitle>
                    </div>
                    {!tool.isActive && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  {tool.description && (
                    <CardDescription className="line-clamp-2">
                      {tool.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-muted-foreground">
                      {tool._count?.qrCodes || 0} QR codes generated
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Help Card */}
      <Card className="border-blue-500 bg-blue-50 dark:bg-blue-900/20">
        <CardHeader>
          <CardTitle className="text-blue-800 dark:text-blue-200">About QR Code Generators</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 dark:text-blue-200 space-y-2">
          <p>
            QR code generator tools allow you to create unique QR codes that can be scanned by users
            to interact with your Manychat bot.
          </p>
          <p>
            Each tool can generate multiple QR codes with custom parameters, expiration dates, and
            usage limits. Perfect for marketing campaigns, events, or promotions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
