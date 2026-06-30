const fs = require('fs');
const path = require('path');

// 1. Parse .env.local
const envPath = '/Applications/sahil_MP_app/APP/mantrapuja/.env.local';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value;
  }
});

// Set env variables so notificationDispatcher.js reads them
for (const k in env) {
  process.env[k] = env[k];
}

const { checkAndDispatchNotifications } = require('../services/notificationDispatcher');

async function main() {
  console.log('Running dispatcher checks...');
  await checkAndDispatchNotifications();
  console.log('Dispatcher check finished.');
}

main();
