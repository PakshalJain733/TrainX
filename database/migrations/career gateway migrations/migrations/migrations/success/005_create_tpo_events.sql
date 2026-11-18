CREATE TABLE IF NOT EXISTS tpo_events (
  eventId INT AUTO_INCREMENT PRIMARY KEY,
  eventName VARCHAR(255),
  eventDescription VARCHAR(255),
  nameOfSpeaker VARCHAR(255),
  organizationOfSpeaker VARCHAR(255),
  locationOfSpeaker VARCHAR(255),
  date DATE,
  category VARCHAR(255),
  time TIME,
  department VARCHAR(255),
  eligible_degree_year VARCHAR(255),
  batch VARCHAR(25) DEFAULT NULL,
  isPaid BOOL DEFAULT NULL,
  cost INT DEFAULT NULL,
  paymentQR TEXT,
  banner TEXT,
  loaOfSpeaker TEXT,
  notice TEXT,
  eventDeadline DATETIME DEFAULT '3000-01-01',
  attendanceFlag BOOL DEFAULT FALSE,
  photosUploaded BOOL DEFAULT FALSE,
  isDeleted BOOL DEFAULT FALSE,
  isDead BOOL DEFAULT FALSE,
  eventPhotos TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tpo_event_registrations (
  reg_id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT,
  event_id INT,
  isApproved BOOLEAN DEFAULT FALSE,
  transaction_id VARCHAR(255) DEFAULT NULL,
  attended BOOLEAN DEFAULT FALSE,
  timeOfAttendance DATETIME DEFAULT NULL,
  INDEX idx_student (student_id),
  INDEX idx_event (event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
