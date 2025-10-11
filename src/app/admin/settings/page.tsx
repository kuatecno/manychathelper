'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, QrCode, Palette, Code } from 'lucide-react';

interface QRSettings {
  width: number;
  margin: number;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  darkColor: string;
  lightColor: string;
}

interface QRCodeFormat {
  prefix: string;
  includeUserId: boolean;
  includeTimestamp: boolean;
  includeRandom: boolean;
  customFormat: string;
}

export default function SettingsPage() {
  const [qrSettings, setQRSettings] = useState<QRSettings>({
    width: 300,
    margin: 2,
    errorCorrectionLevel: 'H',
    darkColor: '#000000',
    lightColor: '#FFFFFF',
  });

  const [qrFormat, setQRFormat] = useState<QRCodeFormat>({
    prefix: 'QR',
    includeUserId: true,
    includeTimestamp: true,
    includeRandom: true,
    customFormat: '{PREFIX}-{USER_ID}-{TIMESTAMP}-{RANDOM}',
  });

  const [apiEndpoint, setApiEndpoint] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load current settings from database
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();

        if (data.qr_appearance) {
          setQRSettings(data.qr_appearance);
        }
        if (data.qr_format) {
          setQRFormat(data.qr_format);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();

    // Get API endpoint
    setApiEndpoint(`${window.location.origin}/api/qr/generate`);
  }, []);

  const handleSaveAppearance = async () => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'qr_appearance',
          value: qrSettings,
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Error saving appearance settings:', error);
    }
  };

  const handleSaveFormat = async () => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'qr_format',
          value: qrFormat,
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Error saving format settings:', error);
    }
  };

  const generatePreviewCode = () => {
    let preview = qrFormat.customFormat;
    preview = preview.replace('{PREFIX}', qrFormat.prefix);
    preview = preview.replace('{USER_ID}', 'clx8h2j9');
    preview = preview.replace('{TIMESTAMP}', Date.now().toString());
    preview = preview.replace('{RANDOM}', 'a7k9p2');
    preview = preview.replace('{TYPE}', 'PROMOTION');
    return preview;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">QR Code Settings</h1>
        <p className="text-muted-foreground">
          Configure QR code appearance, format, and Manychat integration
        </p>
      </div>

      {saved && (
        <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 text-green-800 dark:text-green-200">
          ✓ Settings saved successfully!
        </div>
      )}

      <Tabs defaultValue="appearance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="appearance">
            <Palette className="mr-2 h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="format">
            <Code className="mr-2 h-4 w-4" />
            Code Format
          </TabsTrigger>
          <TabsTrigger value="manychat">
            <Settings className="mr-2 h-4 w-4" />
            Manychat Setup
          </TabsTrigger>
        </TabsList>

        {/* Appearance Settings */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>QR Code Appearance</CardTitle>
              <CardDescription>
                Customize the visual appearance of generated QR codes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="width">Size (pixels)</Label>
                  <Input
                    id="width"
                    type="number"
                    value={qrSettings.width}
                    onChange={(e) =>
                      setQRSettings({ ...qrSettings, width: parseInt(e.target.value) })
                    }
                    min={100}
                    max={1000}
                  />
                  <p className="text-xs text-muted-foreground">
                    Recommended: 300-600px
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="margin">Margin (modules)</Label>
                  <Input
                    id="margin"
                    type="number"
                    value={qrSettings.margin}
                    onChange={(e) =>
                      setQRSettings({ ...qrSettings, margin: parseInt(e.target.value) })
                    }
                    min={0}
                    max={10}
                  />
                  <p className="text-xs text-muted-foreground">
                    Border around QR code (0-10)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="darkColor">QR Code Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="darkColor"
                      type="color"
                      value={qrSettings.darkColor}
                      onChange={(e) =>
                        setQRSettings({ ...qrSettings, darkColor: e.target.value })
                      }
                      className="w-20"
                    />
                    <Input
                      type="text"
                      value={qrSettings.darkColor}
                      onChange={(e) =>
                        setQRSettings({ ...qrSettings, darkColor: e.target.value })
                      }
                      placeholder="#000000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lightColor">Background Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="lightColor"
                      type="color"
                      value={qrSettings.lightColor}
                      onChange={(e) =>
                        setQRSettings({ ...qrSettings, lightColor: e.target.value })
                      }
                      className="w-20"
                    />
                    <Input
                      type="text"
                      value={qrSettings.lightColor}
                      onChange={(e) =>
                        setQRSettings({ ...qrSettings, lightColor: e.target.value })
                      }
                      placeholder="#FFFFFF"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="errorCorrection">Error Correction</Label>
                  <select
                    id="errorCorrection"
                    value={qrSettings.errorCorrectionLevel}
                    onChange={(e) =>
                      setQRSettings({
                        ...qrSettings,
                        errorCorrectionLevel: e.target.value as 'L' | 'M' | 'Q' | 'H',
                      })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="L">Low (7% recovery)</option>
                    <option value="M">Medium (15% recovery)</option>
                    <option value="Q">Quartile (25% recovery)</option>
                    <option value="H">High (30% recovery)</option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Higher = more damage tolerance but larger QR
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveAppearance}>Save Appearance Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Format Settings */}
        <TabsContent value="format">
          <Card>
            <CardHeader>
              <CardTitle>QR Code Value Format</CardTitle>
              <CardDescription>
                Configure what data is encoded in the QR code
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prefix">Prefix</Label>
                  <Input
                    id="prefix"
                    value={qrFormat.prefix}
                    onChange={(e) =>
                      setQRFormat({ ...qrFormat, prefix: e.target.value })
                    }
                    placeholder="QR"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Include in QR Code:</Label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={qrFormat.includeUserId}
                        onChange={(e) =>
                          setQRFormat({ ...qrFormat, includeUserId: e.target.checked })
                        }
                        className="h-4 w-4"
                      />
                      <span className="text-sm">User ID (first 8 chars)</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={qrFormat.includeTimestamp}
                        onChange={(e) =>
                          setQRFormat({ ...qrFormat, includeTimestamp: e.target.checked })
                        }
                        className="h-4 w-4"
                      />
                      <span className="text-sm">Timestamp</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={qrFormat.includeRandom}
                        onChange={(e) =>
                          setQRFormat({ ...qrFormat, includeRandom: e.target.checked })
                        }
                        className="h-4 w-4"
                      />
                      <span className="text-sm">Random string (6 chars)</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customFormat">Custom Format</Label>
                  <Input
                    id="customFormat"
                    value={qrFormat.customFormat}
                    onChange={(e) =>
                      setQRFormat({ ...qrFormat, customFormat: e.target.value })
                    }
                    placeholder="{PREFIX}-{USER_ID}-{TIMESTAMP}-{RANDOM}"
                  />
                  <p className="text-xs text-muted-foreground">
                    Available variables: {'{PREFIX}'}, {'{TYPE}'}, {'{USER_ID}'}, {'{TIMESTAMP}'}, {'{RANDOM}'}
                  </p>
                </div>

                <div className="rounded-lg border bg-muted/50 p-4">
                  <Label className="text-sm font-semibold">Preview:</Label>
                  <p className="mt-2 font-mono text-sm">{generatePreviewCode()}</p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveFormat}>Save Format Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manychat Setup */}
        <TabsContent value="manychat">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Manychat External Request</CardTitle>
                <CardDescription>
                  Copy this configuration to your Manychat flow
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>API Endpoint</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(apiEndpoint)}
                    >
                      Copy
                    </Button>
                  </div>
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <p className="font-mono text-sm">{apiEndpoint}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Method</Label>
                  </div>
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <p className="font-mono text-sm">POST</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Request Body (JSON)</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(`{
  "manychat_user_id": "{{subscriber_id}}",
  "type": "promotion",
  "expires_in_days": 30,
  "metadata": {
    "campaign": "summer_sale"
  }
}`)
                      }
                    >
                      Copy
                    </Button>
                  </div>
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <pre className="text-xs">{`{
  "manychat_user_id": "{{subscriber_id}}",
  "type": "promotion",
  "expires_in_days": 30,
  "metadata": {
    "campaign": "summer_sale"
  }
}`}</pre>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Response Mapping</Label>
                  <div className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <code className="text-xs">qr_image_url</code>
                      <span className="text-muted-foreground">→ Save to Custom Field</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <code className="text-xs">code</code>
                      <span className="text-muted-foreground">→ Save to Custom Field</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <code className="text-xs">expires_at</code>
                      <span className="text-muted-foreground">→ Save to Custom Field</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Available QR Types</CardTitle>
                <CardDescription>
                  Types you can use in the "type" field
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 md:grid-cols-3">
                  {['promotion', 'validation', 'discount'].map((type) => (
                    <div key={type} className="rounded-lg border p-3">
                      <code className="text-sm font-semibold">{type}</code>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
