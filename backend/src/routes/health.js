/**
 * Health check route
 * Simple endpoint to verify the API is running
 */

import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    requestId: req.id,
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

export { router as default, router as healthRouter };
