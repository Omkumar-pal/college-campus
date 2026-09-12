'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';

export async function toggleSavedCollege(collegeId: string) {
  const session = await getSession();
  if (!session) return { error: 'Login required' };

  const existing = await prisma.savedCollege.findUnique({
    where: { userId_collegeId: { userId: session.userId, collegeId } },
  });

  if (existing) {
    await prisma.savedCollege.delete({ where: { userId_collegeId: { userId: session.userId, collegeId } } });
    revalidatePath('/saved');
    return { saved: false };
  } else {
    await prisma.savedCollege.create({ data: { userId: session.userId, collegeId } });
    revalidatePath('/saved');
    return { saved: true };
  }
}

export async function getSavedIds() {
  const session = await getSession();
  if (!session) return new Set<string>();
  const rows = await prisma.savedCollege.findMany({ where: { userId: session.userId }, select: { collegeId: true } });
  return new Set(rows.map((r) => r.collegeId));
}

export async function saveComparison(slugs: string[]) {
  const session = await getSession();
  if (!session) return { error: 'Login required' };
  if (slugs.length < 2) return { error: 'Select at least 2 colleges' };
  if (slugs.length > 4) return { error: 'Max 4 colleges' };
  const colleges = await prisma.college.findMany({ where: { slug: { in: slugs } }, select: { id: true, slug: true } });
  if (colleges.length !== slugs.length) return { error: 'Invalid college' };
  const created = await prisma.savedComparison.create({
    data: {
      userId: session.userId,
      colleges: { create: colleges.map((c) => ({ collegeId: c.id })) },
    },
  });
  revalidatePath('/saved');
  return { id: created.id };
}

export async function deleteSavedComparison(id: string) {
  const session = await getSession();
  if (!session) return { error: 'Login required' };
  const existing = await prisma.savedComparison.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.userId) return { error: 'Not found' };
  await prisma.savedComparison.delete({ where: { id } });
  revalidatePath('/saved');
  return { success: true };
}

export type SavedCursor = { createdAt: string; id: string } | null;

export async function fetchSavedCollegesPaginated({ cursor, limit = 12 }: { cursor: SavedCursor; limit?: number }) {
  const session = await getSession();
  if (!session) return { items: [], nextCursor: null as SavedCursor, hasMore: false, total: 0 };
  const where: any = { userId: session.userId };
  let cursorFilter: any = {};
  if (cursor) {
    cursorFilter = {
      OR: [
        { createdAt: { lt: new Date(cursor.createdAt) } },
        { createdAt: new Date(cursor.createdAt), collegeId: { gt: cursor.id } },
      ],
    };
  }
  const finalWhere = cursor ? { AND: [where, cursorFilter] } : where;
  const [items, total] = await Promise.all([
    prisma.savedCollege.findMany({
      where: finalWhere,
      include: { college: { select: { slug: true, name: true, city: true, state: true } } },
      orderBy: [{ createdAt: 'desc' }, { collegeId: 'asc' }],
      take: limit + 1,
    }),
    prisma.savedCollege.count({ where }),
  ]);
  const hasMore = items.length > limit;
  const page = hasMore ? items.slice(0, limit) : items;
  const nextCursor: SavedCursor = hasMore ? { createdAt: page[page.length - 1].createdAt.toISOString(), id: page[page.length - 1].collegeId } : null;
  return { items: page, nextCursor, hasMore, total };
}

export async function fetchSavedComparisonsPaginated({ cursor, limit = 10 }: { cursor: SavedCursor; limit?: number }) {
  const session = await getSession();
  if (!session) return { items: [], nextCursor: null as SavedCursor, hasMore: false, total: 0 };
  const where: any = { userId: session.userId };
  let cursorFilter: any = {};
  if (cursor) {
    cursorFilter = {
      OR: [
        { createdAt: { lt: new Date(cursor.createdAt) } },
        { createdAt: new Date(cursor.createdAt), id: { gt: cursor.id } },
      ],
    };
  }
  const finalWhere = cursor ? { AND: [where, cursorFilter] } : where;
  const [items, total] = await Promise.all([
    prisma.savedComparison.findMany({
      where: finalWhere,
      include: { colleges: { include: { college: { select: { slug: true, name: true, city: true } } } } },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      take: limit + 1,
    }),
    prisma.savedComparison.count({ where }),
  ]);
  const hasMore = items.length > limit;
  const page = hasMore ? items.slice(0, limit) : items;
  const nextCursor: SavedCursor = hasMore ? { createdAt: page[page.length - 1].createdAt.toISOString(), id: page[page.length - 1].id } : null;
  return { items: page, nextCursor, hasMore, total };
}
