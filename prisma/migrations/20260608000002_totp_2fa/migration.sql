-- AlterTable: add TOTP 2FA columns to users
ALTER TABLE "users"
  ADD COLUMN "totpEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "totpSecret" TEXT,
  ADD COLUMN "totpBackupCodes" TEXT[] NOT NULL DEFAULT '{}';
