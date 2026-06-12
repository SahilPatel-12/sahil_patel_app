const fs = require('fs');
const path = require('path');

const brainDir = '/Users/sahilpatel/.gemini/antigravity-ide/brain';

async function search() {
  try {
    if (!fs.existsSync(brainDir)) {
      console.log('Brain directory does not exist.');
      return;
    }

    const conversations = fs.readdirSync(brainDir);
    console.log(`Found ${conversations.length} conversation folders.`);

    for (const conv of conversations) {
      const logFile = path.join(brainDir, conv, '.system_generated', 'logs', 'transcript.jsonl');
      if (fs.existsSync(logFile)) {
        console.log(`Searching log file: ${logFile}...`);
        const content = fs.readFileSync(logFile, 'utf8');
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('bc.mantrapuja.com') || line.includes('34.126.219.127')) {
            console.log(`Match in ${conv} line ${idx + 1}:`);
            console.log(line.substring(0, 500));
            console.log('-'.repeat(30));
          }
        });
      }
    }
  } catch (err) {
    console.error(err);
  }
}

search();
