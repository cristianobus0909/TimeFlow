import express, { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';
import {
  createCheckoutSession,
  createPortalSession,
  handleWebhook,
} from '../controllers/billingController';

const router = Router();

// Webhook must receive raw body, so we apply express.raw parser here
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Protected billing routes
router.post('/checkout', authenticateToken as any, createCheckoutSession as any);
router.post('/portal', authenticateToken as any, createPortalSession as any);

export default router;
