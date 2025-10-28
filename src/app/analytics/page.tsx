'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MessageSquare,
  MessageCircle,
  Image as ImageIcon,
  TrendingUp,
  TrendingDown,
  Users,
  RefreshCw,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import Image from 'next/image';

interface AnalyticsData {
  period: number;
  dailyData: Array<{
    date: string;
    messages: number;
    comments: number;
    stories: number;
    total: number;
    uniqueUsers: number;
  }>;
  totals: {
    messages: number;
    comments: number;
    stories: number;
    total: number;
  };
  previousTotals: {
    messages: number;
    comments: number;
    stories: number;
    total: number;
  };
  growth: {
    messages: number;
    comments: number;
    stories: number;
    total: number;
  };
  topUsers: Array<{
    userId: string;
    name: string;
    profilePic: string | null;
    messages: number;
    comments: number;
    stories: number;
    total: number;
    date: string;
  }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(7);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/analytics/interactions?period=${period}`);
      if (!res.ok) {
        throw new Error('Failed to load analytics');
      }
      const data = await res.json();
      setData(data);
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatGrowth = (value: number) => {
    const formatted = Math.abs(value).toFixed(1);
    return value >= 0 ? `+${formatted}%` : `-${formatted}%`;
  };

  const GrowthIndicator = ({ value }: { value: number }) => {
    const isPositive = value >= 0;
    return (
      <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        <span>{formatGrowth(value)}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Interaction Analytics</h1>
          <p className="text-muted-foreground">
            Track Instagram interactions from messages, comments, and stories
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1">
            {[7, 14, 30].map((d) => (
              <Button
                key={d}
                variant={period === d ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod(d)}
              >
                {d}d
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={loadAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totals.total.toLocaleString()}</div>
                <GrowthIndicator value={data.growth.total} />
                <p className="text-xs text-muted-foreground mt-1">vs previous {period} days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Messages</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totals.messages.toLocaleString()}</div>
                <GrowthIndicator value={data.growth.messages} />
                <p className="text-xs text-muted-foreground mt-1">Direct messages sent</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Comments</CardTitle>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totals.comments.toLocaleString()}</div>
                <GrowthIndicator value={data.growth.comments} />
                <p className="text-xs text-muted-foreground mt-1">Post comments made</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Stories</CardTitle>
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totals.stories.toLocaleString()}</div>
                <GrowthIndicator value={data.growth.stories} />
                <p className="text-xs text-muted-foreground mt-1">Story replies sent</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Engaged Users (Last 24h) */}
          <Card>
            <CardHeader>
              <CardTitle>Most Active Users (Last 24 Hours)</CardTitle>
            </CardHeader>
            <CardContent>
              {data.topUsers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No interaction data for the last 24 hours
                </p>
              ) : (
                <div className="space-y-4">
                  {data.topUsers.map((user) => (
                    <div
                      key={user.userId}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {user.profilePic ? (
                          <Image
                            src={user.profilePic}
                            alt={user.name}
                            width={40}
                            height={40}
                            className="rounded-full"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                            <Users className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Total: {user.total} interactions
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {user.messages > 0 && (
                          <Badge variant="secondary">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            {user.messages}
                          </Badge>
                        )}
                        {user.comments > 0 && (
                          <Badge variant="secondary">
                            <MessageCircle className="h-3 w-3 mr-1" />
                            {user.comments}
                          </Badge>
                        )}
                        {user.stories > 0 && (
                          <Badge variant="secondary">
                            <ImageIcon className="h-3 w-3 mr-1" />
                            {user.stories}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Daily Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {data.dailyData.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No interaction data for this period
                </p>
              ) : (
                <div className="space-y-2">
                  {data.dailyData.reverse().map((day) => (
                    <div
                      key={day.date}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="font-mono text-sm text-muted-foreground">
                          {new Date(day.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            {day.messages}
                          </Badge>
                          <Badge variant="outline">
                            <MessageCircle className="h-3 w-3 mr-1" />
                            {day.comments}
                          </Badge>
                          <Badge variant="outline">
                            <ImageIcon className="h-3 w-3 mr-1" />
                            {day.stories}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{day.total}</div>
                        <div className="text-xs text-muted-foreground">
                          {day.uniqueUsers} {day.uniqueUsers === 1 ? 'user' : 'users'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Insights */}
          {data.growth.comments > 20 && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                🎉 Great news! Comments are up {formatGrowth(data.growth.comments)} compared to the previous period.
                {data.growth.comments > 50 && ' This is your best performance yet!'}
              </AlertDescription>
            </Alert>
          )}

          {data.growth.stories > 20 && (
            <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-900/20">
              <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                📸 Story engagement is up {formatGrowth(data.growth.stories)}! Your story content is resonating well.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
    </div>
  );
}
