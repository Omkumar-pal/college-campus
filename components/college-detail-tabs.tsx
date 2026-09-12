'use client';

import { useState } from 'react';
import {
  Building2,
  GraduationCap,
  Briefcase,
  Layers,
  Star,
  CheckCircle2,
  Users,
  Calendar,
  IndianRupee,
  MapPin,
  TrendingUp,
  Award,
  Filter,
  MessageCircle,
} from 'lucide-react';
import CommentSection from '@/components/comments/comment-section';

interface Course {
  id: string;
  name: string;
  durationYears: number;
  feePerYear: number;
  seats: number;
}

interface Placement {
  id: string;
  year: number;
  avgPackage: number;
  medianPackage: number | null;
  highestPackage: number | null;
  topRecruiters: string[];
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date | string;
  user: {
    name: string;
  } | null;
}

interface Cutoff {
  id: string;
  examName: string;
  category: string;
  cutoffRank: number;
  course: {
    name: string;
  };
}

interface CollegeData {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  country: string;
  type: string;
  establishedYear: number | null;
  feesMin: number;
  feesMax: number;
  rating: number;
  reviewCount: number;
  overview: string | null;
  courses: Course[];
  placements: Placement[];
  reviews: Review[];
  cutoffs: Cutoff[];
}

function formatCurrency(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)} L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

function formatLPA(amount: number | null | undefined): string {
  if (!amount) return 'N/A';
  return `₹${(amount / 100000).toFixed(1)} LPA`;
}

export default function CollegeDetailTabs({ college, isLoggedIn = false }: { college: CollegeData; isLoggedIn?: boolean }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'placements' | 'cutoffs' | 'reviews' | 'comments'>('overview');

  // Cutoff filters state
  const [selectedExam, setSelectedExam] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Extract unique exams and categories for filter chips
  const exams = Array.from(new Set(college.cutoffs.map((c) => c.examName)));
  const categories = Array.from(new Set(college.cutoffs.map((c) => c.category)));

  // Filtered cutoffs
  const filteredCutoffs = college.cutoffs.filter((c) => {
    if (selectedExam !== 'ALL' && c.examName !== selectedExam) return false;
    if (selectedCategory !== 'ALL' && c.category !== selectedCategory) return false;
    return true;
  });

  const latestPlacement = college.placements[0];

  return (
    <div className="space-y-6">
      {/* Navigation Tabs Bar */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-1.5 flex items-center gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('courses')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'courses'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Courses & Fees ({college.courses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('placements')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'placements'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Placements ({college.placements.length} Yrs)</span>
        </button>

        <button
          onClick={() => setActiveTab('cutoffs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'cutoffs'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Cutoffs ({college.cutoffs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'reviews'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Star className="w-4 h-4" />
          <span>Reviews ({college.reviews.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('comments')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'comments'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>Comments</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Overview text card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand-500" />
              <span>About {college.name}</span>
            </h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm sm:text-base">
              {college.overview || 'No overview provided for this institute.'}
            </p>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Institute Type</div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white mt-1 capitalize">
                  {college.type.toLowerCase()}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Established Year</div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                  {college.establishedYear || 'N/A'}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Campus Location</div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                  {college.city}, {college.state}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Student Rating</div>
                <div className="text-sm font-semibold text-amber-500 mt-1 flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-500" />
                  <span>{college.rating.toFixed(1)} / 5.0</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Highest Package</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                    {latestPlacement ? formatLPA(latestPlacement.highestPackage) : 'N/A'}
                  </div>
                </div>
              </div>
              <div className="text-xs text-slate-500 mt-3">
                Average benchmark: {latestPlacement ? formatLPA(latestPlacement.avgPackage) : 'N/A'}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Undergraduate Programs</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                    {college.courses.length} Departments
                  </div>
                </div>
              </div>
              <div className="text-xs text-slate-500 mt-3">
                Total seats offered: {college.courses.reduce((acc, c) => acc + c.seats, 0)}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Top Recruiters</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                    {latestPlacement?.topRecruiters.length || 0} Listed
                  </div>
                </div>
              </div>
              <div className="text-xs text-slate-500 mt-3 truncate">
                {latestPlacement?.topRecruiters.slice(0, 3).join(', ') || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COURSES & FEES */}
      {activeTab === 'courses' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Academic Programs</h3>
              <p className="text-xs text-slate-500 mt-0.5">Annual tuition and seat capacity across branches</p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
              {college.courses.length} Offered
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {college.courses.map((course) => (
              <div
                key={course.id}
                className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div>
                  <h4 className="text-base font-semibold text-slate-900 dark:text-white">{course.name}</h4>
                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {course.durationYears} Years Duration
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {course.seats} Seats
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Fee per Year</div>
                  <div className="text-base font-bold text-brand-600 dark:text-brand-400">
                    {formatCurrency(course.feePerYear)}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Approx 4-Yr: {formatCurrency(course.feePerYear * course.durationYears)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PLACEMENTS */}
      {activeTab === 'placements' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {college.placements.map((placement) => (
              <div
                key={placement.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold text-sm">
                      Batch of {placement.year}
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                      <div className="text-xs text-slate-500">Average CTC</div>
                      <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {formatLPA(placement.avgPackage)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                        <div className="text-[11px] text-slate-500">Median CTC</div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                          {formatLPA(placement.medianPackage)}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                        <div className="text-[11px] text-slate-500">Highest CTC</div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                          {formatLPA(placement.highestPackage)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {placement.topRecruiters.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-xs font-medium text-slate-500 mb-2">Key Recruiters</div>
                    <div className="flex flex-wrap gap-1.5">
                      {placement.topRecruiters.map((r, i) => (
                        <span
                          key={i}
                          className="text-xs px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CUTOFFS */}
      {activeTab === 'cutoffs' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-sm">
          {/* Header & Filter Controls */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Admission Cutoff Ranks</h3>
              <p className="text-xs text-slate-500 mt-0.5">Closing ranks from the latest counseling rounds</p>
            </div>

            {/* Filter chips */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Exam filter */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setSelectedExam('ALL')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    selectedExam === 'ALL' ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  All Exams
                </button>
                {exams.map((exam) => (
                  <button
                    key={exam}
                    onClick={() => setSelectedExam(exam)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      selectedExam === exam ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    {exam.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* Category filter */}
              {categories.length > 1 && (
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
                  <button
                    onClick={() => setSelectedCategory('ALL')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      selectedCategory === 'ALL' ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                        selectedCategory === cat ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cutoffs Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-6">Branch / Program</th>
                  <th className="py-3.5 px-6">Entrance Exam</th>
                  <th className="py-3.5 px-6">Category</th>
                  <th className="py-3.5 px-6 text-right">Closing Rank</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCutoffs.map((cutoff) => (
                  <tr key={cutoff.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-6 font-medium text-slate-900 dark:text-white">
                      {cutoff.course.name}
                    </td>
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300">
                        {cutoff.examName.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {cutoff.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-brand-600 dark:text-brand-400">
                      #{cutoff.cutoffRank.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCutoffs.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-sm">
              No cutoffs match the selected filters.
            </div>
          )}
        </div>
      )}

      {/* TAB 5: REVIEWS */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="text-4xl font-extrabold text-slate-900 dark:text-white">
                {college.rating.toFixed(1)}
              </div>
              <div>
                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.round(college.rating) ? 'fill-amber-500 text-amber-500' : 'text-slate-300 dark:text-slate-700'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Based on {college.reviews.length} student reviews
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-700">
              Reviews are verified and submitted by students/alumni.
            </div>
          </div>

          {/* Reviews list */}
          <div className="space-y-4">
            {college.reviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-slate-900 dark:text-white text-sm">
                    {rev.user?.name || 'Verified Student'}
                  </div>
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    <span className="text-xs font-bold">{rev.rating}.0</span>
                  </div>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  "{rev.comment}"
                </p>

                <div className="mt-3 text-[11px] text-slate-400">
                  Reviewed on {new Date(rev.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            ))}

            {college.reviews.length === 0 && (
              <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 text-sm">
                No reviews recorded yet for this institute.
              </div>
            )}
          </div>
        </div>
      )}
      {activeTab === 'comments' && (
        <CommentSection collegeId={college.id} collegeSlug={college.slug} isLoggedIn={isLoggedIn} />
      )}
    </div>
  );
}