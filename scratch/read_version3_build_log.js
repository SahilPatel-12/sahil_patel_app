const fs = require('fs');
const path = require('path');

const logFile = '/Users/sahilpatel/.gemini/antigravity-ide/brain/0fbd1159-6825-4e5d-b62f-c81345eb1e39/.system_generated/logs/transcript.jsonl';

if (fs.existsSync(logFile)) {
  const content = fs.readFileSync(logFile, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line) => {
    if (!line.trim()) return;
    try {
      const obj = JSON.parse(line);
      // Look for tool_calls running commands or actual execution result of commands
      if (obj.tool_calls) {
        obj.tool_calls.forEach(tc => {
          if (tc.name === 'run_command') {
            console.log(`COMMAND RUN: ${tc.arguments.CommandLine}`);
          }
        });
      }
      if (obj.type === 'RUN_COMMAND' || obj.type === 'run_command') {
         console.log(`COMMAND RESULT: ${obj.content ? obj.content.substring(0, 500) : ''}`);
      }
    } catch (e) {
      // Ignore
    }
  });
} else {
  console.log('Log file not found at:', logFile);
}
