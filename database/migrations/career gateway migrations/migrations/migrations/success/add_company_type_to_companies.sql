-- Company Type (IT / Non IT) for Company Master job and internship companies
ALTER TABLE companies
  ADD COLUMN company_type VARCHAR(32) NULL COMMENT 'IT or Non IT';

ALTER TABLE intershiip_companies
  ADD COLUMN company_type VARCHAR(32) NULL COMMENT 'IT or Non IT';
