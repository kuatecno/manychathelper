'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Zap,
  TrendingUp,
  MessageSquare,
  Gift,
  Copy,
  CheckCircle2,
  Download,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { CORE_FLOWS, type CoreFlow } from '@/lib/core-flows';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CustomFieldSetup } from '@/components/custom-field-setup';

const categoryIcons = {
  engagement: TrendingUp,
  tracking: Zap,
  marketing: Gift,
  support: MessageSquare,
};

const categoryColors = {
  engagement: 'bg-blue-500',
  tracking: 'bg-purple-500',
  marketing: 'bg-green-500',
  support: 'bg-orange-500',
};

export default function CoreFlowsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFlow, setSelectedFlow] = useState<CoreFlow | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const filteredFlows = selectedCategory === 'all'
    ? CORE_FLOWS
    : CORE_FLOWS.filter(flow => flow.category === selectedCategory);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Core Flowkick Flows</h1>
        <p className="text-muted-foreground">
          Pre-built automation templates ready to import into Manychat
        </p>
      </div>

      {/* Info Alert */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-blue-900 dark:text-blue-100">
                How Core Flows Work
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                These flows use <strong>standard custom field names</strong> (like flowkick-sharescountinsta)
                so all your automations can work together seamlessly. Follow the setup instructions for each flow
                to build them in your Manychat account.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Filters */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList>
          <TabsTrigger value="all">All Flows</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="tracking">Tracking</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-4 mt-6">
          {/* Flow Cards Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredFlows.map((flow) => {
              const Icon = categoryIcons[flow.category];
              return (
                <Card key={flow.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{flow.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {flow.description}
                        </CardDescription>
                      </div>
                      <div className={`h-10 w-10 rounded-lg ${categoryColors[flow.category]} flex items-center justify-center`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Trigger Info */}
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-muted-foreground uppercase">
                        Trigger
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {flow.trigger.description}
                      </Badge>
                    </div>

                    {/* Custom Fields */}
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-muted-foreground uppercase">
                        Custom Fields ({flow.customFields.length})
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {flow.customFields.slice(0, 2).map((field) => (
                          <Badge key={field.name} variant="secondary" className="text-xs font-mono">
                            {field.name}
                          </Badge>
                        ))}
                        {flow.customFields.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{flow.customFields.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full" onClick={() => setSelectedFlow(flow)}>
                          View Setup Instructions
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-2xl">{flow.name}</DialogTitle>
                          <DialogDescription>{flow.description}</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 mt-4">
                          {/* Custom Field Setup */}
                          <div>
                            <h3 className="font-semibold mb-2">Step 1: Setup Custom Fields</h3>
                            <CustomFieldSetup flow={flow} />
                          </div>

                          {/* Trigger Details */}
                          <div>
                            <h3 className="font-semibold mb-2">Step 2: Create Manychat Trigger</h3>
                            <Card>
                              <CardContent className="pt-4">
                                <div className="flex items-center gap-2">
                                  <Zap className="h-4 w-4 text-orange-500" />
                                  <span className="text-sm">{flow.trigger.description}</span>
                                </div>
                              </CardContent>
                            </Card>
                          </div>

                          {/* Custom Fields Reference */}
                          <div>
                            <h3 className="font-semibold mb-2">Required Custom Fields</h3>
                            <div className="space-y-2">
                              {flow.customFields.map((field) => (
                                <Card key={field.name}>
                                  <CardContent className="pt-4">
                                    <div className="flex items-start justify-between">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                            {field.name}
                                          </code>
                                          <Badge variant="outline" className="text-xs">
                                            {field.type}
                                          </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                          {field.description}
                                        </p>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => copyToClipboard(field.name, field.name)}
                                      >
                                        {copied === field.name ? (
                                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        ) : (
                                          <Copy className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>

                          {/* Setup Instructions */}
                          <div>
                            <h3 className="font-semibold mb-2">Step 3: Build Automation in Manychat</h3>
                            <Card>
                              <CardContent className="pt-4">
                                <ol className="space-y-3">
                                  {flow.setupInstructions.map((instruction, index) => (
                                    <li key={index} className="flex gap-3">
                                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">
                                        {index + 1}
                                      </span>
                                      <span className="text-sm pt-0.5">{instruction}</span>
                                    </li>
                                  ))}
                                </ol>
                              </CardContent>
                            </Card>
                          </div>

                          {/* Actions */}
                          <div>
                            <h3 className="font-semibold mb-2">Flow Actions</h3>
                            <div className="space-y-2">
                              {flow.actions.map((action) => (
                                <Card key={action.step}>
                                  <CardContent className="pt-4">
                                    <div className="flex items-start gap-3">
                                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold flex-shrink-0">
                                        {action.step}
                                      </span>
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <Badge variant="secondary" className="text-xs">
                                            {action.type}
                                          </Badge>
                                        </div>
                                        <p className="text-sm">{action.description}</p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-4">
                            <Button className="flex-1" asChild>
                              <a href="https://manychat.com/flows" target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Open Manychat
                              </a>
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredFlows.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Zap className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No flows found in this category</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
