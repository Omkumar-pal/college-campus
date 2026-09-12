import { PrismaClient, CollegeType } from '@prisma/client';

const prisma = new PrismaClient();

let passed = 0;
let failed = 0;

async function runTest(name: string, fn: () => Promise<void>) {
    try {
        await fn();
        console.log(`✅ PASS: ${name}`);
        passed++;
    } catch (err: any) {
        console.log(`❌ FAIL: ${name}`);
        console.log(`   → ${err.message}`);
        failed++;
    }
}

function assert(condition: boolean, message: string) {
    if (!condition) throw new Error(message);
}

async function cleanDb() {
    // wipe in FK-safe order
    await prisma.cutoffData.deleteMany();
    await prisma.review.deleteMany();
    await prisma.savedComparisonCollege.deleteMany();
    await prisma.savedComparison.deleteMany();
    await prisma.savedCollege.deleteMany();
    await prisma.placement.deleteMany();
    await prisma.course.deleteMany();
    await prisma.college.deleteMany();
    await prisma.user.deleteMany();
}

async function main() {
    await cleanDb();

    // ---------------------------------------------------------------------
    // 1. BASIC CREATE + DEFAULTS
    // ---------------------------------------------------------------------

    let college: any;
    await runTest('College: create with required fields only, check defaults', async () => {
        college = await prisma.college.create({
            data: {
                slug: 'iit-indore',
                name: 'IIT Indore',
                city: 'Indore',
                state: 'Madhya Pradesh',
                type: CollegeType.GOVERNMENT,
                feesMin: 200000,
                feesMax: 800000,
            },
        });
        assert(college.country === 'India', 'country default should be India');
        assert(college.rating === 0, 'rating default should be 0');
        assert(college.reviewCount === 0, 'reviewCount default should be 0');
        assert(college.createdAt instanceof Date, 'createdAt should be auto-set');
    });

    await runTest('College: slug uniqueness is enforced', async () => {
        let threw = false;
        try {
            await prisma.college.create({
                data: {
                    slug: 'iit-indore', // duplicate
                    name: 'Fake Duplicate',
                    city: 'Somewhere',
                    state: 'MP',
                    type: CollegeType.PRIVATE,
                    feesMin: 1000,
                    feesMax: 2000,
                },
            });
        } catch (e) {
            threw = true;
        }
        assert(threw, 'expected unique constraint violation on slug, but it succeeded');
    });

    await runTest('College: enum rejects invalid CollegeType at compile/runtime', async () => {
        let threw = false;
        try {
            await prisma.college.create({
                data: {
                    slug: 'bad-enum-college',
                    name: 'Bad Enum College',
                    city: 'X',
                    state: 'Y',
                    // @ts-expect-error intentionally invalid enum value
                    type: 'NOT_A_REAL_TYPE',
                    feesMin: 1,
                    feesMax: 2,
                },
            });
        } catch (e) {
            threw = true;
        }
        assert(threw, 'expected invalid enum value to be rejected');
    });

    // ---------------------------------------------------------------------
    // 2. NESTED CREATE + RELATIONS
    // ---------------------------------------------------------------------

    let course: any;
    await runTest('Course: nested create under College, cascade FK set', async () => {
        course = await prisma.course.create({
            data: {
                collegeId: college.id,
                name: 'B.Tech Computer Science',
                durationYears: 4,
                feePerYear: 200000,
                seats: 120,
            },
        });
        assert(course.collegeId === college.id, 'course should reference parent college');
    });

    await runTest('Course: creating with a non-existent collegeId fails FK check', async () => {
        let threw = false;
        try {
            await prisma.course.create({
                data: {
                    collegeId: '00000000-0000-0000-0000-000000000000',
                    name: 'Ghost Course',
                    durationYears: 4,
                    feePerYear: 1000,
                },
            });
        } catch (e) {
            threw = true;
        }
        assert(threw, 'expected FK violation for non-existent collegeId');
    });

    await runTest('Placement: array field (topRecruiters) stores and returns correctly', async () => {
        const placement = await prisma.placement.create({
            data: {
                collegeId: college.id,
                year: 2025,
                avgPackage: 1200000,
                medianPackage: 1000000,
                highestPackage: 4500000,
                topRecruiters: ['Google', 'Microsoft', 'Amazon'],
            },
        });
        assert(Array.isArray(placement.topRecruiters), 'topRecruiters should be an array');
        assert(placement.topRecruiters.length === 3, 'topRecruiters should have 3 entries');
        assert(placement.topRecruiters.includes('Google'), 'topRecruiters should include Google');
    });

    // ---------------------------------------------------------------------
    // 3. USERS + NULLABLE FK (Review.user is optional)
    // ---------------------------------------------------------------------

    let user: any;
    await runTest('User: create with unique email', async () => {
        user = await prisma.user.create({
            data: {
                email: 'test@example.com',
                passwordHash: 'hashed-not-real',
                name: 'Test User',
            },
        });
        assert(user.email === 'test@example.com', 'email should match');
    });

    await runTest('User: email uniqueness is enforced', async () => {
        let threw = false;
        try {
            await prisma.user.create({
                data: {
                    email: 'test@example.com', // duplicate
                    passwordHash: 'x',
                    name: 'Dupe',
                },
            });
        } catch (e) {
            threw = true;
        }
        assert(threw, 'expected unique constraint violation on email');
    });

    let reviewWithUser: any;
    await runTest('Review: create with userId set', async () => {
        reviewWithUser = await prisma.review.create({
            data: {
                collegeId: college.id,
                userId: user.id,
                rating: 5,
                comment: 'Great placements',
            },
        });
        assert(reviewWithUser.userId === user.id, 'review should reference user');
    });

    await runTest('Review: create with userId omitted (anonymous review) is allowed', async () => {
        const anonReview = await prisma.review.create({
            data: {
                collegeId: college.id,
                rating: 3,
                comment: 'Anonymous review, no account',
            },
        });
        assert(anonReview.userId === null, 'userId should be null for anonymous review');
    });

    await runTest('Review: deleting the User sets review.userId to null (onDelete: SetNull)', async () => {
        await prisma.user.delete({ where: { id: user.id } });
        const refetched = await prisma.review.findUnique({ where: { id: reviewWithUser.id } });
        assert(refetched !== null, 'review row should still exist after user deletion');
        assert(refetched!.userId === null, 'review.userId should be null after user deletion (SetNull)');
    });

    // ---------------------------------------------------------------------
    // 4. COMPOSITE PRIMARY KEY (SavedCollege)
    // ---------------------------------------------------------------------

    let user2: any;
    await runTest('SavedCollege: composite PK (userId + collegeId) allows creation', async () => {
        user2 = await prisma.user.create({
            data: { email: 'saver@example.com', passwordHash: 'x', name: 'Saver' },
        });
        await prisma.savedCollege.create({
            data: { userId: user2.id, collegeId: college.id },
        });
    });

    await runTest('SavedCollege: duplicate (userId, collegeId) pair is rejected', async () => {
        let threw = false;
        try {
            await prisma.savedCollege.create({
                data: { userId: user2.id, collegeId: college.id }, // same pair again
            });
        } catch (e) {
            threw = true;
        }
        assert(threw, 'expected composite PK violation on duplicate save');
    });

    await runTest('SavedComparison: relational linking table enforces FKs and rejects fake college IDs', async () => {
        let threw = false;
        try {
            await prisma.savedComparison.create({
                data: {
                    userId: user2.id,
                    colleges: {
                        create: [{ collegeId: '00000000-0000-0000-0000-000000000000' }],
                    },
                },
            });
        } catch (e) {
            threw = true;
        }
        assert(threw, 'expected FK constraint violation when linking fake college ID');

        // Valid link
        const comparison = await prisma.savedComparison.create({
            data: {
                userId: user2.id,
                colleges: {
                    create: [{ collegeId: college.id }],
                },
            },
            include: { colleges: { include: { college: true } } },
        });
        assert(comparison.colleges.length === 1, 'should have 1 linked college');
        assert(comparison.colleges[0].college.id === college.id, 'should reference college correctly');
    });

    // ---------------------------------------------------------------------
    // 5. CUTOFF DATA (dual FK: College + Course)
    // ---------------------------------------------------------------------

    await runTest('CutoffData: create with default category', async () => {
        const cutoff = await prisma.cutoffData.create({
            data: {
                examName: 'JEE',
                collegeId: college.id,
                courseId: course.id,
                cutoffRank: 5000,
            },
        });
        assert(cutoff.category === 'GENERAL', 'category default should be GENERAL');
    });

    await runTest('CutoffData: @@unique([examName, courseId, category]) blocks duplicates and enables upsert', async () => {
        await prisma.cutoffData.create({
            data: { examName: 'NEET', collegeId: college.id, courseId: course.id, category: 'GENERAL', cutoffRank: 1000 },
        });
        let threw = false;
        try {
            await prisma.cutoffData.create({
                data: { examName: 'NEET', collegeId: college.id, courseId: course.id, category: 'GENERAL', cutoffRank: 1050 },
            });
        } catch (e) {
            threw = true;
        }
        assert(threw, 'expected unique constraint violation on duplicate (examName, courseId, category)');

        // Test upsert works smoothly
        const upserted = await prisma.cutoffData.upsert({
            where: {
                examName_courseId_category: {
                    examName: 'NEET',
                    courseId: course.id,
                    category: 'GENERAL',
                },
            },
            update: { cutoffRank: 950 },
            create: { examName: 'NEET', collegeId: college.id, courseId: course.id, category: 'GENERAL', cutoffRank: 950 },
        });
        assert(upserted.cutoffRank === 950, 'upsert should update rank to 950');
    });

    // ---------------------------------------------------------------------
    // 6. CASCADE DELETE FROM COLLEGE (courses, placements, reviews, cutoffs, savedCollege)
    // ---------------------------------------------------------------------

    await runTest('College: deleting a college cascades to courses, placements, reviews, cutoffs, savedColleges, and savedComparisonColleges', async () => {
        const coursesBefore = await prisma.course.count({ where: { collegeId: college.id } });
        const placementsBefore = await prisma.placement.count({ where: { collegeId: college.id } });
        const reviewsBefore = await prisma.review.count({ where: { collegeId: college.id } });
        const cutoffsBefore = await prisma.cutoffData.count({ where: { collegeId: college.id } });
        const savedBefore = await prisma.savedCollege.count({ where: { collegeId: college.id } });
        const comparisonCollegesBefore = await prisma.savedComparisonCollege.count({ where: { collegeId: college.id } });

        assert(coursesBefore > 0 && placementsBefore > 0 && reviewsBefore > 0 && cutoffsBefore > 0 && savedBefore > 0 && comparisonCollegesBefore > 0,
            'sanity check: related rows should exist before delete');

        await prisma.college.delete({ where: { id: college.id } });

        const coursesAfter = await prisma.course.count({ where: { collegeId: college.id } });
        const placementsAfter = await prisma.placement.count({ where: { collegeId: college.id } });
        const reviewsAfter = await prisma.review.count({ where: { collegeId: college.id } });
        const cutoffsAfter = await prisma.cutoffData.count({ where: { collegeId: college.id } });
        const savedAfter = await prisma.savedCollege.count({ where: { collegeId: college.id } });
        const comparisonCollegesAfter = await prisma.savedComparisonCollege.count({ where: { collegeId: college.id } });

        assert(coursesAfter === 0, 'courses should be cascade-deleted');
        assert(placementsAfter === 0, 'placements should be cascade-deleted');
        assert(reviewsAfter === 0, 'reviews should be cascade-deleted (including the anonymous one)');
        assert(cutoffsAfter === 0, 'cutoffs should be cascade-deleted');
        assert(savedAfter === 0, 'savedColleges should be cascade-deleted');
        assert(comparisonCollegesAfter === 0, 'savedComparisonColleges should be cascade-deleted');
    });

    await runTest('SavedComparison: comparison entry cleaned up via cascade when college is deleted (no dangling references)', async () => {
        const comparisonEntries = await prisma.savedComparisonCollege.findMany({ where: { collegeId: college.id } });
        assert(comparisonEntries.length === 0, 'comparison college junction entries should be cleanly cascaded');
    });

    // ---------------------------------------------------------------------
    // 7. FILTERING / QUERY EDGE CASES (indexes exist on these fields)
    // ---------------------------------------------------------------------

    await runTest('Filtering: range query on feesMin/feesMax + nested relation filter', async () => {
        const c1 = await prisma.college.create({
            data: {
                slug: 'test-college-mumbai', name: 'Test College Mumbai', city: 'Mumbai', state: 'Maharashtra',
                type: CollegeType.PRIVATE, feesMin: 50000, feesMax: 150000,
                courses: { create: [{ name: 'Computer Engineering', durationYears: 4, feePerYear: 100000 }] },
            },
        });
        await prisma.college.create({
            data: {
                slug: 'test-college-pune', name: 'Test College Pune', city: 'Pune', state: 'Maharashtra',
                type: CollegeType.PRIVATE, feesMin: 500000, feesMax: 900000,
                courses: { create: [{ name: 'Mechanical Engineering', durationYears: 4, feePerYear: 400000 }] },
            },
        });

        const result = await prisma.college.findMany({
            where: {
                city: 'Mumbai',
                feesMin: { gte: 0 },
                feesMax: { lte: 200000 },
                courses: { some: { name: { contains: 'Computer' } } },
            },
            include: { courses: true },
        });

        assert(result.length === 1, 'should find exactly 1 matching college');
        assert(result[0].slug === 'test-college-mumbai', 'should be the Mumbai college');

        // cleanup
        await prisma.course.deleteMany({ where: { collegeId: { in: [c1.id] } } });
        await prisma.college.deleteMany({ where: { slug: { in: ['test-college-mumbai', 'test-college-pune'] } } });
    });

    await runTest('Filtering: case sensitivity edge case on string contains', async () => {
        const c = await prisma.college.create({
            data: {
                slug: 'case-test-college', name: 'Case Test', city: 'Delhi', state: 'Delhi',
                type: CollegeType.DEEMED, feesMin: 1000, feesMax: 2000,
                courses: { create: [{ name: 'computer science', durationYears: 4, feePerYear: 10000 }] }, // lowercase
            },
        });

        const exactCase = await prisma.college.findMany({
            where: { courses: { some: { name: { contains: 'Computer' } } } }, // capital C
        });
        const insensitive = await prisma.college.findMany({
            where: { courses: { some: { name: { contains: 'Computer', mode: 'insensitive' } } } },
        });

        // Postgres `contains` is case-sensitive by default — this is a common gotcha.
        assert(exactCase.find(x => x.slug === 'case-test-college') === undefined,
            'default contains is case-sensitive, so lowercase "computer" should NOT match "Computer"');
        assert(insensitive.find(x => x.slug === 'case-test-college') !== undefined,
            'mode: insensitive should match regardless of case');

        await prisma.course.deleteMany({ where: { collegeId: c.id } });
        await prisma.college.delete({ where: { id: c.id } });
    });

    // ---------------------------------------------------------------------
    // 8. updatedAt AUTO-BUMP CHECK
    // ---------------------------------------------------------------------

    await runTest('College: updatedAt changes on update, createdAt stays fixed', async () => {
        const c = await prisma.college.create({
            data: {
                slug: 'timestamp-test', name: 'Timestamp Test', city: 'X', state: 'Y',
                type: CollegeType.GOVERNMENT, feesMin: 1, feesMax: 2,
            },
        });
        const originalCreatedAt = c.createdAt.getTime();
        const originalUpdatedAt = c.updatedAt.getTime();

        await new Promise((r) => setTimeout(r, 1000)); // ensure clock actually ticks

        const updated = await prisma.college.update({
            where: { id: c.id },
            data: { rating: 4.2 },
        });

        assert(updated.createdAt.getTime() === originalCreatedAt, 'createdAt should never change');
        assert(updated.updatedAt.getTime() > originalUpdatedAt, 'updatedAt should auto-bump on update');

        await prisma.college.delete({ where: { id: c.id } });
    });

    // ---------------------------------------------------------------------
    // SUMMARY
    // ---------------------------------------------------------------------

    console.log('\n──────────────────────────────');
    console.log(`✅ Passed: ${passed}   ❌ Failed: ${failed}`);
    console.log('──────────────────────────────\n');

    if (failed > 0) process.exitCode = 1;
}

main()
    .catch((e) => {
        console.error('Unexpected crash:', e);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });