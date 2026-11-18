-- Align tpo_events with the canonical structure (tpoStructure.sql — single
-- source of truth). The live table was missing columns the dump defines:
--   isOnline, eventLink, attendanceReport, signedLOA
-- Columns/position/type/defaults match tpoStructure.sql exactly
-- (event creation was failing with "Unknown column 'isOnline' in 'field list'").

ALTER TABLE `tpo_events`
  ADD COLUMN `isOnline` tinyint(1) DEFAULT '0' AFTER `cost`,
  ADD COLUMN `eventLink` varchar(255) DEFAULT NULL AFTER `isOnline`,
  ADD COLUMN `attendanceReport` text AFTER `photosUploaded`,
  ADD COLUMN `signedLOA` text AFTER `attendanceReport`;