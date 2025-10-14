import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    // Get all snapshots for this user
    const snapshots = await prisma.userSnapshot.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Process snapshots to detect changes
    const history = snapshots.map((snapshot, index) => {
      const customFields = snapshot.customFieldsData
        ? JSON.parse(snapshot.customFieldsData)
        : [];
      const tags = snapshot.tagsData ? JSON.parse(snapshot.tagsData) : [];

      // Compare with previous snapshot to detect what changed
      const changes: string[] = [];
      if (index < snapshots.length - 1) {
        const prevSnapshot = snapshots[index + 1];

        if (snapshot.firstName !== prevSnapshot.firstName) {
          changes.push(
            `Name changed from "${prevSnapshot.firstName || 'N/A'}" to "${
              snapshot.firstName || 'N/A'
            }"`
          );
        }

        if (snapshot.igUsername !== prevSnapshot.igUsername) {
          changes.push(
            `Instagram username changed from "${
              prevSnapshot.igUsername || 'N/A'
            }" to "${snapshot.igUsername || 'N/A'}"`
          );
        }

        if (snapshot.email !== prevSnapshot.email) {
          changes.push(
            `Email changed from "${prevSnapshot.email || 'N/A'}" to "${
              snapshot.email || 'N/A'
            }"`
          );
        }

        if (snapshot.phone !== prevSnapshot.phone) {
          changes.push(
            `Phone changed from "${prevSnapshot.phone || 'N/A'}" to "${
              snapshot.phone || 'N/A'
            }"`
          );
        }

        // Check custom field changes
        const prevCustomFields = prevSnapshot.customFieldsData
          ? JSON.parse(prevSnapshot.customFieldsData)
          : [];

        customFields.forEach((field: any) => {
          const prevField = prevCustomFields.find(
            (f: any) => f.name === field.name
          );
          if (prevField && prevField.value !== field.value) {
            changes.push(
              `${field.name} changed from "${prevField.value}" to "${field.value}"`
            );
          } else if (!prevField && field.value !== null) {
            changes.push(`${field.name} set to "${field.value}"`);
          }
        });

        // Check tag changes
        const prevTags = prevSnapshot.tagsData
          ? JSON.parse(prevSnapshot.tagsData)
          : [];
        const prevTagNames = prevTags.map((t: any) => t.name);
        const currentTagNames = tags.map((t: any) => t.name);

        const addedTags = currentTagNames.filter(
          (name: string) => !prevTagNames.includes(name)
        );
        const removedTags = prevTagNames.filter(
          (name: string) => !currentTagNames.includes(name)
        );

        addedTags.forEach((tag: string) => {
          changes.push(`Tag "${tag}" added`);
        });
        removedTags.forEach((tag: string) => {
          changes.push(`Tag "${tag}" removed`);
        });
      }

      return {
        id: snapshot.id,
        createdAt: snapshot.createdAt.toISOString(),
        firstName: snapshot.firstName,
        lastName: snapshot.lastName,
        igUsername: snapshot.igUsername,
        email: snapshot.email,
        phone: snapshot.phone,
        whatsappPhone: snapshot.whatsappPhone,
        timezone: snapshot.timezone,
        profilePic: snapshot.profilePic,
        customFields,
        tags,
        changes,
      };
    });

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Error fetching user history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user history' },
      { status: 500 }
    );
  }
}
