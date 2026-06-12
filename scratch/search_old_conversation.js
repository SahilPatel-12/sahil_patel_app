const fs = require('fs');
const path = require('path');

const logFile = '/Users/sahilpatel/.gemini/antigravity-ide/brain/0afe1d11-e5c6-4b03-a5d6-c471ba71e3de/.system_generated/logs/transcript.jsonl';

if (fs.existsSync(logFile)) {
  const content = fs.readFileSync(logFile, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line) => {
    if (!line.trim()) return;
    const obj = JSON.parse(line);
    if (obj.type === 'USER_INPUT') {
      console.log(`[USER]: ${obj.content}`);
      console.log('='.repeat(40));
    }
  });
} else {
  console.log('Log file not found at:', logFile);
}
