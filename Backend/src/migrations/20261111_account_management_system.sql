-- ============================================================================
-- Migration: 20261111_account_management_system.sql
-- Description: Enhances secure_codes and users tables for cryptographic code activation,
--              delivery tracking, two-stage approval, and forced password changes.
-- ============================================================================

-- 1. Extend `secure_codes` table to bind codes directly to emails, track delivery, and record invitations
ALTER TABLE `secure_codes`
  ADD COLUMN IF NOT EXISTS `email` VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `email_delivery_status` ENUM('pending', 'sent', 'failed', 'bounced') DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS `invitation_id` VARCHAR(100) DEFAULT NULL;

-- 2. Extend `users` table to track force_password_change, delivery status, activation status, and approval status
ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `force_password_change` TINYINT(1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `email_delivery_status` ENUM('pending', 'sent', 'failed', 'bounced') DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS `activation_status` ENUM('pending', 'completed') DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS `approval_status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending';

-- 3. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS `idx_secure_codes_email` ON `secure_codes` (`email`);
CREATE INDEX IF NOT EXISTS `idx_users_approval_status` ON `users` (`approval_status`);
CREATE INDEX IF NOT EXISTS `idx_users_force_pwd` ON `users` (`force_password_change`);

