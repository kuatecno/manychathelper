'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface QRScannerProps {
  onScan?: (result: string) => void;
  onError?: (error: string) => void;
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerIdRef = useRef('qr-scanner-' + Math.random().toString(36).substr(2, 9));

  useEffect(() => {
    // Check camera permissions on mount
    checkCameraPermission();

    return () => {
      stopScanning();
    };
  }, []);

  const checkCameraPermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      setCameraPermission(result.state);

      result.addEventListener('change', () => {
        setCameraPermission(result.state);
      });
    } catch (err) {
      console.log('Permission API not supported');
    }
  };

  const startScanning = async () => {
    try {
      setError(null);
      setScanResult(null);

      // Check if browser supports camera
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser');
      }

      const html5QrCode = new Html5Qrcode(scannerIdRef.current);
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: 'environment' }, // Use back camera on mobile
        config,
        (decodedText) => {
          // Success callback
          setScanResult(decodedText);
          onScan?.(decodedText);
          stopScanning();
        },
        (errorMessage) => {
          // Error callback - silent, this fires constantly when no QR is detected
          // console.log('Scan error:', errorMessage);
        }
      );

      setScanning(true);
      setCameraPermission('granted');
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to start camera';
      setError(errorMsg);
      onError?.(errorMsg);
      setScanning(false);

      if (errorMsg.includes('Permission') || errorMsg.includes('NotAllowedError')) {
        setCameraPermission('denied');
      }
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setScanning(false);
  };

  const resetScanner = () => {
    setScanResult(null);
    setError(null);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          QR Code Scanner
        </CardTitle>
        <CardDescription>
          Scan QR codes using your device camera
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scanner Display */}
        <div className="relative">
          <div
            id={scannerIdRef.current}
            className="rounded-lg overflow-hidden bg-black"
            style={{
              minHeight: scanning ? '300px' : '0',
              display: scanning ? 'block' : 'none'
            }}
          />

          {!scanning && !scanResult && (
            <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
              <div className="text-center space-y-2">
                <Camera className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click Start Scanning to begin
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Camera Permission Alert */}
        {cameraPermission === 'denied' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Camera access denied. Please enable camera permissions in your browser settings.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Display */}
        {scanResult && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="space-y-2">
              <p className="font-semibold text-green-900 dark:text-green-100">
                QR Code Scanned Successfully!
              </p>
              <p className="text-sm text-green-800 dark:text-green-200 break-all font-mono">
                {scanResult}
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          {!scanning && !scanResult && (
            <Button
              onClick={startScanning}
              className="flex-1"
              disabled={cameraPermission === 'denied'}
            >
              <Camera className="mr-2 h-4 w-4" />
              Start Scanning
            </Button>
          )}

          {scanning && (
            <Button
              onClick={stopScanning}
              variant="destructive"
              className="flex-1"
            >
              <X className="mr-2 h-4 w-4" />
              Stop Scanning
            </Button>
          )}

          {scanResult && (
            <>
              <Button
                onClick={resetScanner}
                variant="outline"
                className="flex-1"
              >
                Scan Another
              </Button>
              <Button
                onClick={startScanning}
                className="flex-1"
              >
                <Camera className="mr-2 h-4 w-4" />
                Rescan
              </Button>
            </>
          )}
        </div>

        {/* Instructions */}
        {scanning && (
          <p className="text-xs text-center text-muted-foreground">
            Position the QR code within the frame
          </p>
        )}
      </CardContent>
    </Card>
  );
}
