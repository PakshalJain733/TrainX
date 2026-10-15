import { Router } from 'express';
import {
  getFeatureSwitches,
  toggleFeatureSwitch,
  toggleEmergencyMode,
  restoreAllFeatureSwitches,
  updateFeatureNotice,
} from '../controllers/featureSwitch.controller.js';

const router = Router();

// GET all feature switches directly from database
router.get('/', getFeatureSwitches);

// PUT toggle single feature switch (ON: true / 1, OFF: false / 0)
router.put('/toggle', toggleFeatureSwitch);
router.post('/toggle', toggleFeatureSwitch);

// PUT toggle global emergency mode
router.put('/emergency', toggleEmergencyMode);
router.post('/emergency', toggleEmergencyMode);

// PUT restore all features ON (true / 1)
router.put('/restore-all', restoreAllFeatureSwitches);
router.post('/restore-all', restoreAllFeatureSwitches);

// PUT update custom notice message
router.put('/notice', updateFeatureNotice);
router.post('/notice', updateFeatureNotice);

export default router;
