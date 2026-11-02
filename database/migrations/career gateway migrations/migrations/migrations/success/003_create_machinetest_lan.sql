CREATE TABLE IF NOT EXISTS machinetest_lan (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  practical_id INT NOT NULL,
  programming_language_id INT NOT NULL,
  INDEX idx_practical (practical_id),
  INDEX idx_lang (programming_language_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
