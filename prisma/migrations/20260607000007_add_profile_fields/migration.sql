-- AddColumn User.profileSlug / profilePublic / profileSettings
ALTER TABLE "users" ADD COLUMN "profileSlug"     TEXT;
ALTER TABLE "users" ADD COLUMN "profilePublic"   BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN "profileSettings" JSONB;

CREATE UNIQUE INDEX "users_profileSlug_key" ON "users"("profileSlug");
