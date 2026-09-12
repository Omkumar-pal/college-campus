import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const [
    colleges,
    users,
    courses,
    placements,
    reviews,
    cutoffs,
    savedColleges,
    savedComparisons,
    savedComparisonColleges,
  ] = await Promise.all([
    prisma.college.count(),
    prisma.user.count(),
    prisma.course.count(),
    prisma.placement.count(),
    prisma.review.count(),
    prisma.cutoffData.count(),
    prisma.savedCollege.count(),
    prisma.savedComparison.count(),
    prisma.savedComparisonCollege.count(),
  ]);

  console.log('\n📊 Current Database Record Counts:');
  console.table({
    Colleges: colleges,
    Users: users,
    Courses: courses,
    Placements: placements,
    Reviews: reviews,
    CutoffData: cutoffs,
    SavedColleges: savedColleges,
    SavedComparisons: savedComparisons,
    SavedComparisonColleges: savedComparisonColleges,
  });
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
