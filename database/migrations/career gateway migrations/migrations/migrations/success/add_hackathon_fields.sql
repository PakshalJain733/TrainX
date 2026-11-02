-- Hackathon: organized_by, gender, poster columns
ALTER TABLE hackathons
  ADD COLUMN organized_by VARCHAR(255) NULL AFTER title,
  ADD COLUMN gender VARCHAR(50) NOT NULL DEFAULT 'All' AFTER external_link,
  ADD COLUMN poster_name VARCHAR(255) NULL,
  ADD COLUMN poster_path VARCHAR(500) NULL;
