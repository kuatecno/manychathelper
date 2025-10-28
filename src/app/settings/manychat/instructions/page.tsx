'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  type: string;
  description: string | null;
  config?: string | null;
}

export default function ManychatInstructionsPage() {
  const router = useRouter();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  useEffect(() => {
    const adminStr = localStorage.getItem('admin');
    if (!adminStr) {
      setError('Please log in to access integration instructions');
      router.push('/login');
      return;
    }

    try {
      const admin = JSON.parse(adminStr);
      if (!admin.username) {
        setError('Invalid admin session');
        router.push('/login');
        return;
      }
      setAdminUsername(admin.username);
      loadTools();
    } catch (err) {
      setError('Failed to load admin session');
      router.push('/login');
    }
  }, [router]);

  const loadTools = async () => {
    try {
      const res = await fetch('/api/tools/list');
      const data = await res.json();
      setTools(data.tools || []);
    } catch (err) {
      setError('Failed to load tools');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const CopyButton = ({ text, id }: { text: string; id: string }) => (
    <Button
      size="sm"
      variant="outline"
      onClick={() => copyToClipboard(text, id)}
    >
      {copied === id ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );

  const CodeValue = ({ label, value, copyId }: { label: string; value: string; copyId: string }) => (
    <div className="space-y-2">
      <div className="text-sm font-medium">{label}</div>
      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-lg bg-muted p-3 font-mono text-sm break-all">
          {value}
        </div>
        <CopyButton text={value} id={copyId} />
      </div>
    </div>
  );

  const StepCard = ({ number, title, children }: { number: number; title: string; children: React.ReactNode }) => (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
            {number}
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );

  if (loading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const qrTools = tools.filter(t => t.type === 'qr_generator');
  const bookingTools = tools.filter(t => t.type === 'booking');
  const aiTools = tools.filter(t => t.type === 'ai_chat' || t.type === 'ai_assistant');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manychat Integration Guide</h1>
        <p className="text-muted-foreground mt-2">
          Copy-paste ready instructions for your specific tools
        </p>
      </div>

      <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-900/20">
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          All values below are specific to your account and tools. Copy them directly into your Manychat flows.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue={qrTools.length > 0 ? 'qr' : bookingTools.length > 0 ? 'booking' : 'ai'} className="space-y-4">
        <TabsList>
          {qrTools.length > 0 && <TabsTrigger value="qr">QR Generator ({qrTools.length})</TabsTrigger>}
          {bookingTools.length > 0 && <TabsTrigger value="booking">Booking ({bookingTools.length})</TabsTrigger>}
          {aiTools.length > 0 && <TabsTrigger value="ai">AI Chat ({aiTools.length})</TabsTrigger>}
        </TabsList>

        {/* QR GENERATOR */}
        {qrTools.length > 0 && (
          <TabsContent value="qr" className="space-y-4">
            {qrTools.map((tool) => (
              <Card key={tool.id}>
                <CardHeader>
                  <CardTitle>{tool.name}</CardTitle>
                  <CardDescription>{tool.description || 'QR Code Generator'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Your Tool ID */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Your Tool Information</h3>
                    <CodeValue label="Tool ID" value={tool.id} copyId={`qr-tool-id-${tool.id}`} />
                    <CodeValue label="Admin Username" value={adminUsername} copyId={`qr-username-${tool.id}`} />
                  </div>

                  {/* Step 1: Generate QR */}
                  <StepCard number={1} title="Generate QR Code in Manychat">
                    <p className="text-sm text-muted-foreground">
                      Add "External Request" action with these settings:
                    </p>

                    <CodeValue label="Request Method" value="POST" copyId={`qr-method-${tool.id}`} />
                    <CodeValue
                      label="Request URL"
                      value={`${baseUrl}/api/qr/generate`}
                      copyId={`qr-url-${tool.id}`}
                    />

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Header</div>
                      <div className="rounded-lg bg-muted p-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-semibold">Key:</span>
                          <span className="font-mono">Content-Type</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="font-semibold">Value:</span>
                          <span className="font-mono">application/json</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Request Body (JSON)</div>
                      <div className="relative">
                        <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
{`{
  "tool_id": "${tool.id}",
  "manychat_user_id": {{subscriber_id}},
  "type": "promotion",
  "expires_in_days": 30,
  "metadata": {
    "campaign": "your_campaign_name"
  }
}`}
                        </pre>
                        <div className="absolute top-2 right-2">
                          <CopyButton
                            text={`{\n  "tool_id": "${tool.id}",\n  "manychat_user_id": {{subscriber_id}},\n  "type": "promotion",\n  "expires_in_days": 30,\n  "metadata": {\n    "campaign": "your_campaign_name"\n  }\n}`}
                            id={`qr-body-${tool.id}`}
                          />
                        </div>
                      </div>
                      <Alert>
                        <AlertDescription className="text-sm">
                          <strong>Important:</strong> Keep the double curly braces {'{{'} {'subscriber_id'} {'}} '}
                          exactly as shown. Manychat will replace it automatically.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </StepCard>

                  {/* Step 2: Save Response */}
                  <StepCard number={2} title="Save Response to Custom Fields">
                    <p className="text-sm text-muted-foreground">
                      The API returns these values - save them to custom fields:
                    </p>
                    <div className="rounded-lg bg-muted p-4 space-y-2 text-sm font-mono">
                      <div>• qr_image_url - The QR code image URL</div>
                      <div>• code - The QR code string</div>
                      <div>• expires_at - Expiration date</div>
                      <div>• qr_id - QR record ID</div>
                    </div>
                  </StepCard>

                  {/* Step 3: Display QR */}
                  <StepCard number={3} title="Display QR Code to User">
                    <ol className="list-decimal ml-4 space-y-2 text-sm">
                      <li>Add a "Gallery" or "Image" card to your flow</li>
                      <li>Set image URL to: <code className="bg-muted px-2 py-1 rounded">{'{{'} qr_image_url {'}}'}</code></li>
                      <li>Add text: "Your QR Code: <code className="bg-muted px-2 py-1 rounded">{'{{'} code {'}}'}</code>"</li>
                      <li>Add expiration: "Valid until: <code className="bg-muted px-2 py-1 rounded">{'{{'} expires_at {'}}'}</code>"</li>
                    </ol>
                  </StepCard>

                  {/* Step 4: Validate (Optional) */}
                  <StepCard number={4} title="Validate QR Code (Optional)">
                    <p className="text-sm text-muted-foreground mb-4">
                      To validate when scanned at your location:
                    </p>
                    <CodeValue label="Request Method" value="POST" copyId={`qr-validate-method-${tool.id}`} />
                    <CodeValue
                      label="Request URL"
                      value={`${baseUrl}/api/qr/validate`}
                      copyId={`qr-validate-url-${tool.id}`}
                    />
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Request Body (JSON)</div>
                      <div className="relative">
                        <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
{`{
  "code": {{code_to_validate}},
  "scanned_by": "Store Name"
}`}
                        </pre>
                        <div className="absolute top-2 right-2">
                          <CopyButton
                            text={`{\n  "code": {{code_to_validate}},\n  "scanned_by": "Store Name"\n}`}
                            id={`qr-validate-body-${tool.id}`}
                          />
                        </div>
                      </div>
                    </div>
                  </StepCard>

                  {/* QR Image URL Format */}
                  <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      <strong>QR Image URL Format:</strong>
                      <div className="mt-2 font-mono text-xs break-all">
                        {baseUrl}/api/qr/{adminUsername}/[CODE]
                      </div>
                      <div className="mt-2 text-sm">
                        This URL displays the actual QR code image that users can scan.
                      </div>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        )}

        {/* BOOKING */}
        {bookingTools.length > 0 && (
          <TabsContent value="booking" className="space-y-4">
            {bookingTools.map((tool) => (
              <Card key={tool.id}>
                <CardHeader>
                  <CardTitle>{tool.name}</CardTitle>
                  <CardDescription>{tool.description || 'Booking Tool'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Your Tool ID */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Your Tool Information</h3>
                    <CodeValue label="Tool ID" value={tool.id} copyId={`booking-tool-id-${tool.id}`} />
                  </div>

                  {/* Step 1: Check Availability */}
                  <StepCard number={1} title="Check Available Time Slots">
                    <p className="text-sm text-muted-foreground">
                      First, ask user for date, then check availability:
                    </p>
                    <CodeValue label="Request Method" value="GET" copyId={`booking-method-${tool.id}`} />
                    <CodeValue
                      label="Request URL"
                      value={`${baseUrl}/api/bookings/availability?tool_id=${tool.id}&date={{selected_date}}`}
                      copyId={`booking-url-${tool.id}`}
                    />
                    <Alert>
                      <AlertDescription className="text-sm">
                        <strong>Date Format:</strong> YYYY-MM-DDTHH:MM:SSZ (e.g., 2025-10-28T00:00:00Z)
                      </AlertDescription>
                    </Alert>
                  </StepCard>

                  {/* Step 2: Show Slots */}
                  <StepCard number={2} title="Display Time Slots">
                    <p className="text-sm text-muted-foreground">
                      The API returns available_slots array. Parse it and show as:
                    </p>
                    <ul className="list-disc ml-4 space-y-1 text-sm">
                      <li>Quick Reply buttons</li>
                      <li>List of times</li>
                      <li>Save selected time to custom field: <code className="bg-muted px-2 py-1 rounded">selected_booking_time</code></li>
                    </ul>
                  </StepCard>

                  {/* Step 3: Create Booking */}
                  <StepCard number={3} title="Create the Booking">
                    <CodeValue label="Request Method" value="POST" copyId={`booking-create-method-${tool.id}`} />
                    <CodeValue
                      label="Request URL"
                      value={`${baseUrl}/api/bookings/create`}
                      copyId={`booking-create-url-${tool.id}`}
                    />
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Request Body (JSON)</div>
                      <div className="relative">
                        <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
{`{
  "tool_id": "${tool.id}",
  "manychat_user_id": {{subscriber_id}},
  "start_time": {{selected_booking_time}},
  "duration": 30,
  "notes": "Optional notes"
}`}
                        </pre>
                        <div className="absolute top-2 right-2">
                          <CopyButton
                            text={`{\n  "tool_id": "${tool.id}",\n  "manychat_user_id": {{subscriber_id}},\n  "start_time": {{selected_booking_time}},\n  "duration": 30,\n  "notes": "Optional notes"\n}`}
                            id={`booking-create-body-${tool.id}`}
                          />
                        </div>
                      </div>
                    </div>
                  </StepCard>

                  {/* Step 4: Confirmation */}
                  <StepCard number={4} title="Send Confirmation">
                    <p className="text-sm text-muted-foreground">
                      Save the response and send confirmation:
                    </p>
                    <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
                      <div>✅ Booking confirmed!</div>
                      <div>📅 Date: {'{{'} formatted_date {'}}'}</div>
                      <div>🕐 Time: {'{{'} formatted_time {'}}'}</div>
                      <div>📝 Booking ID: {'{{'} booking_id {'}}'}</div>
                    </div>
                  </StepCard>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        )}

        {/* AI CHAT */}
        {aiTools.length > 0 && (
          <TabsContent value="ai" className="space-y-4">
            {aiTools.map((tool) => {
              let aiConfig: any = null;
              try {
                if (tool.config) {
                  aiConfig = JSON.parse(tool.config);
                }
              } catch (e) {}

              return (
                <Card key={tool.id}>
                  <CardHeader>
                    <CardTitle>{tool.name}</CardTitle>
                    <CardDescription>{tool.description || 'AI Chat Tool'}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Configuration Status */}
                    {aiConfig ? (
                      <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
                        <AlertDescription className="text-green-800 dark:text-green-200">
                          <strong>✓ Tool Configured</strong>
                          <div className="mt-2 space-y-1 text-sm">
                            <div>• Model: {aiConfig.model || 'Not set'}</div>
                            <div>• Provider: {aiConfig.aiProvider || 'Not set'}</div>
                            <div>• Memory: {aiConfig.conversationMemory ? 'Enabled' : 'Disabled'}</div>
                          </div>
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          This tool needs configuration. Please edit it in the Tools page to add OpenAI settings.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Your Tool ID */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">Your Tool Information</h3>
                      <CodeValue label="Tool ID" value={tool.id} copyId={`ai-tool-id-${tool.id}`} />
                    </div>

                    {/* Step 1: Send Message */}
                    <StepCard number={1} title="Send Message to AI">
                      <CodeValue label="Request Method" value="POST" copyId={`ai-method-${tool.id}`} />
                      <CodeValue
                        label="Request URL"
                        value={`${baseUrl}/api/ai/chat`}
                        copyId={`ai-url-${tool.id}`}
                      />
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Request Body (JSON)</div>
                        <div className="relative">
                          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
{`{
  "tool_id": "${tool.id}",
  "manychat_user_id": {{subscriber_id}},
  "message": {{user_message}},
  "conversation_id": {{conversation_id}}
}`}
                          </pre>
                          <div className="absolute top-2 right-2">
                            <CopyButton
                              text={`{\n  "tool_id": "${tool.id}",\n  "manychat_user_id": {{subscriber_id}},\n  "message": {{user_message}},\n  "conversation_id": {{conversation_id}}\n}`}
                              id={`ai-body-${tool.id}`}
                            />
                          </div>
                        </div>
                        <Alert>
                          <AlertDescription className="text-sm">
                            <strong>Note:</strong> For first message, omit conversation_id. Save it from the response for follow-up messages.
                          </AlertDescription>
                        </Alert>
                      </div>
                    </StepCard>

                    {/* Step 2: Display Response */}
                    <StepCard number={2} title="Display AI Response">
                      <p className="text-sm text-muted-foreground">
                        The API returns:
                      </p>
                      <div className="rounded-lg bg-muted p-4 space-y-2 text-sm font-mono">
                        <div>• response - The AI's answer</div>
                        <div>• conversation_id - Save for next message</div>
                        <div>• tokens - Usage count</div>
                      </div>
                      <p className="text-sm mt-4">
                        Send <code className="bg-muted px-2 py-1 rounded">{'{{'} response {'}}'}</code> to the user and allow them to continue the conversation.
                      </p>
                    </StepCard>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        )}
      </Tabs>

      {/* No Tools Warning */}
      {tools.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>No Tools Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You haven't created any tools yet. Go to the Tools page to create your first tool.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Additional Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Resources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Button variant="outline" className="justify-start" asChild>
              <a href="https://help.manychat.com/hc/en-us/articles/360017478333-External-Request" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Manychat External Request Docs
              </a>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <a href="https://help.manychat.com/hc/en-us/articles/360017478053-Custom-Fields" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Manychat Custom Fields Guide
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
