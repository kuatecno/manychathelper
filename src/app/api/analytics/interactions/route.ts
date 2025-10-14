import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7'; // days
    const days = parseInt(period, 10);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Get interaction history for the period
    const history = await prisma.interactionHistory.findMany({
      where: {
        date: {
          gte: startDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Aggregate by date
    const dailyStats = history.reduce((acc, record) => {
      const dateKey = record.date.toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          messages: 0,
          comments: 0,
          stories: 0,
          total: 0,
          uniqueUsers: new Set(),
        };
      }
      acc[dateKey].messages += record.messagesCount;
      acc[dateKey].comments += record.commentsCount;
      acc[dateKey].stories += record.storiesCount;
      acc[dateKey].total += record.totalCount;
      acc[dateKey].uniqueUsers.add(record.userId);
      return acc;
    }, {} as Record<string, any>);

    // Convert to array and calculate unique users count
    const dailyData = Object.values(dailyStats).map((day: any) => ({
      date: day.date,
      messages: day.messages,
      comments: day.comments,
      stories: day.stories,
      total: day.total,
      uniqueUsers: day.uniqueUsers.size,
    }));

    // Calculate period totals
    const periodTotals = dailyData.reduce(
      (acc, day) => ({
        messages: acc.messages + day.messages,
        comments: acc.comments + day.comments,
        stories: acc.stories + day.stories,
        total: acc.total + day.total,
      }),
      { messages: 0, comments: 0, stories: 0, total: 0 }
    );

    // Get previous period for comparison
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - days);
    const prevEndDate = new Date(startDate);
    prevEndDate.setDate(prevEndDate.getDate() - 1);

    const previousHistory = await prisma.interactionHistory.findMany({
      where: {
        date: {
          gte: prevStartDate,
          lte: prevEndDate,
        },
      },
    });

    const previousTotals = previousHistory.reduce(
      (acc, record) => ({
        messages: acc.messages + record.messagesCount,
        comments: acc.comments + record.commentsCount,
        stories: acc.stories + record.storiesCount,
        total: acc.total + record.totalCount,
      }),
      { messages: 0, comments: 0, stories: 0, total: 0 }
    );

    // Calculate growth percentages
    const growth = {
      messages:
        previousTotals.messages > 0
          ? ((periodTotals.messages - previousTotals.messages) / previousTotals.messages) * 100
          : periodTotals.messages > 0
          ? 100
          : 0,
      comments:
        previousTotals.comments > 0
          ? ((periodTotals.comments - previousTotals.comments) / previousTotals.comments) * 100
          : periodTotals.comments > 0
          ? 100
          : 0,
      stories:
        previousTotals.stories > 0
          ? ((periodTotals.stories - previousTotals.stories) / previousTotals.stories) * 100
          : periodTotals.stories > 0
          ? 100
          : 0,
      total:
        previousTotals.total > 0
          ? ((periodTotals.total - previousTotals.total) / previousTotals.total) * 100
          : periodTotals.total > 0
          ? 100
          : 0,
    };

    // Get top engaged users (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const recentInteractions = await prisma.interactionHistory.findMany({
      where: {
        date: {
          gte: yesterday,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            igUsername: true,
            profilePic: true,
          },
        },
      },
      orderBy: {
        totalCount: 'desc',
      },
      take: 10,
    });

    return NextResponse.json({
      period: days,
      dailyData,
      totals: periodTotals,
      previousTotals,
      growth,
      topUsers: recentInteractions.map((r) => ({
        userId: r.userId,
        name: r.user.firstName && r.user.lastName
          ? `${r.user.firstName} ${r.user.lastName}`
          : r.user.igUsername
          ? `@${r.user.igUsername}`
          : 'Unknown',
        profilePic: r.user.profilePic,
        messages: r.messagesCount,
        comments: r.commentsCount,
        stories: r.storiesCount,
        total: r.totalCount,
        date: r.date,
      })),
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
