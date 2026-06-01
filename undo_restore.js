const fs = require('fs');
const restoreCode = fs.readFileSync('restore.js', 'utf8');
const deletedCodeMatch = restoreCode.match(/const deletedCode = `([\s\S]*?)`;\n\nconst insertedPattern/);
const insertedPatternMatch = restoreCode.match(/const insertedPattern = `([\s\S]*?)`;\n\nconst repIdx/);

if (deletedCodeMatch && insertedPatternMatch) {
    const deletedCode = deletedCodeMatch[1];
    const insertedPattern = insertedPatternMatch[1];

    let content = fs.readFileSync('erp/erp_app.js', 'utf8');
    content = content.replace(deletedCode, insertedPattern);
    fs.writeFileSync('erp/erp_app.js', content);
    console.log('Undone restore.js');
} else {
    console.log('Could not parse restore.js');
}
