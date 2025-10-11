'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { QrCode } from 'lucide-react';
import { format } from 'date-fns';

interface QRCodeData {
  id: string;
  code: string;
  type: string;
  active: boolean;
  scanned: boolean;
  scannedAt: string | null;
  scannedBy: string | null;
  expiresAt: string | null;
  userName: string;
  userManychatId: string;
  metadata: any;
  createdAt: string;
}

export default function QRCodesPage() {
  const [qrCodes, setQRCodes] = useState<QRCodeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/qr')
      .then((res) => res.json())
      .then((data) => {
        setQRCodes(data.qrCodes || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching QR codes:', err);
        setQRCodes([]);
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

  const getStatusBadge = (qr: QRCodeData) => {
    if (qr.scanned) return <Badge variant="secondary">Scanned</Badge>;
    if (qr.expiresAt && new Date(qr.expiresAt) < new Date())
      return <Badge variant="destructive">Expired</Badge>;
    if (!qr.active) return <Badge variant="outline">Inactive</Badge>;
    return <Badge variant="success">Active</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">QR Codes</h1>
        <p className="text-muted-foreground">
          View and manage promotional QR codes
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            All QR Codes ({qrCodes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {qrCodes.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              No QR codes generated yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scanned</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {qrCodes.map((qr) => (
                  <TableRow key={qr.id}>
                    <TableCell className="font-mono text-xs">
                      {qr.code.substring(0, 20)}...
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{qr.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">{qr.userName}</div>
                        <div className="text-xs text-muted-foreground">
                          {qr.userManychatId}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(qr)}</TableCell>
                    <TableCell>
                      {qr.scannedAt ? (
                        <div className="space-y-1">
                          <div className="text-sm">
                            {format(new Date(qr.scannedAt), 'MMM d, yyyy')}
                          </div>
                          {qr.scannedBy && (
                            <div className="text-xs text-muted-foreground">
                              by {qr.scannedBy}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {qr.expiresAt ? (
                        <span className="text-sm">
                          {format(new Date(qr.expiresAt), 'MMM d, yyyy')}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(qr.createdAt), 'MMM d, yyyy')}
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
