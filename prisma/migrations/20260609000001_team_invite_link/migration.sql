-- Make email optional and add isLink flag for shareable invite links
ALTER TABLE "team_invites" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "team_invites" ADD COLUMN "isLink" BOOLEAN NOT NULL DEFAULT false;
