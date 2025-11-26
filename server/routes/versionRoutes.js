import express from 'express';
import {
  getVersions,
  getVersionContent,
  createVersion,
  revertToVersion
} from '../controllers/versionController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.route('/')
  .get(getVersions)
  .post(createVersion);

router.get('/:versionNumber', getVersionContent);
router.put('/:versionNumber/revert', revertToVersion);

export default router;
