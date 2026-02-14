#!/usr/bin/env node
/**
 * Run ngrok with NGROK_AUTHTOKEN from .env.local and host-header for Next.js.
 * Usage: node scripts/ngrok.js  (or: npm run ngrok)
 */
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  });
}

const domain = process.env.NGROK_DOMAIN;
const args = ['--yes', 'ngrok', 'http', '3001'];
if (domain) args.push('--domain', domain);
args.push('--host-header=localhost:3001');

const child = spawn('npx', args, { stdio: 'inherit', env: process.env, shell: true });
child.on('exit', (code) => process.exit(code ?? 0));
