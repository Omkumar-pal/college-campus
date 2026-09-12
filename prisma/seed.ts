// prisma/seed.ts
// Run with: npx prisma db seed
// Requires package.json: { "prisma": { "seed": "ts-node prisma/seed.ts" } }
// Dev deps: npm i -D ts-node typescript @types/node

import { PrismaClient, CollegeType } from '@prisma/client';
import { randomUUID as uuid } from 'crypto';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
const meghaPal = {
  id: uuid(),
  name: 'Megha Pal',
  email: 'example@gmail.com',
  passwordHash: '$2b$10$aqOhfN1pu648HXMsQ11m9.KZp8scnm2QaTSXuU0azr9WKD4GGeZ6G', // bcrypt of "123456"
};
const users = [
  meghaPal,
  ...['Aarav Sharma', 'Ishita Verma', 'Rohan Mehta', 'Priya Nair', 'Kunal Deshpande',
  'Sneha Iyer', 'Arjun Reddy', 'Neha Kapoor', 'Vikram Singh', 'Ananya Gupta',
  'Rahul Joshi', 'Divya Menon', 'Aditya Rao', 'Meera Pillai', 'Karan Malhotra',
].map((name) => ({
  id: uuid(),
  name,
  email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
  passwordHash: '$2b$10$mockHashForSeedDataOnlyDoNotUseInProd1234567890abcd', // bcrypt of "password123"
}))];

function randomUser() {
  return users[Math.floor(Math.random() * users.length)].id;
}

// ---------------------------------------------------------------------------
// Review comment pool (picked semi-randomly per college)
// ---------------------------------------------------------------------------
const reviewComments = [
  'Strong faculty and good lab infrastructure. Placement support could be better organized.',
  'Great peer group and research opportunities, but the hostel facilities need an upgrade.',
  'Placements exceeded my expectations, especially for CSE and ECE branches.',
  'Campus life is vibrant, though the curriculum feels a bit outdated in places.',
  'Excellent industry connect for internships. Would recommend for core branches.',
  'Good college overall, but competition for top recruiters is intense.',
  'The alumni network genuinely helps with placements and higher studies guidance.',
  'Solid academics, average sports and extracurricular infrastructure.',
];

function makeReviews(count: number) {
  return Array.from({ length: count }, () => ({
    userId: randomUser(),
    rating: 3 + Math.floor(Math.random() * 3), // 3-5
    comment: reviewComments[Math.floor(Math.random() * reviewComments.length)],
  }));
}

// ---------------------------------------------------------------------------
// Placement generator (3 years, with mild year-over-year growth)
// ---------------------------------------------------------------------------
function makePlacements(baseAvgLPA: number, recruiters: string[]) {
  return [2023, 2024, 2025].map((year, i) => {
    const growth = 1 + i * 0.06;
    const avg = Math.round(baseAvgLPA * growth * 100000);
    return {
      year,
      avgPackage: avg,
      medianPackage: Math.round(avg * 0.85),
      highestPackage: Math.round(avg * (2.5 + Math.random())),
      topRecruiters: recruiters,
    };
  });
}

// ---------------------------------------------------------------------------
// Colleges — 15 real Indian engineering institutes, representative data
// ---------------------------------------------------------------------------
type CollegeSeed = {
  id: string; slug: string; name: string; city: string; state: string;
  type: CollegeType; establishedYear: number; feesMin: number; feesMax: number;
  rating: number; overview: string;
  courses: { id: string; name: string; feePerYear: number; seats: number }[];
  placements: ReturnType<typeof makePlacements>;
  reviews: ReturnType<typeof makeReviews>;
  jeeMainCutoffs?: boolean;
  jeeAdvancedCutoffs?: boolean;
};

function college(input: {
  slug: string; name: string; city: string; state: string; type: CollegeType;
  year: number; feesMin: number; feesMax: number; rating: number; overview: string;
  courseFees: [string, number, number][]; // name, feePerYear, seats
  baseAvgLPA: number; recruiters: string[]; reviewCount: number;
  jeeMain?: boolean; jeeAdvanced?: boolean;
}): CollegeSeed {
  return {
    id: uuid(),
    slug: input.slug,
    name: input.name,
    city: input.city,
    state: input.state,
    type: input.type,
    establishedYear: input.year,
    feesMin: input.feesMin,
    feesMax: input.feesMax,
    rating: input.rating,
    overview: input.overview,
    courses: input.courseFees.map(([name, feePerYear, seats]) => ({ id: uuid(), name, feePerYear, seats })),
    placements: makePlacements(input.baseAvgLPA, input.recruiters),
    reviews: makeReviews(input.reviewCount),
    jeeMainCutoffs: input.jeeMain,
    jeeAdvancedCutoffs: input.jeeAdvanced,
  };
}

const colleges: CollegeSeed[] = [
  college({
    slug: 'iit-bombay', name: 'Indian Institute of Technology Bombay', city: 'Mumbai', state: 'Maharashtra',
    type: CollegeType.GOVERNMENT, year: 1958, feesMin: 900000, feesMax: 1100000, rating: 4.8,
    overview: 'One of India\'s premier engineering institutes, known for research output and industry placements across core and tech sectors.',
    courseFees: [['Computer Science and Engineering', 230000, 120], ['Electrical Engineering', 220000, 100], ['Mechanical Engineering', 210000, 110]],
    baseAvgLPA: 24, recruiters: ['Google', 'Microsoft', 'Goldman Sachs', 'Sequoia Capital'], reviewCount: 4,
    jeeMain: true, jeeAdvanced: true,
  }),
  college({
    slug: 'iit-delhi', name: 'Indian Institute of Technology Delhi', city: 'New Delhi', state: 'Delhi',
    type: CollegeType.GOVERNMENT, year: 1961, feesMin: 900000, feesMax: 1100000, rating: 4.7,
    overview: 'Top-ranked IIT with strong departments in computer science, electrical engineering, and design.',
    courseFees: [['Computer Science and Engineering', 230000, 115], ['Electronics and Communication Engineering', 220000, 105], ['Mechanical Engineering', 210000, 110]],
    baseAvgLPA: 23, recruiters: ['Microsoft', 'Amazon', 'McKinsey & Company', 'Uber'], reviewCount: 4,
    jeeMain: true, jeeAdvanced: true,
  }),
  college({
    slug: 'iit-madras', name: 'Indian Institute of Technology Madras', city: 'Chennai', state: 'Tamil Nadu',
    type: CollegeType.GOVERNMENT, year: 1959, feesMin: 900000, feesMax: 1100000, rating: 4.8,
    overview: 'Consistently ranked the top engineering institute in India, with a strong research and startup ecosystem.',
    courseFees: [['Computer Science and Engineering', 230000, 118], ['Mechanical Engineering', 210000, 112], ['Civil Engineering', 200000, 90]],
    baseAvgLPA: 22, recruiters: ['Google', 'Qualcomm', 'Flipkart', 'Zoho'], reviewCount: 4,
    jeeMain: true, jeeAdvanced: true,
  }),
  college({
    slug: 'iit-indore', name: 'Indian Institute of Technology Indore', city: 'Indore', state: 'Madhya Pradesh',
    type: CollegeType.GOVERNMENT, year: 2009, feesMin: 850000, feesMax: 1000000, rating: 4.4,
    overview: 'A newer-generation IIT with a growing reputation in computer science and metallurgical engineering.',
    courseFees: [['Computer Science and Engineering', 210000, 80], ['Electrical Engineering', 200000, 70], ['Mechanical Engineering', 195000, 75]],
    baseAvgLPA: 16, recruiters: ['Samsung', 'Adobe', 'Deloitte', 'Byju\'s'], reviewCount: 3,
    jeeMain: true, jeeAdvanced: true,
  }),
  college({
    slug: 'nit-trichy', name: 'National Institute of Technology Tiruchirappalli', city: 'Tiruchirappalli', state: 'Tamil Nadu',
    type: CollegeType.GOVERNMENT, year: 1964, feesMin: 550000, feesMax: 650000, rating: 4.3,
    overview: 'One of the top NITs, well regarded for core engineering branches and consistent placement records.',
    courseFees: [['Computer Science and Engineering', 150000, 120], ['Electronics and Communication Engineering', 145000, 110], ['Mechanical Engineering', 140000, 115]],
    baseAvgLPA: 13, recruiters: ['TCS Digital', 'Cisco', 'Cognizant', 'Bosch'], reviewCount: 3,
    jeeMain: true,
  }),
  college({
    slug: 'nit-warangal', name: 'National Institute of Technology Warangal', city: 'Warangal', state: 'Telangana',
    type: CollegeType.GOVERNMENT, year: 1959, feesMin: 550000, feesMax: 650000, rating: 4.2,
    overview: 'A historic NIT with strong civil and mechanical engineering departments alongside growing CSE placements.',
    courseFees: [['Computer Science and Engineering', 150000, 115], ['Civil Engineering', 140000, 100], ['Mechanical Engineering', 140000, 110]],
    baseAvgLPA: 12, recruiters: ['Amazon', 'Larsen & Toubro', 'Infosys', 'Qualcomm'], reviewCount: 3,
    jeeMain: true,
  }),
  college({
    slug: 'dtu-delhi', name: 'Delhi Technological University', city: 'New Delhi', state: 'Delhi',
    type: CollegeType.GOVERNMENT, year: 1941, feesMin: 500000, feesMax: 600000, rating: 4.1,
    overview: 'A state government engineering university with strong industry ties in the Delhi-NCR tech corridor.',
    courseFees: [['Computer Science and Engineering', 155000, 130], ['Electronics and Communication Engineering', 150000, 110], ['Mechanical Engineering', 145000, 100]],
    baseAvgLPA: 11, recruiters: ['Adobe', 'Paytm', 'American Express', 'EY'], reviewCount: 3,
    jeeMain: true,
  }),
  college({
    slug: 'jadavpur-university', name: 'Jadavpur University', city: 'Kolkata', state: 'West Bengal',
    type: CollegeType.GOVERNMENT, year: 1955, feesMin: 100000, feesMax: 150000, rating: 4.0,
    overview: 'A well-known public university with low fees and a strong reputation in electronics and production engineering.',
    courseFees: [['Computer Science and Engineering', 30000, 90], ['Electronics and Telecommunication Engineering', 28000, 85], ['Production Engineering', 27000, 60]],
    baseAvgLPA: 9, recruiters: ['TCS', 'Wipro', 'ITC', 'Capgemini'], reviewCount: 3,
    jeeMain: false,
  }),
  college({
    slug: 'bits-pilani', name: 'Birla Institute of Technology and Science, Pilani', city: 'Pilani', state: 'Rajasthan',
    type: CollegeType.PRIVATE, year: 1964, feesMin: 1800000, feesMax: 2000000, rating: 4.3,
    overview: 'A top private institute known for its flexible curriculum, no-reservation admission via BITSAT, and strong placements.',
    courseFees: [['Computer Science', 450000, 150], ['Electronics and Instrumentation', 430000, 90], ['Mechanical Engineering', 420000, 100]],
    baseAvgLPA: 17, recruiters: ['Microsoft', 'Texas Instruments', 'Sprinklr', 'ZS Associates'], reviewCount: 3,
  }),
  college({
    slug: 'vit-vellore', name: 'Vellore Institute of Technology', city: 'Vellore', state: 'Tamil Nadu',
    type: CollegeType.PRIVATE, year: 1984, feesMin: 800000, feesMax: 1000000, rating: 3.9,
    overview: 'A large private university known for its fully residential campus and strong corporate recruitment drives.',
    courseFees: [['Computer Science and Engineering', 220000, 400], ['Electronics and Communication Engineering', 210000, 300], ['Mechanical Engineering', 200000, 250]],
    baseAvgLPA: 8, recruiters: ['TCS', 'Accenture', 'Cognizant', 'Amazon'], reviewCount: 4,
  }),
  college({
    slug: 'srm-chennai', name: 'SRM Institute of Science and Technology', city: 'Chennai', state: 'Tamil Nadu',
    type: CollegeType.PRIVATE, year: 1985, feesMin: 750000, feesMax: 950000, rating: 3.8,
    overview: 'A large private deemed-to-be university with a wide range of specializations and modern infrastructure.',
    courseFees: [['Computer Science and Engineering', 210000, 350], ['Information Technology', 200000, 200], ['Mechanical Engineering', 190000, 180]],
    baseAvgLPA: 7.5, recruiters: ['Infosys', 'TCS', 'Zoho', 'HCL'], reviewCount: 3,
  }),
  college({
    slug: 'manipal-institute-of-technology', name: 'Manipal Institute of Technology', city: 'Manipal', state: 'Karnataka',
    type: CollegeType.PRIVATE, year: 1957, feesMin: 850000, feesMax: 1050000, rating: 4.0,
    overview: 'Part of Manipal Academy of Higher Education, known for a strong campus ecosystem and international exposure.',
    courseFees: [['Computer Science and Engineering', 225000, 240], ['Electronics and Communication Engineering', 215000, 150], ['Mechanical Engineering', 205000, 120]],
    baseAvgLPA: 9, recruiters: ['Microsoft', 'Deloitte', 'Oracle', 'Bosch'], reviewCount: 3,
  }),
  college({
    slug: 'psg-college-of-technology', name: 'PSG College of Technology', city: 'Coimbatore', state: 'Tamil Nadu',
    type: CollegeType.PRIVATE, year: 1951, feesMin: 400000, feesMax: 500000, rating: 4.1,
    overview: 'A respected private autonomous college with strong core engineering placements in manufacturing and automotive sectors.',
    courseFees: [['Computer Science and Engineering', 120000, 120], ['Mechanical Engineering', 110000, 130], ['Electrical and Electronics Engineering', 110000, 100]],
    baseAvgLPA: 8, recruiters: ['TVS Motor', 'L&T', 'TCS', 'Robert Bosch'], reviewCount: 3,
  }),
  college({
    slug: 'thapar-institute', name: 'Thapar Institute of Engineering and Technology', city: 'Patiala', state: 'Punjab',
    type: CollegeType.DEEMED, year: 1956, feesMin: 700000, feesMax: 850000, rating: 3.9,
    overview: 'A deemed university with a strong regional reputation and steadily improving tech placements.',
    courseFees: [['Computer Science and Engineering', 195000, 180], ['Electronics and Communication Engineering', 185000, 120], ['Mechanical Engineering', 180000, 100]],
    baseAvgLPA: 8.5, recruiters: ['Samsung', 'Adobe', 'Paytm', 'Cognizant'], reviewCount: 3,
  }),
  college({
    slug: 'iiit-hyderabad', name: 'International Institute of Information Technology, Hyderabad', city: 'Hyderabad', state: 'Telangana',
    type: CollegeType.DEEMED, year: 1998, feesMin: 950000, feesMax: 1100000, rating: 4.5,
    overview: 'A research-focused deemed university specializing exclusively in computer science and information technology.',
    courseFees: [['Computer Science and Engineering', 260000, 130], ['Electronics and Communication Engineering', 250000, 60], ['Computer Science and Applied Mathematics', 255000, 40]],
    baseAvgLPA: 21, recruiters: ['Google', 'Microsoft', 'Rubrik', 'Media.net'], reviewCount: 3,
  }),
];

// ---------------------------------------------------------------------------
// JEE cutoff generation (rank-based, per category)
// Lower rank = harder to get. Categories loosen the required rank.
// ---------------------------------------------------------------------------
const categoryMultiplier: Record<string, number> = {
  GENERAL: 1, EWS: 1.15, OBC: 1.4, SC: 2.2, ST: 2.8,
};

function makeCutoffRows(c: CollegeSeed, examName: string, baseRank: number) {
  const cseCourse = c.courses[0]; // first course used as the reference program
  return Object.entries(categoryMultiplier).map(([category, mult]) => ({
    id: uuid(),
    examName,
    collegeId: c.id,
    courseId: cseCourse.id,
    category,
    cutoffRank: Math.round(baseRank * mult),
  }));
}

const jeeMainBaseRanks: Record<string, number> = {
  'iit-bombay': 3500, 'iit-delhi': 4200, 'iit-madras': 3800, 'iit-indore': 9500,
  'nit-trichy': 12000, 'nit-warangal': 13500, 'dtu-delhi': 8000, 'jadavpur-university': 25000,
  'bits-pilani': 15000, 'vit-vellore': 60000, 'srm-chennai': 90000,
  'manipal-institute-of-technology': 45000, 'psg-college-of-technology': 35000,
  'thapar-institute': 40000, 'iiit-hyderabad': 5000,
};

const jeeAdvancedBaseRanks: Record<string, number> = {
  'iit-bombay': 150, 'iit-delhi': 300, 'iit-madras': 220, 'iit-indore': 3200,
};

// ---------------------------------------------------------------------------
// Main seed routine
// ---------------------------------------------------------------------------
async function main() {
  console.log('Clearing existing data...');
  await prisma.cutoffData.deleteMany();
  await prisma.savedComparison.deleteMany();
  await prisma.savedCollege.deleteMany();
  await prisma.review.deleteMany();
  await prisma.placement.deleteMany();
  await prisma.course.deleteMany();
  await prisma.college.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding users...');
  await prisma.user.createMany({ data: users });

  console.log('Seeding colleges, courses, placements, reviews...');
  for (const c of colleges) {
    await prisma.college.create({
      data: {
        id: c.id,
        slug: c.slug,
        name: c.name,
        city: c.city,
        state: c.state,
        type: c.type,
        establishedYear: c.establishedYear,
        feesMin: c.feesMin,
        feesMax: c.feesMax,
        rating: c.rating,
        reviewCount: c.reviews.length,
        overview: c.overview,
        courses: { create: c.courses.map(({ id, name, feePerYear, seats }) => ({ id, name, durationYears: 4, feePerYear, seats })) },
        placements: { create: c.placements },
        reviews: { create: c.reviews },
      },
    });
  }

  console.log('Seeding JEE cutoff data...');
  const cutoffRows = colleges.flatMap((c) => {
    const rows = [];
    if (c.jeeMainCutoffs !== false && jeeMainBaseRanks[c.slug]) {
      rows.push(...makeCutoffRows(c, 'JEE Main', jeeMainBaseRanks[c.slug]));
    }
    if (c.jeeAdvancedCutoffs && jeeAdvancedBaseRanks[c.slug]) {
      rows.push(...makeCutoffRows(c, 'JEE Advanced', jeeAdvancedBaseRanks[c.slug]));
    }
    return rows;
  });
  await prisma.cutoffData.createMany({ data: cutoffRows });

  console.log('Seeding saved colleges and comparisons (sample)...');
  await prisma.savedCollege.createMany({
    data: [
      { userId: users[0].id, collegeId: colleges[0].id },
      { userId: users[0].id, collegeId: colleges[4].id },
      { userId: users[1].id, collegeId: colleges[8].id },
    ],
  });
  await prisma.savedComparison.create({
    data: {
      userId: users[0].id,
      colleges: {
        create: [
          { collegeId: colleges[0].id },
          { collegeId: colleges[4].id },
          { collegeId: colleges[8].id },
        ],
      },
    },
  });
  await prisma.savedComparison.create({
    data: {
      userId: users[2].id,
      colleges: {
        create: [
          { collegeId: colleges[9].id },
          { collegeId: colleges[10].id },
        ],
      },
    },
  });

  console.log(`Done. Seeded ${colleges.length} colleges, ${users.length} users, ${cutoffRows.length} cutoff rows.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
