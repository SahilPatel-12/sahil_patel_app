const fs = require('fs');
const path = require('path');

const logPath = '/Users/sahilpatel/.gemini/antigravity-ide/brain/f1f16cf3-f9c8-4b85-9554-42a7ee8e00bf/.system_generated/tasks/task-999.log';
if (fs.existsSync(logPath)) {
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');
  console.log('Total lines in log:', lines.length);
  console.log('Last 200 lines:');
  console.log(lines.slice(-200).join('\n'));
} else {
  console.log('Log file not found.');
}
