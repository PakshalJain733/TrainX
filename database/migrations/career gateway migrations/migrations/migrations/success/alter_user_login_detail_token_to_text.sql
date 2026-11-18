-- Migration: Alter user_login_detail.token to TEXT
-- Prevents ER_DATA_TOO_LONG when JWT tokens include permission claims or roles (e.g., student_coordinator)

-- Drop indexes if present (tolerated by migrator if they don't exist)
ALTER TABLE user_login_detail DROP INDEX idx_token;
ALTER TABLE user_login_detail DROP INDEX token;

-- Modify column to TEXT
ALTER TABLE user_login_detail MODIFY COLUMN token TEXT NOT NULL;

-- Re-create prefix index for efficient lookup
ALTER TABLE user_login_detail ADD INDEX idx_token (token(191));

