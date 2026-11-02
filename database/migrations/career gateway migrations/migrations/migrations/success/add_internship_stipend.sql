-- Paid internships can record a monthly stipend (free text, e.g. "15,000/month").
-- Only meaningful when internship_type = 'Paid'; Unpaid rows stay NULL.
ALTER TABLE internship_tracking
  ADD COLUMN stipend_per_month VARCHAR(100) NULL AFTER internship_type;
