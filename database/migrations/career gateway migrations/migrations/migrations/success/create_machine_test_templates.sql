-- LeetCode-style templates: one functionSignature per (practical, language)
CREATE TABLE IF NOT EXISTS machine_test_templates (
  id INT NOT NULL AUTO_INCREMENT,
  practical_id INT NOT NULL,
  programming_language_id INT NOT NULL,
  function_signature TEXT NOT NULL,
  function_name VARCHAR(128) NOT NULL,
  param_names JSON NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_prac_lang (practical_id, programming_language_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
