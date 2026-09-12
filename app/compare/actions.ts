'use server';

import prisma from '@/lib/prisma';

export type CompareCollege = {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  type: string;
  establishedYear: number | null;
  feesMin: number;
  feesMax: number;
  rating: number;
  latestPlacement: {
    year: number;
    avgPackage: number;
    highestPackage: number | null;
    topRecruiters: string[];
  } | null;
  courses: { name: string; seats: number }[];
  bestCutoffGeneral: number | null; // JEE Main GENERAL closing rank
  reviewCount: number;
};

export async function searchCollegesForCompare(query: string, excludeSlugs: string[] = [], limit = 8) {
  const q = query.trim().slice(0, 100);
  if (q.length < 2) return [];
  const where: any = {
    OR: [
      { name: { contains: q, mode: 'insensitive' as const } },
      { city: { contains: q, mode: 'insensitive' as const } },
      { slug: { contains: q.toLowerCase().replace(/\s+/g, '-'), mode: 'insensitive' as const } },
    ],
  };
  if (excludeSlugs.length) {
    // Prisma AND with NOT in
    return prisma.college.findMany({
      where: { AND: [{ NOT: { slug: { in: excludeSlugs } } }, where] },
      select: { slug: true, name: true, city: true, state: true },
      orderBy: [{ rating: 'desc' }, { name: 'asc' }],
      take: limit,
    });
  }
  return prisma.college.findMany({
    where,
    select: { slug: true, name: true, city: true, state: true },
    orderBy: [{ rating: 'desc' }, { name: 'asc' }],
    take: limit,
  });
}

export async function fetchCollegesForCompare(slugs: string[]): Promise<CompareCollege[]> {
  if (slugs.length === 0) return [];

  const colleges = await prisma.college.findMany({
    where: { slug: { in: slugs } },
    include: {
      placements: {
        orderBy: { year: 'desc' },
        take: 1,
      },
      courses: {
        select: { name: true, seats: true },
      },
      cutoffs: {
        where: { examName: 'JEE Main', category: 'GENERAL' },
        orderBy: { cutoffRank: 'asc' },
        take: 1,
      },
      _count: {
        select: { reviews: true },
      },
    },
  });

  // Return in the same order as the slugs array
  return slugs
    .map((slug) => colleges.find((c) => c.slug === slug))
    .filter(Boolean)
    .map((c) => ({
      id: c!.id,
      slug: c!.slug,
      name: c!.name,
      city: c!.city,
      state: c!.state,
      type: c!.type,
      establishedYear: c!.establishedYear,
      feesMin: c!.feesMin,
      feesMax: c!.feesMax,
      rating: c!.rating,
      latestPlacement: c!.placements[0]
        ? {
            year: c!.placements[0].year,
            avgPackage: c!.placements[0].avgPackage,
            highestPackage: c!.placements[0].highestPackage,
            topRecruiters: c!.placements[0].topRecruiters,
          }
        : null,
      courses: c!.courses,
      bestCutoffGeneral: c!.cutoffs[0]?.cutoffRank ?? null,
      reviewCount: c!._count.reviews,
    })) as CompareCollege[];
}
