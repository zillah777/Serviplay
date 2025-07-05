import express from 'express';
import { IdentityController } from '../controllers/identityController';
import { authenticateToken } from '../middleware/auth';
import { createRateLimiter } from '../middleware/rateLimiter';

const router = express.Router();

/**
 * @route POST /api/identity/submit-documents
 * @desc Submit identity verification documents
 * @access Private (Authenticated users)
 * @body {
 *   document_type: string,
 *   document_front_file_id: string,
 *   document_back_file_id?: string,
 *   notes?: string
 * }
 */
router.post(
  '/submit-documents',
  createRateLimiter({ maxRequests: 5, windowMs: 60 * 1000 }), // 5 requests per minute
  authenticateToken,
  IdentityController.submitDocuments
);

/**
 * @route GET /api/identity/status
 * @desc Get user's identity verification status
 * @access Private (Authenticated users)
 */
router.get(
  '/status',
  authenticateToken,
  IdentityController.getVerificationStatus
);

/**
 * @route PUT /api/identity/update-status
 * @desc Update verification status (Admin only)
 * @access Private (Admin only)
 * @body {
 *   user_id: string,
 *   status: 'approved' | 'rejected' | 'pending',
 *   notes?: string,
 *   rejection_reason?: string
 * }
 */
router.put(
  '/update-status',
  createRateLimiter({ maxRequests: 10, windowMs: 60 * 1000 }), // 10 requests per minute for admins
  authenticateToken,
  IdentityController.updateVerificationStatus
);

/**
 * @route GET /api/identity/pending
 * @desc Get pending identity verifications for admin review
 * @access Private (Admin only)
 */
router.get(
  '/pending',
  authenticateToken,
  IdentityController.getPendingVerifications
);

export { router as identityRoutes };