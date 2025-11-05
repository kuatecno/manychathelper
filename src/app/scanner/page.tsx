'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QRScanner } from '@/components/QRScanner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface ValidationResult {
  valid: boolean;
  qrCode?: {
    id: string;
    code: string;
    type: string;
    active: boolean;
    expiresAt: string | null;
    metadata: any;
  };
  message?: string;
}

export default function ScannerPage() {
  const router = useRouter();
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [validating, setValidating] = useState(false);

  const handleScan = async (code: string) => {
    setValidating(true);
    setValidationResult(null);

    try {
      // Validate the scanned QR code
      const response = await fetch(`/api/qr-codes/validate?code=${encodeURIComponent(code)}`);
      const data = await response.json();

      setValidationResult(data);
    } catch (error) {
      console.error('Validation error:', error);
      setValidationResult({
        valid: false,
        message: 'Failed to validate QR code. Please try again.',
      });
    } finally {
      setValidating(false);
    }
  };

  const handleError = (error: string) => {
    console.error('Scanner error:', error);
  };

  return (
    <div className="container max-w-4xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/tools')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">QR Code Scanner</h1>
          <p className="text-muted-foreground">
            Scan and validate QR codes from your campaigns
          </p>
        </div>
      </div>

      {/* Scanner Component */}
      <QRScanner onScan={handleScan} onError={handleError} />

      {/* Validation Loading */}
      {validating && (
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <p className="text-sm text-muted-foreground">Validating QR code...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Results */}
      {validationResult && !validating && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {validationResult.valid ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Valid QR Code
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  Invalid QR Code
                </>
              )}
            </CardTitle>
            <CardDescription>
              {validationResult.message || (validationResult.valid ? 'This QR code is valid and active' : 'This QR code could not be validated')}
            </CardDescription>
          </CardHeader>

          {validationResult.valid && validationResult.qrCode && (
            <CardContent className="space-y-4">
              {/* QR Code Details */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Code:</span>
                  <span className="text-sm font-mono">{validationResult.qrCode.code}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Type:</span>
                  <Badge variant="outline">{validationResult.qrCode.type}</Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant={validationResult.qrCode.active ? 'success' : 'secondary'}>
                    {validationResult.qrCode.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                {validationResult.qrCode.expiresAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Expires:</span>
                    <span className="text-sm">
                      {new Date(validationResult.qrCode.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Metadata */}
              {validationResult.qrCode.metadata && Object.keys(validationResult.qrCode.metadata).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Metadata:</h4>
                  <div className="bg-muted p-3 rounded-lg">
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(validationResult.qrCode.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <ol className="list-decimal list-inside space-y-1">
            <li>Click "Start Scanning" to activate your camera</li>
            <li>Allow camera access when prompted by your browser</li>
            <li>Point your camera at a QR code</li>
            <li>The code will be automatically scanned and validated</li>
            <li>View the validation results and QR code details</li>
          </ol>

          <Alert className="mt-4">
            <AlertDescription>
              <strong>Note:</strong> This scanner works with QR codes generated through this system.
              It will validate the code and display associated campaign information.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
