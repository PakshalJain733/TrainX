CREATE TABLE IF NOT EXISTS machinetest_io (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  practical_id INT NOT NULL,
  input TEXT,
  output TEXT,
  ishidden TINYINT(1) DEFAULT 0,
  INDEX idx_practical (practical_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
