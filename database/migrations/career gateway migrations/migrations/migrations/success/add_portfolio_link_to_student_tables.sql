-- Add portfolio_link to student_details and temp_students_details
ALTER TABLE student_details ADD COLUMN portfolio_link VARCHAR(255);
ALTER TABLE temp_students_details ADD COLUMN portfolio_link VARCHAR(255);
