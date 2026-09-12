'use server';

import prisma from '@/lib/prisma';

export type CollegeCursor =
  | { type: 'rating'; rating: number; name: string; id: string }
  | { type: 'fees'; feesMin: number; feesMax: number; id: string }
  | null;

type FetchParams = {
  query?: string;
  type?: 'ALL' | 'GOVERNMENT' | 'PRIVATE' | 'DEEMED';
  sortBy?: 'rating' | 'fees';
  cursor?: CollegeCursor;
  limit?: number;
};

export async function fetchCollegesPaginated({
  query,
  type,
  sortBy = 'rating',
  cursor = null,
  limit = 12,
}: FetchParams) {
  const normalizedQuery = query?.trim() || undefined;
  const normalizedType = type && type !== 'ALL' ? type : undefined;

  // Build base search/type filter
  const baseAnd: any[] = [];
  if (normalizedType) baseAnd.push({ type: normalizedType });
  if (normalizedQuery) {
    baseAnd.push({
      OR: [
        { name: { contains: normalizedQuery, mode: 'insensitive' as const } },
        { city: { contains: normalizedQuery, mode: 'insensitive' as const } },
        { state: { contains: normalizedQuery, mode: 'insensitive' as const } },
      ],
    });
  }

  let cursorFilter: any = {};
  let orderBy: any[] = [];

  if (sortBy === 'fees') {
    orderBy = [{ feesMin: 'asc' }, { feesMax: 'asc' }, { id: 'asc' }];
    if (cursor && cursor.type === 'fees') {
      cursorFilter = {
        OR: [
          { feesMin: { gt: cursor.feesMin } },
          { feesMin: cursor.feesMin, feesMax: { gt: cursor.feesMax } },
          { feesMin: cursor.feesMin, feesMax: cursor.feesMax, id: { gt: cursor.id } },
        ],
      };
    }
  } else {
    // rating desc, name asc, id asc
    orderBy = [{ rating: 'desc' }, { name: 'asc' }, { id: 'asc' }];
    if (cursor && cursor.type === 'rating') {
      cursorFilter = {
        OR: [
          { rating: { lt: cursor.rating } },
          { rating: cursor.rating, name: { gt: cursor.name } },
          { rating: cursor.rating, name: cursor.name, id: { gt: cursor.id } },
        ],
      };
    }
  }

  const where = {
    AND: [...baseAnd, ...(Object.keys(cursorFilter).length ? [cursorFilter] : [])],
  };

  // If no filters and no cursor, avoid empty AND
  const finalWhere = baseAnd.length === 0 && Object.keys(cursorFilter).length === 0 ? {} : where;

  const colleges = await prisma.college.findMany({
    where: finalWhere,
    orderBy,
    take: limit + 1,
    include: {
      courses: { select: { id: true, name: true, feePerYear: true }, take: 3 },
      placements: { orderBy: { year: 'desc' }, take: 1 },
      _count: { select: { courses: true, reviews: true, cutoffs: true } },
    },
  });

  // Count total filtered (without cursor) for badge
  const totalFiltered = await prisma.college.count({
    where: baseAnd.length ? { AND: baseAnd } : {},
  });

  const hasMore = colleges.length > limit;
  const page = hasMore ? colleges.slice(0, limit) : colleges;

  let nextCursor: CollegeCursor = null;
  if (hasMore) {
    const last = page[page.length - 1];
    if (sortBy === 'fees') {
      nextCursor = { type: 'fees', feesMin: last.feesMin, feesMax: last.feesMax, id: last.id };
    } else {
      nextCursor = { type: 'rating', rating: last.rating, name: last.name, id: last.id };
    }
  }

  return { colleges: page, nextCursor, hasMore, totalFiltered };
}
