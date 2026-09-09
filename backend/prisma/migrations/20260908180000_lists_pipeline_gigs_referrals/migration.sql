-- People lists, ATS statuses, gig reviews, referrals

CREATE TYPE "JobApplicationStatus" AS ENUM (
  'APPLIED', 'SHORTLIST', 'WAITLIST', 'INTERVIEWED', 'SELECTED', 'HIRED',
  'NO_SHOW', 'NOT_INTERESTED', 'REJECTED'
);
CREATE TYPE "GigReviewerRole" AS ENUM ('EMPLOYER_RATES_TALENT', 'TALENT_RATES_EMPLOYER');

ALTER TABLE "user_account"
  ADD COLUMN IF NOT EXISTS "referred_by_user_id" TEXT;

ALTER TABLE "user_account"
  ADD CONSTRAINT "user_account_referred_by_user_id_fkey"
  FOREIGN KEY ("referred_by_user_id") REFERENCES "user_account"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "job_application"
  ADD COLUMN IF NOT EXISTS "status" "JobApplicationStatus" NOT NULL DEFAULT 'APPLIED',
  ADD COLUMN IF NOT EXISTS "job_completed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "completed_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "job_application_applicant_user_id_is_active_status_idx"
  ON "job_application"("applicant_user_id", "is_active", "status");

CREATE TABLE "job_gig_review" (
  "id" TEXT NOT NULL,
  "job_id" TEXT NOT NULL,
  "application_id" TEXT NOT NULL,
  "rated_for_user_id" TEXT NOT NULL,
  "rated_by_user_id" TEXT NOT NULL,
  "reviewer_role" "GigReviewerRole" NOT NULL,
  "rating_value" INTEGER NOT NULL,
  "comments" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_update_at" TIMESTAMP(3) NOT NULL,
  "last_update_ip" TEXT NOT NULL DEFAULT '0.0.0.0',
  "last_update_by" TEXT NOT NULL DEFAULT 'system',
  CONSTRAINT "job_gig_review_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "job_gig_review_application_id_reviewer_role_key"
  ON "job_gig_review"("application_id", "reviewer_role");
CREATE INDEX "job_gig_review_rated_for_user_id_is_active_idx"
  ON "job_gig_review"("rated_for_user_id", "is_active");

ALTER TABLE "job_gig_review"
  ADD CONSTRAINT "job_gig_review_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job_posting"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "job_gig_review_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "job_application"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "job_gig_review_rated_for_user_id_fkey" FOREIGN KEY ("rated_for_user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "job_gig_review_rated_by_user_id_fkey" FOREIGN KEY ("rated_by_user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "people_list" (
  "id" TEXT NOT NULL,
  "owner_user_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_update_at" TIMESTAMP(3) NOT NULL,
  "last_update_ip" TEXT NOT NULL DEFAULT '0.0.0.0',
  "last_update_by" TEXT NOT NULL DEFAULT 'system',
  CONSTRAINT "people_list_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "people_list_owner_user_id_is_active_idx" ON "people_list"("owner_user_id", "is_active");
ALTER TABLE "people_list"
  ADD CONSTRAINT "people_list_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "people_list_member" (
  "id" TEXT NOT NULL,
  "list_id" TEXT NOT NULL,
  "member_user_id" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_update_at" TIMESTAMP(3) NOT NULL,
  "last_update_ip" TEXT NOT NULL DEFAULT '0.0.0.0',
  "last_update_by" TEXT NOT NULL DEFAULT 'system',
  CONSTRAINT "people_list_member_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "people_list_member_list_id_member_user_id_key"
  ON "people_list_member"("list_id", "member_user_id");
CREATE INDEX "people_list_member_member_user_id_is_active_idx"
  ON "people_list_member"("member_user_id", "is_active");

ALTER TABLE "people_list_member"
  ADD CONSTRAINT "people_list_member_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "people_list"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "people_list_member_member_user_id_fkey" FOREIGN KEY ("member_user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
