const fs = require('fs');
const path = require('path');

const brainDir = '/Users/sahilpatel/.gemini/antigravity-ide/brain';

if (fs.existsSync(brainDir)) {
  const folders = fs.readdirSync(brainDir);
  folders.forEach(conv => {
    const logFile = path.join(brainDir, conv, '.system_generated', 'logs', 'transcript.jsonl');
    if (fs.existsSync(logFile)) {
      const content = fs.readFileSync(logFile, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line) => {
        if (!line.trim()) return;
        try {
          const obj = JSON.parse(line);
          if (obj.tool_calls) {
            obj.tool_calls.forEach(tc => {
              if (tc.name === 'write_to_file' || tc.name === 'replace_file_content') {
                if (tc.arguments.TargetFile && tc.arguments.TargetFile.includes('build.gradle')) {
                  console.log(`Match in ${conv}: ${tc.name} on ${tc.arguments.TargetFile}`);
                }
              }
            });
          }
        } catch (e) {
          // Ignore
        }
      });
    }
  });
} else {
  console.log('Brain folder not found.');
}
