import cors from 'cors';
import { ENV } from './environment';

export const corsOptions: cors.CorsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = ENV.CORS_ORIGINS;

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key',
    'X-Client-Version',
    'X-Owner-Id',
    'X-Team-Id',
    'x-owner-id',
    'x-team-id',
    'x-sandbox-secret'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count', 'x-owner-id', 'x-team-id'],
  maxAge: 86400 // 24 hours
}; 