-- Replace legacy event type "Seminar" with "Seminar/Webinar". Run once against your DB.
UPDATE tpo_events SET eventType = 'Seminar/Webinar' WHERE eventType = 'Seminar';
