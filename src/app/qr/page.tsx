'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { QrCode, Eye, Download } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';

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
  const [selectedQR, setSelectedQR] = useState<QRCodeData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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

  const getQRImageUrl = (code: string) => {
    return `/api/qr/image/${encodeURIComponent(code)}`;
  };

  const handleViewQR = (qr: QRCodeData) => {
    setSelectedQR(qr);
    setDialogOpen(true);
  };

  const handleDownload = (code: string) => {
    const link = document.createElement('a');
    link.href = getQRImageUrl(code);
    link.download = `qr-${code}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
                  <TableHead>Preview</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {qrCodes.map((qr) => (
                  <TableRow key={qr.id}>
                    <TableCell>
                      <img
                        src={getQRImageUrl(qr.code)}
                        alt="QR Code"
                        className="h-16 w-16 rounded border cursor-pointer hover:opacity-80 transition"
                        onClick={() => handleViewQR(qr)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {qr.code.substring(0, 15)}...
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{qr.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">{qr.userName}</div>
                        <div className="text-xs text-muted-foreground">
                          {qr.userManychatId.substring(0, 12)}...
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(qr)}</TableCell>
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
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewQR(qr)}
                          title="View QR Code"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(qr.code)}
                          title="Download QR Code"
                        >
                          <Download className="h-4 w-4" />
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

      {/* QR Code Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>QR Code Details</DialogTitle>
            <DialogDescription>
              Full QR code information and preview
            </DialogDescription>
          </DialogHeader>
          {selectedQR && (
            <div className="space-y-6">
              <div className="flex items-center justify-center p-8 bg-muted/50 rounded-lg">
                <img
                  src={getQRImageUrl(selectedQR.code)}
                  alt="QR Code"
                  className="max-w-sm w-full h-auto"
                />
              </div>

              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedQR)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold">Type</label>
                    <div className="mt-1">
                      <Badge variant="outline">{selectedQR.type}</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold">Code</label>
                  <div className="mt-1 font-mono text-xs p-2 bg-muted rounded">
                    {selectedQR.code}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold">User</label>
                    <div className="mt-1 text-sm">{selectedQR.userName}</div>
                    <div className="text-xs text-muted-foreground">
                      {selectedQR.userManychatId}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold">Created</label>
                    <div className="mt-1 text-sm">
                      {format(new Date(selectedQR.createdAt), 'MMM d, yyyy HH:mm')}
                    </div>
                  </div>
                </div>

                {selectedQR.expiresAt && (
                  <div>
                    <label className="text-sm font-semibold">Expires</label>
                    <div className="mt-1 text-sm">
                      {format(new Date(selectedQR.expiresAt), 'MMM d, yyyy HH:mm')}
                    </div>
                  </div>
                )}

                {selectedQR.scannedAt && (
                  <div>
                    <label className="text-sm font-semibold">Scanned</label>
                    <div className="mt-1 text-sm">
                      {format(new Date(selectedQR.scannedAt), 'MMM d, yyyy HH:mm')}
                      {selectedQR.scannedBy && (
                        <span className="text-muted-foreground"> by {selectedQR.scannedBy}</span>
                      )}
                    </div>
                  </div>
                )}

                {selectedQR.metadata && (
                  <div>
                    <label className="text-sm font-semibold">Metadata</label>
                    <pre className="mt-1 text-xs p-2 bg-muted rounded overflow-auto max-h-32">
                      {JSON.stringify(JSON.parse(selectedQR.metadata), null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleDownload(selectedQR.code)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button onClick={() => setDialogOpen(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
