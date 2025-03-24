// server/src/config/env.ts
// Contributor: @Fardeen Bablu
// time spent: 30 minutes

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env file
const envPath = path.resolve(process.cwd(), '.env');

// Check if .env file exists
if (fs.existsSync(envPath)) {
  console.log(`Loading environment from ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.warn(`.env file not found at ${envPath}. Using existing environment variables.`);
  dotenv.config(); // Load from process.env anyway
}

// Configuration object with defaults
export const config = {
  // Server config
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database config
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'dormdash_user',
    password: process.env.DB_PASSWORD || 'dormdash_VU',
    database: process.env.DB_NAME || 'dormdash',
  },
  
  // Auth config
  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiresIn: '7d',
  },
  
  // Google OAuth config
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  },
  
  // Firebase config
  firebase: {
    apiKey: process.env.FIREBASE_API_KEY || '',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.FIREBASE_APP_ID || '',
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || '',
  },
};

// Validate critical configuration
export function validateConfig() {
  const missingVars = [];
  
  if (!config.jwt.secret) missingVars.push('JWT_SECRET');
  if (!config.google.clientId) missingVars.push('GOOGLE_CLIENT_ID');
  
  if (missingVars.length > 0) {
    console.error(`Missing critical environment variables: ${missingVars.join(', ')}`);
    console.error('Please check your .env file or environment configuration.');
    
    // Return false to indicate validation failed
    return false;
  }
  
  console.log(`Environment configured successfully (${config.nodeEnv} mode)`);
  
  // Confirm JWT secret is loaded correctly (don't log the actual value)
  console.log(`JWT_SECRET: ${config.jwt.secret ? '[LOADED]' : '[MISSING]'}`);
  
  return true;
}

// Export default
export default config;