#!/usr/bin/env node

/**
 * TransactLab Payment Gateway Simulation
 * Entry Point
 */

// Load environment variables from .env file if it exists
import dotenv from 'dotenv';
dotenv.config();

import './server';

// This file serves as the main entry point for the application
// The actual server startup logic is in server.ts 