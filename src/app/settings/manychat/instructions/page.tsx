'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle2, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ManychatInstructionsPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const CodeBlock = ({ code, id }: { code: string; id: string }) => (
    <div className="relative">
      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
        <code>{code}</code>
      </pre>
      <Button
        size="sm"
        variant="ghost"
        className="absolute top-2 right-2"
        onClick={() => copyToClipboard(code, id)}
      >
        {copiedCode === id ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manychat Integration Guide</h1>
        <p className="text-muted-foreground">
          Step-by-step instructions for integrating your tools with Manychat flows
        </p>
      </div>

      <Tabs defaultValue="qr_generator" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="qr_generator">QR Generator</TabsTrigger>
          <TabsTrigger value="booking">Booking</TabsTrigger>
          <TabsTrigger value="ai_chat">AI Chat</TabsTrigger>
          <TabsTrigger value="tools_list">Tools List</TabsTrigger>
        </TabsList>

        {/* QR GENERATOR */}
        <TabsContent value="qr_generator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>QR Code Generator Tool</CardTitle>
              <CardDescription>
                Generate unique QR codes for promotions, discounts, or validation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Get Tool ID */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Step 1: Get Your Tool ID</h3>
                <p className="text-sm text-muted-foreground">
                  First, fetch your active tools to get the tool_id:
                </p>
                <CodeBlock
                  id="qr-tools-list"
                  code={`GET ${baseUrl}/api/tools/list

Response:
{
  "tools": [
    {
      "id": "clx8h2j9k0000...",
      "name": "Holiday QR Generator",
      "type": "qr_generator",
      "description": "Generate QR codes for holiday promotions"
    }
  ]
}`}
                />
              </div>

              {/* Step 2: Generate QR Code */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Step 2: Generate QR Code</h3>
                <p className="text-sm text-muted-foreground">
                  In your Manychat flow, add an "External Request" action:
                </p>
                <CodeBlock
                  id="qr-generate"
                  code={`POST ${baseUrl}/api/qr/generate
Content-Type: application/json

{
  "tool_id": "clx8h2j9k0000...",
  "manychat_user_id": "{{user_id}}",
  "type": "promotion",
  "expires_in_days": 30,
  "metadata": {
    "campaign": "black_friday",
    "discount": 25
  }
}

Response:
{
  "success": true,
  "qr_id": "clx8h3k2...",
  "code": "QR-clx8h2j9-1730000000-a7k9p2",
  "type": "promotion",
  "qr_image_url": "${baseUrl}/api/qr/username/QR-clx8h2j9-1730000000-a7k9p2",
  "admin_username": "your-username",
  "expires_at": "2025-11-28T00:00:00.000Z",
  "created_at": "2025-10-28T00:00:00.000Z"
}`}
                />
              </div>

              {/* Step 3: Display QR in Manychat */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Step 3: Display QR Code to User</h3>
                <Alert>
                  <AlertDescription>
                    <strong>In Manychat:</strong>
                    <ol className="list-decimal ml-4 mt-2 space-y-1">
                      <li>Save the response to custom fields: <code>qr_image_url</code>, <code>code</code>, <code>expires_at</code></li>
                      <li>Add a "Gallery" or "Image" card</li>
                      <li>Set image URL to: <code>{'{{qr_image_url}}'}</code></li>
                      <li>Add text: "Your QR Code: {'{{code}}'}"</li>
                      <li>Add expiration text: "Valid until: {'{{expires_at}}'}"</li>
                    </ol>
                  </AlertDescription>
                </Alert>
              </div>

              {/* Step 4: Validate QR Code */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Step 4: Validate QR Code (Optional)</h3>
                <p className="text-sm text-muted-foreground">
                  To validate when a QR code is scanned at checkout:
                </p>
                <CodeBlock
                  id="qr-validate"
                  code={`POST ${baseUrl}/api/qr/validate
Content-Type: application/json

{
  "code": "{{user input or scanned code}}",
  "scanned_by": "Store Name or Staff ID"
}

Response (Valid):
{
  "valid": true,
  "qr_id": "clx8h3k2...",
  "type": "promotion",
  "user_id": "1234567890",
  "user_name": "John Doe",
  "metadata": {
    "campaign": "black_friday",
    "discount": 25
  },
  "scanned_at": "2025-10-28T10:30:00.000Z"
}

Response (Invalid):
{
  "valid": false,
  "error": "QR code already used"
}`}
                />
              </div>

              {/* Use Cases */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Common Use Cases</h3>
                <ul className="list-disc ml-6 space-y-2 text-sm">
                  <li><strong>Promotions:</strong> Generate unique promo codes with QR images</li>
                  <li><strong>Discounts:</strong> One-time use discount QRs for in-store purchases</li>
                  <li><strong>Event Tickets:</strong> Validate entry at events by scanning QR codes</li>
                  <li><strong>Loyalty Points:</strong> Scan to collect points at physical locations</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BOOKING TOOL */}
        <TabsContent value="booking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Booking Tool</CardTitle>
              <CardDescription>
                Allow users to book appointments through Manychat
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Check Availability */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Step 1: Check Available Time Slots</h3>
                <p className="text-sm text-muted-foreground">
                  First, ask user for their preferred date, then fetch available slots:
                </p>
                <CodeBlock
                  id="booking-availability"
                  code={`GET ${baseUrl}/api/bookings/availability?tool_id=clx8h2j9k0000...&date=2025-10-28T00:00:00Z

Response:
{
  "tool_id": "clx8h2j9k0000...",
  "date": "2025-10-28T00:00:00Z",
  "available_slots": [
    "2025-10-28T09:00:00.000Z",
    "2025-10-28T09:30:00.000Z",
    "2025-10-28T10:00:00.000Z",
    "2025-10-28T10:30:00.000Z",
    "2025-10-28T11:00:00.000Z"
  ]
}`}
                />
              </div>

              {/* Step 2: Display Slots */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Step 2: Show Time Slots in Manychat</h3>
                <Alert>
                  <AlertDescription>
                    <strong>In Manychat:</strong>
                    <ol className="list-decimal ml-4 mt-2 space-y-1">
                      <li>Parse the <code>available_slots</code> array</li>
                      <li>Format times to user-friendly format (e.g., "9:00 AM", "9:30 AM")</li>
                      <li>Show as Quick Reply buttons or List</li>
                      <li>Save selected time to custom field: <code>selected_booking_time</code></li>
                    </ol>
                  </AlertDescription>
                </Alert>
              </div>

              {/* Step 3: Create Booking */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Step 3: Create the Booking</h3>
                <CodeBlock
                  id="booking-create"
                  code={`POST ${baseUrl}/api/bookings/create
Content-Type: application/json

{
  "tool_id": "clx8h2j9k0000...",
  "manychat_user_id": "{{user_id}}",
  "start_time": "{{selected_booking_time}}",
  "duration": 30,
  "notes": "{{user notes or optional}}"
}

Response:
{
  "success": true,
  "booking_id": "clx8h5m8...",
  "tool_name": "Appointment Booking",
  "start_time": "2025-10-28T09:00:00.000Z",
  "end_time": "2025-10-28T09:30:00.000Z",
  "status": "pending"
}`}
                />
              </div>

              {/* Step 4: Confirmation */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Step 4: Send Confirmation</h3>
                <Alert>
                  <AlertDescription>
                    <strong>In Manychat:</strong>
                    <ol className="list-decimal ml-4 mt-2 space-y-1">
                      <li>Save booking_id to custom field</li>
                      <li>Format start_time to readable format</li>
                      <li>Send confirmation: "✅ Booking confirmed! Your appointment is on {'{{formatted_date}}'} at {'{{formatted_time}}'}"</li>
                      <li>Optionally send calendar invite or reminder</li>
                    </ol>
                  </AlertDescription>
                </Alert>
              </div>

              {/* Use Cases */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Common Use Cases</h3>
                <ul className="list-disc ml-6 space-y-2 text-sm">
                  <li><strong>Appointments:</strong> Doctor, dentist, salon bookings</li>
                  <li><strong>Consultations:</strong> Free consultation calls or meetings</li>
                  <li><strong>Classes:</strong> Fitness class or workshop registrations</li>
                  <li><strong>Service Bookings:</strong> Home services, repairs, deliveries</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI CHAT TOOL */}
        <TabsContent value="ai_chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Chat Tool</CardTitle>
              <CardDescription>
                Integrate AI-powered conversations using OpenAI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Prerequisites */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Prerequisites</h3>
                <Alert>
                  <AlertDescription>
                    Before using AI Chat, configure your tool with:
                    <ul className="list-disc ml-4 mt-2">
                      <li><strong>AI Provider:</strong> "openai"</li>
                      <li><strong>Model:</strong> "gpt-4" or "gpt-3.5-turbo"</li>
                      <li><strong>API Key:</strong> Your OpenAI API key</li>
                      <li><strong>System Prompt:</strong> Define AI behavior</li>
                      <li><strong>Conversation Memory:</strong> true/false</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>

              {/* Step 1: First Message */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Step 1: Send First Message (New Conversation)</h3>
                <CodeBlock
                  id="ai-chat-new"
                  code={`POST ${baseUrl}/api/ai/chat
Content-Type: application/json

{
  "tool_id": "clx8h2j9k0000...",
  "manychat_user_id": "{{user_id}}",
  "message": "{{user message}}"
}

Response:
{
  "success": true,
  "conversation_id": "clx8h6n2...",
  "response": "Hello! How can I help you today?",
  "tokens": 45,
  "model": "gpt-4"
}`}
                />
              </div>

              {/* Step 2: Continue Conversation */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Step 2: Continue Conversation</h3>
                <CodeBlock
                  id="ai-chat-continue"
                  code={`POST ${baseUrl}/api/ai/chat
Content-Type: application/json

{
  "tool_id": "clx8h2j9k0000...",
  "manychat_user_id": "{{user_id}}",
  "message": "{{user message}}",
  "conversation_id": "{{saved_conversation_id}}"
}

Response:
{
  "success": true,
  "conversation_id": "clx8h6n2...",
  "response": "Based on our previous conversation...",
  "tokens": 120,
  "model": "gpt-4"
}`}
                />
              </div>

              {/* Manychat Flow */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Manychat Flow Setup</h3>
                <Alert>
                  <AlertDescription>
                    <ol className="list-decimal ml-4 space-y-2">
                      <li>
                        <strong>Initial trigger:</strong> Keyword like "chat" or "help"
                      </li>
                      <li>
                        <strong>User Input:</strong> Capture user message
                      </li>
                      <li>
                        <strong>External Request:</strong> Send to AI endpoint
                        <ul className="list-disc ml-6 mt-1">
                          <li>Include conversation_id if continuing</li>
                          <li>Omit conversation_id for new chat</li>
                        </ul>
                      </li>
                      <li>
                        <strong>Save Variables:</strong>
                        <ul className="list-disc ml-6 mt-1">
                          <li>conversation_id (for memory)</li>
                          <li>response (AI answer)</li>
                        </ul>
                      </li>
                      <li>
                        <strong>Display Response:</strong> Send {'{{response}}'} to user
                      </li>
                      <li>
                        <strong>Loop back:</strong> Allow user to ask another question
                      </li>
                    </ol>
                  </AlertDescription>
                </Alert>
              </div>

              {/* Use Cases */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Common Use Cases</h3>
                <ul className="list-disc ml-6 space-y-2 text-sm">
                  <li><strong>Customer Support:</strong> Answer common questions 24/7</li>
                  <li><strong>Product Recommendations:</strong> AI suggests products based on preferences</li>
                  <li><strong>FAQ Bot:</strong> Intelligent answers to frequently asked questions</li>
                  <li><strong>Language Translation:</strong> Translate user messages</li>
                  <li><strong>Content Creation:</strong> Generate personalized content or ideas</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TOOLS LIST */}
        <TabsContent value="tools_list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>List All Active Tools</CardTitle>
              <CardDescription>
                Fetch all available tools to show users or use in flows
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Endpoint */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Endpoint</h3>
                <CodeBlock
                  id="tools-list-endpoint"
                  code={`GET ${baseUrl}/api/tools/list

Response:
{
  "tools": [
    {
      "id": "clx8h2j9k0000...",
      "name": "Holiday QR Generator",
      "type": "qr_generator",
      "description": "Generate QR codes for holiday promotions"
    },
    {
      "id": "clx8h2j9k0001...",
      "name": "Appointment Booking",
      "type": "booking",
      "description": "Book appointments with our team"
    },
    {
      "id": "clx8h2j9k0002...",
      "name": "AI Assistant",
      "type": "ai_chat",
      "description": "Chat with our AI helper"
    }
  ]
}`}
                />
              </div>

              {/* Use Cases */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Use Cases</h3>
                <ul className="list-disc ml-6 space-y-2 text-sm">
                  <li><strong>Dynamic Menu:</strong> Show users all available tools as buttons</li>
                  <li><strong>Tool Selection:</strong> Let users choose which tool to use</li>
                  <li><strong>Conditional Logic:</strong> Check if specific tool type exists</li>
                </ul>
              </div>

              {/* Manychat Implementation */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Manychat Implementation</h3>
                <Alert>
                  <AlertDescription>
                    <ol className="list-decimal ml-4 space-y-1">
                      <li>Create External Request to fetch tools list</li>
                      <li>Parse the JSON response</li>
                      <li>Loop through tools array</li>
                      <li>Create Quick Reply buttons with tool names</li>
                      <li>Save selected tool_id to custom field</li>
                      <li>Route to appropriate flow based on tool type</li>
                    </ol>
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
