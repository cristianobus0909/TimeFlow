import express, { Router } from 'express';
import { authenticateToken } from '@core/middleware/auth.middleware';
import {
  createCheckoutSession,
  createPortalSession,
  handleWebhook,
  createMercadoPagoCheckout,
  handleMercadoPagoWebhook,
  createMobbexCheckout,
  handleMobbexWebhook,
} from './billing.controller';

const router = Router();

// --- PUBLIC WEBHOOKS (No auth required) ---
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);
router.post('/mercadopago/webhook', handleMercadoPagoWebhook as any);
router.post('/mobbex/webhook', handleMobbexWebhook as any);

// --- PROTECTED ROUTES (Require login token) ---
router.post('/checkout', authenticateToken as any, createCheckoutSession as any);
router.post('/portal', authenticateToken as any, createPortalSession as any);
router.post('/mercadopago/checkout', authenticateToken as any, createMercadoPagoCheckout as any);
router.post('/mobbex/checkout', authenticateToken as any, createMobbexCheckout as any);

export default router;
