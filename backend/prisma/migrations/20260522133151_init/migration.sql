-- CreateEnum
CREATE TYPE "MediaAssetType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "AlbumVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "TagLinkType" AS ENUM ('PRIMARY', 'SECONDARY');

-- CreateEnum
CREATE TYPE "PurchaseType" AS ENUM ('PAID', 'FREE', 'COMPENSATORY');

-- CreateEnum
CREATE TYPE "FlagReason" AS ENUM ('FINANCIAL_SCAM', 'OBSCENE', 'CHILD_ABUSE', 'PORNOGRAPHY');

-- CreateEnum
CREATE TYPE "FlagStatus" AS ENUM ('OPEN', 'REVIEWING', 'ACTIONED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('WARN', 'SUSPEND', 'DEACTIVATE', 'BAN', 'NOTE');

-- CreateTable
CREATE TABLE "group_master" (
    "id" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_update_at" TIMESTAMP(3) NOT NULL,
    "last_update_ip" TEXT NOT NULL DEFAULT '0.0.0.0',
    "last_update_by" TEXT NOT NULL DEFAULT 'system',

    CONSTRAINT "group_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_account" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "mobile_number" TEXT,
    "password_hash" TEXT,
    "full_name" TEXT NOT NULL,
    "age" INTEGER,
    "gender" TEXT,
    "height_cm" DECIMAL(5,2),
    "weight_kg" DECIMAL(5,2),
    "city" TEXT,
    "country" TEXT,
    "instagram_url" TEXT,
    "snapchat_url" TEXT,
    "youtube_url" TEXT,
    "tiktok_url" TEXT,
    "website_url" TEXT,
    "facebook_url" TEXT,
    "mini_bio" VARCHAR(600),
    "looking_for_work" BOOLEAN NOT NULL DEFAULT true,
    "rating_average" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "login_enabled" BOOLEAN NOT NULL DEFAULT true,
    "login_reset_date" TIMESTAMP(3),
    "login_attempts" INTEGER NOT NULL DEFAULT 0,
    "last_failed_login" TIMESTAMP(3),
    "spl_user" BOOLEAN NOT NULL DEFAULT false,
    "smm_user" BOOLEAN NOT NULL DEFAULT false,
    "default_org_type_id" INTEGER,
    "profile_photo_asset_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_update_at" TIMESTAMP(3) NOT NULL,
    "last_update_ip" TEXT NOT NULL DEFAULT '0.0.0.0',
    "last_update_by" TEXT NOT NULL DEFAULT 'system',

    CONSTRAINT "user_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_role_link" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "group_id" INTEGER NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_update_at" TIMESTAMP(3) NOT NULL,
    "last_update_ip" TEXT NOT NULL DEFAULT '0.0.0.0',
    "last_update_by" TEXT NOT NULL DEFAULT 'system',

    CONSTRAINT "user_role_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_status_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "old_is_active" BOOLEAN NOT NULL,
    "new_is_active" BOOLEAN NOT NULL,
    "reason" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_update_at" TIMESTAMP(3) NOT NULL,
    "last_update_ip" TEXT NOT NULL DEFAULT '0.0.0.0',
    "last_update_by" TEXT NOT NULL DEFAULT 'system',

    CONSTRAINT "user_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_type_master" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_update_at" TIMESTAMP(3) NOT NULL,
    "last_update_ip" TEXT NOT NULL DEFAULT '0.0.0.0',
    "last_update_by" TEXT NOT NULL DEFAULT 'system',

    CONSTRAINT "org_type_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_talent" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "intro_headline" TEXT,
    "show_in_search" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_update_at" TIMESTAMP(3) NOT NULL,
    "last_update_ip" TEXT NOT NULL DEFAULT '0.0.0.0',
    "last_update_by" TEXT NOT NULL DEFAULT 'system',

    CONSTRAINT "profile_talent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_org" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "org_type_id" INTEGER NOT NULL,
    "legal_name" TEXT NOT NULL,
    "address_line" TEXT,
    "tax_id" TEXT,
    "contact_name" TEXT,
    "contact_position" TEXT,
    "contact_number" TEXT,
    "contact_email" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_update_at" TIMESTAMP(3) NOT NULL,
    "last_update_ip" TEXT NOT NULL DEFAULT '0.0.0.0',
    "last_update_by" TEXT NOT NULL DEFAULT 'system',

    CONSTRAINT "profile_org_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag_master" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_update_at" TIMESTAMP(3) NOT NULL,
    "last_update_ip" TEXT NOT NULL DEFAULT '0.0.0.0',
    "last_update_by" TEXT NOT NULL DEFAULT 'system',

    CONSTRAINT "tag_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_tag_link" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "link_type" "TagLinkType" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_update_at" TIMESTAMP(3) NOT NULL,
    "last_update_ip" TEXT NOT NULL DEFAULT '0.0.0.0',
    "last_update_by" TEXT NOT NULL DEFAULT 'system',

    CONSTRAINT "profile_tag_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_album" (
    "id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "visibility" "AlbumVisibility" NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_update_at" TIMESTAMP(3) NOT NULL,
    "last_update_ip" TEXT NOT NULL DEFAULT '0.0.0.0',
    "last_update_by" TEXT NOT NULL DEFAULT 'system',

    CONSTRAINT "media_album_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_asset" (
    "id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "album_id" TEXT,
    "asset_type" "MediaAssetType" NOT NULL,
    "object_key" TEXT NOT NULL,
    "mime_type" TEXT,
    "size_bytes" INTEGER,
    "duration_seconds" INTEGER,
    "is_profile_photo" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_update_at" TIMESTAMP(3) NOT NULL,
    "last_update_ip" TEXT NOT NULL DEFAULT '0.0.0.0',
    "last_update_by" TEXT NOT NULL DEFAULT 'system',

    CONSTRAINT "media_asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "album_access_grant" (
    "id" TEXT NOT NULL,
    "album_id" TEXT NOT NULL,
    "granted_to_user_id" TEXT NOT NULL,
    "granted_by_user_id" TEXT NOT NULL,
    "granted_days" INTEGER NOT NULL DEFAULT 30,
    "starts_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_update_at" TIMESTAMP(3) NOT NULL,
    "last_update_ip" TEXT NOT NULL DEFAULT '0.0.0.0',
    "last_update_by" TEXT NOT NULL DEFAULT 'system',

    CONSTRAINT "album_access_grant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plan_master" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "target_group_id" INTEGER,
    "monthly_price_inr" INTEGER NOT NULL,
    "validity_days" INTEGER NOT NULL DEFAULT 30,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "is_job_posting_plan" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_update_at" TIMESTAMP(3) NOT NULL,
    "last_update_ip" TEXT NOT NULL DEFAULT '0.0.0.0',
    "last_update_by" TEXT NOT NULL DEFAULT 'system',

    CONSTRAINT "subscription_plan_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_subscription" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "purchase_type" "PurchaseType" NOT NULL,
    "purchase_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "original_expiry" TIMESTAMP(3) NOT NULL,
    "last_expiry" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_update_at" TIMESTAMP(3) NOT NULL,
    "last_update_ip" TEXT NOT NULL DEFAULT '0.0.0.0',
    "last_update_by" TEXT NOT NULL DEFAULT 'system',

    CONSTRAINT "user_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_posting" (
    "id" TEXT NOT NULL,
    "posted_by_user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "mini_description" TEXT NOT NULL,
    "gender" TEXT,
    "age_range_min" INTEGER,
    "age_range_max" INTEGER,
    "city" TEXT,
    "country" TEXT,
    "pay_range_min" INTEGER,
    "pay_range_max" INTEGER,
    "valid_till" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_update_at" TIMESTAMP(3) NOT NULL,
    "last_update_ip" TEXT NOT NULL DEFAULT '0.0.0.0',
    "last_update_by" TEXT NOT NULL DEFAULT 'system',

    CONSTRAINT "job_posting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_tag_link" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "link_type" "TagLinkType" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_update_at" TIMESTAMP(3) NOT NULL,
    "last_update_ip" TEXT NOT NULL DEFAULT '0.0.0.0',
    "last_update_by" TEXT NOT NULL DEFAULT 'system',

    CONSTRAINT "job_tag_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_application" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "applicant_user_id" TEXT NOT NULL,
    "message" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_update_at" TIMESTAMP(3) NOT NULL,
    "last_update_ip" TEXT NOT NULL DEFAULT '0.0.0.0',
    "last_update_by" TEXT NOT NULL DEFAULT 'system',

    CONSTRAINT "job_application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "talent_rating" (
    "id" TEXT NOT NULL,
    "rated_for_user_id" TEXT NOT NULL,
    "rated_by_user_id" TEXT NOT NULL,
    "rating_value" INTEGER NOT NULL,
    "comments" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_update_at" TIMESTAMP(3) NOT NULL,
    "last_update_ip" TEXT NOT NULL DEFAULT '0.0.0.0',
    "last_update_by" TEXT NOT NULL DEFAULT 'system',

    CONSTRAINT "talent_rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_thread" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_update_at" TIMESTAMP(3) NOT NULL,
    "last_update_ip" TEXT NOT NULL DEFAULT '0.0.0.0',
    "last_update_by" TEXT NOT NULL DEFAULT 'system',

    CONSTRAINT "chat_thread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_thread_participant" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_update_at" TIMESTAMP(3) NOT NULL,
    "last_update_ip" TEXT NOT NULL DEFAULT '0.0.0.0',
    "last_update_by" TEXT NOT NULL DEFAULT 'system',

    CONSTRAINT "chat_thread_participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_message" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "sender_user_id" TEXT NOT NULL,
    "message_text" TEXT NOT NULL,
    "is_seen" BOOLEAN NOT NULL DEFAULT false,
    "seen_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_update_at" TIMESTAMP(3) NOT NULL,
    "last_update_ip" TEXT NOT NULL DEFAULT '0.0.0.0',
    "last_update_by" TEXT NOT NULL DEFAULT 'system',

    CONSTRAINT "chat_message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_read_state" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "last_read_message_id" TEXT,
    "last_read_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_update_at" TIMESTAMP(3) NOT NULL,
    "last_update_ip" TEXT NOT NULL DEFAULT '0.0.0.0',
    "last_update_by" TEXT NOT NULL DEFAULT 'system',

    CONSTRAINT "chat_read_state_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_block_list" (
    "id" TEXT NOT NULL,
    "blocked_by_user_id" TEXT NOT NULL,
    "blocked_user_id" TEXT NOT NULL,
    "reason" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_update_at" TIMESTAMP(3) NOT NULL,
    "last_update_ip" TEXT NOT NULL DEFAULT '0.0.0.0',
    "last_update_by" TEXT NOT NULL DEFAULT 'system',

    CONSTRAINT "chat_block_list_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_flag_report" (
    "id" TEXT NOT NULL,
    "reported_user_id" TEXT NOT NULL,
    "raised_by_user_id" TEXT NOT NULL,
    "reason" "FlagReason" NOT NULL,
    "details" TEXT,
    "status" "FlagStatus" NOT NULL DEFAULT 'OPEN',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_update_at" TIMESTAMP(3) NOT NULL,
    "last_update_ip" TEXT NOT NULL DEFAULT '0.0.0.0',
    "last_update_by" TEXT NOT NULL DEFAULT 'system',

    CONSTRAINT "profile_flag_report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_action_log" (
    "id" TEXT NOT NULL,
    "report_id" TEXT,
    "acted_on_user_id" TEXT NOT NULL,
    "acted_by_user_id" TEXT NOT NULL,
    "action_type" "ActionType" NOT NULL,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_update_at" TIMESTAMP(3) NOT NULL,
    "last_update_ip" TEXT NOT NULL DEFAULT '0.0.0.0',
    "last_update_by" TEXT NOT NULL DEFAULT 'system',

    CONSTRAINT "admin_action_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "help_feedback" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_resolved" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_update_at" TIMESTAMP(3) NOT NULL,
    "last_update_ip" TEXT NOT NULL DEFAULT '0.0.0.0',
    "last_update_by" TEXT NOT NULL DEFAULT 'system',

    CONSTRAINT "help_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clone_audit_admin" (
    "id" TEXT NOT NULL,
    "source_table" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "payload_json" JSONB NOT NULL,
    "triggered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_update_at" TIMESTAMP(3) NOT NULL,
    "last_update_ip" TEXT NOT NULL DEFAULT '0.0.0.0',
    "last_update_by" TEXT NOT NULL DEFAULT 'system',

    CONSTRAINT "clone_audit_admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clone_audit_purchase" (
    "id" TEXT NOT NULL,
    "source_table" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "purchase_ref" TEXT,
    "payload_json" JSONB NOT NULL,
    "triggered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_update_at" TIMESTAMP(3) NOT NULL,
    "last_update_ip" TEXT NOT NULL DEFAULT '0.0.0.0',
    "last_update_by" TEXT NOT NULL DEFAULT 'system',

    CONSTRAINT "clone_audit_purchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "group_master_code_key" ON "group_master"("code");

-- CreateIndex
CREATE UNIQUE INDEX "user_account_email_key" ON "user_account"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_account_mobile_number_key" ON "user_account"("mobile_number");

-- CreateIndex
CREATE INDEX "user_account_is_active_idx" ON "user_account"("is_active");

-- CreateIndex
CREATE INDEX "user_role_link_group_id_is_active_idx" ON "user_role_link"("group_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "user_role_link_user_id_group_id_key" ON "user_role_link"("user_id", "group_id");

-- CreateIndex
CREATE INDEX "user_status_history_user_id_changed_at_idx" ON "user_status_history"("user_id", "changed_at");

-- CreateIndex
CREATE UNIQUE INDEX "org_type_master_name_key" ON "org_type_master"("name");

-- CreateIndex
CREATE UNIQUE INDEX "profile_talent_user_id_key" ON "profile_talent"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "profile_org_user_id_key" ON "profile_org"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "tag_master_slug_key" ON "tag_master"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tag_master_title_key" ON "tag_master"("title");

-- CreateIndex
CREATE INDEX "profile_tag_link_user_id_link_type_is_active_idx" ON "profile_tag_link"("user_id", "link_type", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "profile_tag_link_user_id_tag_id_link_type_key" ON "profile_tag_link"("user_id", "tag_id", "link_type");

-- CreateIndex
CREATE INDEX "media_album_owner_user_id_visibility_idx" ON "media_album"("owner_user_id", "visibility");

-- CreateIndex
CREATE INDEX "media_asset_owner_user_id_asset_type_is_active_idx" ON "media_asset"("owner_user_id", "asset_type", "is_active");

-- CreateIndex
CREATE INDEX "album_access_grant_album_id_granted_to_user_id_is_active_idx" ON "album_access_grant"("album_id", "granted_to_user_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "album_access_grant_album_id_granted_to_user_id_key" ON "album_access_grant"("album_id", "granted_to_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plan_master_code_key" ON "subscription_plan_master"("code");

-- CreateIndex
CREATE INDEX "user_subscription_user_id_is_active_last_expiry_idx" ON "user_subscription"("user_id", "is_active", "last_expiry");

-- CreateIndex
CREATE INDEX "job_posting_city_country_is_active_idx" ON "job_posting"("city", "country", "is_active");

-- CreateIndex
CREATE INDEX "job_tag_link_job_id_link_type_idx" ON "job_tag_link"("job_id", "link_type");

-- CreateIndex
CREATE UNIQUE INDEX "job_tag_link_job_id_tag_id_link_type_key" ON "job_tag_link"("job_id", "tag_id", "link_type");

-- CreateIndex
CREATE INDEX "job_application_applicant_user_id_is_active_idx" ON "job_application"("applicant_user_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "job_application_job_id_applicant_user_id_key" ON "job_application"("job_id", "applicant_user_id");

-- CreateIndex
CREATE INDEX "talent_rating_rated_for_user_id_idx" ON "talent_rating"("rated_for_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "talent_rating_rated_for_user_id_rated_by_user_id_key" ON "talent_rating"("rated_for_user_id", "rated_by_user_id");

-- CreateIndex
CREATE INDEX "chat_thread_participant_user_id_is_active_idx" ON "chat_thread_participant"("user_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "chat_thread_participant_thread_id_user_id_key" ON "chat_thread_participant"("thread_id", "user_id");

-- CreateIndex
CREATE INDEX "chat_message_thread_id_created_at_idx" ON "chat_message"("thread_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "chat_read_state_thread_id_user_id_key" ON "chat_read_state"("thread_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "chat_block_list_blocked_by_user_id_blocked_user_id_key" ON "chat_block_list"("blocked_by_user_id", "blocked_user_id");

-- CreateIndex
CREATE INDEX "profile_flag_report_status_created_at_idx" ON "profile_flag_report"("status", "created_at");

-- CreateIndex
CREATE INDEX "admin_action_log_acted_on_user_id_created_at_idx" ON "admin_action_log"("acted_on_user_id", "created_at");

-- CreateIndex
CREATE INDEX "help_feedback_is_resolved_created_at_idx" ON "help_feedback"("is_resolved", "created_at");

-- CreateIndex
CREATE INDEX "clone_audit_admin_source_table_source_id_triggered_at_idx" ON "clone_audit_admin"("source_table", "source_id", "triggered_at");

-- CreateIndex
CREATE INDEX "clone_audit_purchase_source_table_source_id_triggered_at_idx" ON "clone_audit_purchase"("source_table", "source_id", "triggered_at");

-- AddForeignKey
ALTER TABLE "user_account" ADD CONSTRAINT "user_account_default_org_type_id_fkey" FOREIGN KEY ("default_org_type_id") REFERENCES "org_type_master"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_link" ADD CONSTRAINT "user_role_link_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_link" ADD CONSTRAINT "user_role_link_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "group_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_status_history" ADD CONSTRAINT "user_status_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_talent" ADD CONSTRAINT "profile_talent_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_org" ADD CONSTRAINT "profile_org_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_org" ADD CONSTRAINT "profile_org_org_type_id_fkey" FOREIGN KEY ("org_type_id") REFERENCES "org_type_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_tag_link" ADD CONSTRAINT "profile_tag_link_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_tag_link" ADD CONSTRAINT "profile_tag_link_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tag_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_album" ADD CONSTRAINT "media_album_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_asset" ADD CONSTRAINT "media_asset_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_asset" ADD CONSTRAINT "media_asset_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "media_album"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "album_access_grant" ADD CONSTRAINT "album_access_grant_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "media_album"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "album_access_grant" ADD CONSTRAINT "album_access_grant_granted_to_user_id_fkey" FOREIGN KEY ("granted_to_user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "album_access_grant" ADD CONSTRAINT "album_access_grant_granted_by_user_id_fkey" FOREIGN KEY ("granted_by_user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_subscription" ADD CONSTRAINT "user_subscription_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_subscription" ADD CONSTRAINT "user_subscription_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plan_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_posting" ADD CONSTRAINT "job_posting_posted_by_user_id_fkey" FOREIGN KEY ("posted_by_user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_tag_link" ADD CONSTRAINT "job_tag_link_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job_posting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_tag_link" ADD CONSTRAINT "job_tag_link_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tag_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_application" ADD CONSTRAINT "job_application_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job_posting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_application" ADD CONSTRAINT "job_application_applicant_user_id_fkey" FOREIGN KEY ("applicant_user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "talent_rating" ADD CONSTRAINT "talent_rating_rated_for_user_id_fkey" FOREIGN KEY ("rated_for_user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "talent_rating" ADD CONSTRAINT "talent_rating_rated_by_user_id_fkey" FOREIGN KEY ("rated_by_user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_thread_participant" ADD CONSTRAINT "chat_thread_participant_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "chat_thread"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_thread_participant" ADD CONSTRAINT "chat_thread_participant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "chat_thread"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_sender_user_id_fkey" FOREIGN KEY ("sender_user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_read_state" ADD CONSTRAINT "chat_read_state_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "chat_thread"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_read_state" ADD CONSTRAINT "chat_read_state_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_block_list" ADD CONSTRAINT "chat_block_list_blocked_by_user_id_fkey" FOREIGN KEY ("blocked_by_user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_block_list" ADD CONSTRAINT "chat_block_list_blocked_user_id_fkey" FOREIGN KEY ("blocked_user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_flag_report" ADD CONSTRAINT "profile_flag_report_reported_user_id_fkey" FOREIGN KEY ("reported_user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_flag_report" ADD CONSTRAINT "profile_flag_report_raised_by_user_id_fkey" FOREIGN KEY ("raised_by_user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_action_log" ADD CONSTRAINT "admin_action_log_acted_on_user_id_fkey" FOREIGN KEY ("acted_on_user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_action_log" ADD CONSTRAINT "admin_action_log_acted_by_user_id_fkey" FOREIGN KEY ("acted_by_user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "help_feedback" ADD CONSTRAINT "help_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
