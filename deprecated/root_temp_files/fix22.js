const fs = require('fs');
let lines = fs.readFileSync('erp/pricing3.js', 'utf8').split('\\n');

let changes = 0;
for (let i = 0; i < lines.length - 1; i++) {
  // If line matches exact '  }' or '  }\\r'
  if (lines[i].trim() === '}') {
    // Look ahead to next non-empty line
    let nextNonEmpty = -1;
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].trim() !== '') {
        nextNonEmpty = j;
        break;
      }
    }
    
    if (nextNonEmpty > -1) {
      // If the next non-empty line looks like a method declaration (e.g. '  renderNewHeader() {')
      if (/^\\s*[a-zA-Z0-9_]+\\(.*?\\)\\s*\\{/.test(lines[nextNonEmpty])) {
        // Change the '}' to '},'
        lines[i] = lines[i].replace('}', '},');
        changes++;
      }
    }
  }
}

fs.writeFileSync('erp/pricing3.js', lines.join('\\n'), 'utf8');
console.log('Made ' + changes + ' comma fixes.');
