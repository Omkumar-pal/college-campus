'use server';

import prisma from '@/lib/prisma';

export type PredictorResult = {
  bucket: 'safe' | 'target' | 'reach';
  cutoffRank: number;
  college: {
    id: string;
    slug: string;
    name: string;
    city: string;
    state: string;
    type: string;
    rating: number;
    feesMin: number;
    feesMax: number;
  };
  course: { name: string };
};

export async function predictColleges(
  rank: number,
  exam: string,
  category: string,
): Promise<PredictorResult[]> {
  // Find all cutoffs where cutoffRank >= userRank
  // (lower JEE rank number = better; if user's rank <= cutoff closing rank, they can get in)
  const cutoffs = await prisma.cutoffData.findMany({
    where: {
      examName: exam,
      category: category,
      cutoffRank: { gte: rank },
    },
    include: {
      college: {
        select: {
          id: true,
          slug: true,
          name: true,
          city: true,
          state: true,
          type: true,
          rating: true,
          feesMin: true,
          feesMax: true,
        },
      },
      course: { select: { name: true } },
    },
    orderBy: { cutoffRank: 'asc' }, // tightest cutoff first = hardest to get first
  });

  return cutoffs.map((c) => {
    // ratio of userRank / closingRank:
    // ratio <= 0.70 → user's rank is comfortably better → Safe
    // ratio 0.71–0.90 → moderate buffer → Target
    // ratio 0.91–1.00 → very close to the cutoff → Reach
    const ratio = rank / c.cutoffRank;
    let bucket: 'safe' | 'target' | 'reach';
    if (ratio <= 0.70) bucket = 'safe';
    else if (ratio <= 0.90) bucket = 'target';
    else bucket = 'reach';

    return {
      bucket,
      cutoffRank: c.cutoffRank,
      college: c.college,
      course: c.course,
    };
  });
}
