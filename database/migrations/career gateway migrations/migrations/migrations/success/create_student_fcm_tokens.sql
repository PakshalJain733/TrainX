-- Map each browser FCM token to the authenticated student that registered it.
-- Targeted job/internship pushes resolve eligible tokens from this table instead
-- of broadcasting to a global topic.
CREATE TABLE IF NOT EXISTS student_fcm_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  token VARCHAR(500) NOT NULL,
  device_info VARCHAR(255) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_student_fcm_tokens_token (token),
  KEY idx_student_fcm_tokens_student_id (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
