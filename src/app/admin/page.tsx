'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, QrCode, UserCircle, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface Stats {
  bookings: {
    total: number;
    today: number;
    week: number;
    month: number;
    pending: number;
    confirmed: number;
  };
  helpers: {
    total: number;
    active: number;
  };
  qrCodes: {
    total: number;
    active: number;
    scanned: number;
  };
  users: {
    total: number;
  };
  upcomingBookings: Array<{
    id: string;
    startTime: string;
    endTime: string;
    status: string;
    userName: string;
    helperName: string;
  }>;
  recentQRCodes: Array<{
    id: string;
    code: string;
    type: string;
    scanned: boolean;
    createdAt: string;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching stats:', err);
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

  if (!stats) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-destructive">Failed to load stats</div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Bookings',
      value: stats.bookings.total,
      subtitle: `${stats.bookings.today} today, ${stats.bookings.week} this week`,
      icon: Calendar,
      color: 'text-blue-500',
    },
    {
      title: 'Active Helpers',
      value: stats.helpers.active,
      subtitle: `${stats.helpers.total} total helpers`,
      icon: Users,
      color: 'text-green-500',
    },
    {
      title: 'QR Codes',
      value: stats.qrCodes.total,
      subtitle: `${stats.qrCodes.scanned} scanned, ${stats.qrCodes.active} active`,
      icon: QrCode,
      color: 'text-purple-500',
    },
    {
      title: 'Total Users',
      value: stats.users.total,
      subtitle: 'Instagram users',
      icon: UserCircle,
      color: 'text-orange-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your Manychat Helper service
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Upcoming Bookings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.upcomingBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming bookings</p>
            ) : (
              <div className="space-y-4">
                {stats.upcomingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{booking.helperName}</p>
                      <p className="text-xs text-muted-foreground">
                        {booking.userName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(booking.startTime), 'MMM d, yyyy HH:mm')}
                      </p>
                    </div>
                    <Badge
                      variant={
                        booking.status === 'confirmed'
                          ? 'success'
                          : booking.status === 'pending'
                          ? 'warning'
                          : 'secondary'
                      }
                    >
                      {booking.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent QR Codes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Recent QR Codes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentQRCodes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No QR codes generated</p>
            ) : (
              <div className="space-y-4">
                {stats.recentQRCodes.map((qr) => (
                  <div
                    key={qr.id}
                    className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium font-mono text-xs">
                        {qr.code.substring(0, 30)}...
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Type: {qr.type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(qr.createdAt), 'MMM d, yyyy HH:mm')}
                      </p>
                    </div>
                    <Badge variant={qr.scanned ? 'secondary' : 'success'}>
                      {qr.scanned ? 'Scanned' : 'Active'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Row */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Quick Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Pending Bookings</p>
              <p className="text-2xl font-bold">{stats.bookings.pending}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Confirmed Bookings</p>
              <p className="text-2xl font-bold">{stats.bookings.confirmed}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold">{stats.bookings.month}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
