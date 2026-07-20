-- CMS / compliance alignment:
-- 1) Rename use-case-specific tables/cols to neutral names
-- 2) Strengthen tag master / FK indexes

ALTER TABLE "user_account" RENAME COLUMN "looking_for_work" TO "is_available";

ALTER TABLE "profile_talent" RENAME TO "profile_member";
ALTER INDEX "profile_talent_pkey" RENAME TO "profile_member_pkey";
ALTER INDEX "profile_talent_user_id_key" RENAME TO "profile_member_user_id_key";
ALTER TABLE "profile_member" RENAME CONSTRAINT "profile_talent_user_id_fkey" TO "profile_member_user_id_fkey";

ALTER TABLE "talent_rating" RENAME TO "user_rating";
ALTER INDEX "talent_rating_pkey" RENAME TO "user_rating_pkey";
ALTER INDEX "talent_rating_rated_for_user_id_idx" RENAME TO "user_rating_rated_for_user_id_idx";
ALTER INDEX "talent_rating_rated_for_user_id_rated_by_user_id_key" RENAME TO "user_rating_rated_for_user_id_rated_by_user_id_key";
ALTER TABLE "user_rating" RENAME CONSTRAINT "talent_rating_rated_for_user_id_fkey" TO "user_rating_rated_for_user_id_fkey";
ALTER TABLE "user_rating" RENAME CONSTRAINT "talent_rating_rated_by_user_id_fkey" TO "user_rating_rated_by_user_id_fkey";

DROP INDEX IF EXISTS "user_rating_rated_for_user_id_idx";
CREATE INDEX "user_rating_rated_for_user_id_is_active_idx" ON "user_rating"("rated_for_user_id", "is_active");

CREATE INDEX "tag_master_published_is_active_idx" ON "tag_master"("published", "is_active");
CREATE INDEX "tag_master_is_active_idx" ON "tag_master"("is_active");
CREATE INDEX "profile_tag_link_tag_id_is_active_idx" ON "profile_tag_link"("tag_id", "is_active");

DROP INDEX IF EXISTS "job_tag_link_job_id_link_type_idx";
CREATE INDEX "job_tag_link_job_id_link_type_is_active_idx" ON "job_tag_link"("job_id", "link_type", "is_active");
CREATE INDEX "job_tag_link_tag_id_is_active_idx" ON "job_tag_link"("tag_id", "is_active");
