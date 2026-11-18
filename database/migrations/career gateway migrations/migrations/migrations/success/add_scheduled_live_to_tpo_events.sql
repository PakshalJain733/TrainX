ALTER TABLE `tpo_events`
  ADD COLUMN `isLive` tinyint(1) DEFAULT '1' AFTER `eventDeadline`,
  ADD COLUMN `liveAt` datetime DEFAULT NULL AFTER `isLive`;

UPDATE `tpo_events` SET `isLive` = 1 WHERE `isLive` IS NULL;
