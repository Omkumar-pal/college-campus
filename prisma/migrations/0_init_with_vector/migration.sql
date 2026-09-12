CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "CollegeType" AS ENUM ('GOVERNMENT', 'PRIVATE', 'DEEMED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "colleges" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "type" "CollegeType" NOT NULL,
    "established_year" INTEGER,
    "fees_min" INTEGER NOT NULL,
    "fees_max" INTEGER NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "logo_url" TEXT,
    "overview" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "colleges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "college_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "duration_years" INTEGER NOT NULL,
    "fee_per_year" INTEGER NOT NULL,
    "seats" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placements" (
    "id" TEXT NOT NULL,
    "college_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "avg_package" INTEGER NOT NULL,
    "median_package" INTEGER,
    "highest_package" INTEGER,
    "top_recruiters" TEXT[],

    CONSTRAINT "placements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "college_id" TEXT NOT NULL,
    "user_id" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_colleges" (
    "user_id" TEXT NOT NULL,
    "college_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_colleges_pkey" PRIMARY KEY ("user_id","college_id")
);

-- CreateTable
CREATE TABLE "saved_comparisons" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_comparisons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_comparison_colleges" (
    "comparison_id" TEXT NOT NULL,
    "college_id" TEXT NOT NULL,

    CONSTRAINT "saved_comparison_colleges_pkey" PRIMARY KEY ("comparison_id","college_id")
);

-- CreateTable
CREATE TABLE "cutoff_data" (
    "id" TEXT NOT NULL,
    "exam_name" TEXT NOT NULL,
    "college_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "cutoff_rank" INTEGER NOT NULL,

    CONSTRAINT "cutoff_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "college_id" TEXT NOT NULL,
    "user_id" TEXT,
    "parent_id" TEXT,
    "content" TEXT NOT NULL,
    "embedding" vector(768),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "colleges_slug_key" ON "colleges"("slug");

-- CreateIndex
CREATE INDEX "colleges_city_idx" ON "colleges"("city");

-- CreateIndex
CREATE INDEX "colleges_state_idx" ON "colleges"("state");

-- CreateIndex
CREATE INDEX "colleges_rating_idx" ON "colleges"("rating");

-- CreateIndex
CREATE INDEX "colleges_fees_min_fees_max_idx" ON "colleges"("fees_min", "fees_max");

-- CreateIndex
CREATE INDEX "colleges_rating_name_id_idx" ON "colleges"("rating", "name", "id");

-- CreateIndex
CREATE INDEX "colleges_fees_min_fees_max_id_idx" ON "colleges"("fees_min", "fees_max", "id");

-- CreateIndex
CREATE INDEX "courses_college_id_idx" ON "courses"("college_id");

-- CreateIndex
CREATE INDEX "placements_college_id_idx" ON "placements"("college_id");

-- CreateIndex
CREATE INDEX "placements_year_idx" ON "placements"("year");

-- CreateIndex
CREATE INDEX "reviews_college_id_idx" ON "reviews"("college_id");

-- CreateIndex
CREATE INDEX "reviews_user_id_idx" ON "reviews"("user_id");

-- CreateIndex
CREATE INDEX "saved_colleges_user_id_created_at_idx" ON "saved_colleges"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "saved_comparisons_user_id_idx" ON "saved_comparisons"("user_id");

-- CreateIndex
CREATE INDEX "saved_comparisons_user_id_created_at_idx" ON "saved_comparisons"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "cutoff_data_exam_name_category_cutoff_rank_idx" ON "cutoff_data"("exam_name", "category", "cutoff_rank");

-- CreateIndex
CREATE INDEX "cutoff_data_college_id_idx" ON "cutoff_data"("college_id");

-- CreateIndex
CREATE INDEX "cutoff_data_course_id_idx" ON "cutoff_data"("course_id");

-- CreateIndex
CREATE UNIQUE INDEX "cutoff_data_exam_name_course_id_category_key" ON "cutoff_data"("exam_name", "course_id", "category");

-- CreateIndex
CREATE INDEX "comments_college_id_idx" ON "comments"("college_id");

-- CreateIndex
CREATE INDEX "comments_parent_id_idx" ON "comments"("parent_id");

-- CreateIndex
CREATE INDEX "comments_user_id_idx" ON "comments"("user_id");

-- CreateIndex
CREATE INDEX "comments_college_id_parent_id_created_at_idx" ON "comments"("college_id", "parent_id", "created_at");

-- CreateIndex
CREATE INDEX "comments_college_id_created_at_idx" ON "comments"("college_id", "created_at");

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placements" ADD CONSTRAINT "placements_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_colleges" ADD CONSTRAINT "saved_colleges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_colleges" ADD CONSTRAINT "saved_colleges_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_comparisons" ADD CONSTRAINT "saved_comparisons_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_comparison_colleges" ADD CONSTRAINT "saved_comparison_colleges_comparison_id_fkey" FOREIGN KEY ("comparison_id") REFERENCES "saved_comparisons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_comparison_colleges" ADD CONSTRAINT "saved_comparison_colleges_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cutoff_data" ADD CONSTRAINT "cutoff_data_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cutoff_data" ADD CONSTRAINT "cutoff_data_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

