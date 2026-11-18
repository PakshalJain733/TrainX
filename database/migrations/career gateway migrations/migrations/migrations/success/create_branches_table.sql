-- Create branches table
CREATE TABLE IF NOT EXISTS branches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fullBranchName VARCHAR(255) NOT NULL,
  shortBranchName VARCHAR(10) NOT NULL UNIQUE,
  description TEXT,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_shortBranchName (shortBranchName),
  INDEX idx_isActive (isActive),
  INDEX idx_fullBranchName (fullBranchName)
);

-- Insert some default branches
INSERT INTO branches (fullBranchName, shortBranchName, description, isActive) VALUES
('Computer Science', 'CS', 'Computer Science and Engineering', TRUE),
('Information Technology', 'IT', 'Information Technology', TRUE),
('Electronics and Communication', 'EC', 'Electronics and Communication Engineering', TRUE),
('Mechanical Engineering', 'ME', 'Mechanical Engineering', TRUE),
('Civil Engineering', 'CE', 'Civil Engineering', TRUE),
('Electrical Engineering', 'EE', 'Electrical Engineering', TRUE)
ON DUPLICATE KEY UPDATE fullBranchName = VALUES(fullBranchName), description = VALUES(description);
