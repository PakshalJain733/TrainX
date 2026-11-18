CREATE DEFINER=`tpo`@`%` TRIGGER `set_createdAt_before_insert_hackathon` BEFORE INSERT ON `hackathons` FOR EACH ROW BEGIN
    
        SET NEW.created_at = NOW();
        SET NEW.updated_at = NOW();

END


CREATE DEFINER=`tpo`@`%` TRIGGER `set_createdAt_before_insert_intershipPost` BEFORE INSERT ON `intership_postings` FOR EACH ROW BEGIN
        SET NEW.createdAt = NOW();
        SET NEW.updatedAt = NOW();
END

CREATE DEFINER=`tpo`@`%` TRIGGER `set_createdAt_before_insert_jobPost` BEFORE INSERT ON `job_postings` FOR EACH ROW BEGIN

        SET NEW.createdAt = NOW();
        SET NEW.updatedAt = NOW();

END
