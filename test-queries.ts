import { PrismaClient, CollegeType } from '@prisma/client';

const prisma = new PrismaClient();

async function runTests() {
  console.log('=== 1. Testing College Count & Summary ===');
  const collegeCount = await prisma.college.count();
  const userCount = await prisma.user.count();
  const courseCount = await prisma.course.count();
  const placementCount = await prisma.placement.count();
  const reviewCount = await prisma.review.count();
  const cutoffCount = await prisma.cutoffData.count();
  const savedCollegesCount = await prisma.savedCollege.count();
  const savedComparisonsCount = await prisma.savedComparison.count();

  console.log({
    colleges: collegeCount,
    users: userCount,
    courses: courseCount,
    placements: placementCount,
    reviews: reviewCount,
    cutoffs: cutoffCount,
    savedColleges: savedCollegesCount,
    savedComparisons: savedComparisonsCount,
  });

  console.log('\n=== 2. Testing Deep Nested Fetch for a College ===');
  const iitBombay = await prisma.college.findUnique({
    where: { slug: 'iit-bombay' },
    include: {
      courses: true,
      placements: {
        orderBy: { year: 'desc' },
        take: 1,
      },
      reviews: {
        include: { user: { select: { name: true, email: true } } },
        take: 2,
      },
      cutoffs: {
        where: { category: 'GENERAL' },
        include: { course: { select: { name: true } } },
      },
      savedBy: {
        include: { user: { select: { name: true } } },
      },
    },
  });

  if (!iitBombay) throw new Error('IIT Bombay not found');
  console.log(`Found: ${iitBombay.name} (${iitBombay.type}, Rating: ${iitBombay.rating})`);
  console.log(`Courses (${iitBombay.courses.length}): ${iitBombay.courses.map(c => c.name).join(', ')}`);
  console.log(`Latest Placement (2025): Avg = ₹${(iitBombay.placements[0]?.avgPackage / 100000).toFixed(2)} LPA, Highest = ₹${((iitBombay.placements[0]?.highestPackage || 0) / 100000).toFixed(2)} LPA`);
  console.log(`Recruiters: ${iitBombay.placements[0]?.topRecruiters.join(', ')}`);
  console.log(`Reviews (${iitBombay.reviews.length} shown):`);
  iitBombay.reviews.forEach(r => console.log(`  - [${r.rating}/5 by ${r.user?.name}]: "${r.comment}"`));
  console.log(`General Cutoffs:`, iitBombay.cutoffs.map(c => `${c.examName} -> Rank ${c.cutoffRank}`));
  console.log(`Saved by users: ${iitBombay.savedBy.map(s => s.user.name).join(', ')}`);

  console.log('\n=== 3. Testing Cutoff Rank Filtering (JEE Advanced General <= 500) ===');
  const topAdvColleges = await prisma.cutoffData.findMany({
    where: {
      examName: 'JEE Advanced',
      category: 'GENERAL',
      cutoffRank: { lte: 500 },
    },
    include: {
      college: { select: { name: true, city: true } },
      course: { select: { name: true } },
    },
    orderBy: { cutoffRank: 'asc' },
  });
  console.log(`Found ${topAdvColleges.length} options:`);
  topAdvColleges.forEach(c => {
    console.log(`  - ${c.college.name} | ${c.course.name} | Rank: ${c.cutoffRank}`);
  });

  console.log('\n=== 4. Testing User Saved Colleges and Saved Comparisons ===');
  const usersWithSaved = await prisma.user.findMany({
    where: {
      OR: [
        { savedColleges: { some: {} } },
        { savedComparisons: { some: {} } },
      ],
    },
    include: {
      savedColleges: {
        include: { college: { select: { name: true, city: true } } },
      },
      savedComparisons: {
        include: {
          colleges: {
            include: { college: { select: { name: true, city: true } } },
          },
        },
      },
    },
  });

  for (const u of usersWithSaved) {
    console.log(`User: ${u.name} (${u.email})`);
    if (u.savedColleges.length > 0) {
      console.log(`  Saved Colleges: ${u.savedColleges.map(sc => sc.college.name).join(', ')}`);
    }
    if (u.savedComparisons.length > 0) {
      console.log(`  Saved Comparisons: ${u.savedComparisons.map(sc => `[${sc.colleges.map(c => c.college.name).join(' vs ')}]`).join(', ')}`);
    }
  }

  console.log('\n=== 5. Testing Aggregations & Grouping ===');
  const collegesByType = await prisma.college.groupBy({
    by: ['type'],
    _count: { id: true },
    _avg: { rating: true, feesMin: true },
  });
  console.log('Colleges grouped by type:');
  collegesByType.forEach(g => {
    console.log(`  - ${g.type}: Count=${g._count.id}, Avg Rating=${g._avg.rating?.toFixed(2)}, Avg Min Fees=₹${Math.round(g._avg.feesMin || 0).toLocaleString('en-IN')}`);
  });

  console.log('\nAll model tests PASSED successfully!');
}

runTests()
  .catch(e => {
    console.error('Test failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
