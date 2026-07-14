const fs = require('fs');

// We simulate enough of the DOM and window to run erp_app.js
const { JSDOM } = require('jsdom');
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<body>
  <div id="p-hr"></div>
</body>
</html>
`);

global.window = dom.window;
global.document = dom.window.document;
global.localStorage = { getItem: ()=>null, setItem: ()=>null, removeItem: ()=>null };

// Read erp_app.js
let code = fs.readFileSync('./erp/erp_app.js', 'utf8');

// Append a test execution
code += `
try {
  console.log("Running HR.render()...");
  HR.render();
  console.log("Success! pg.innerHTML length:", document.getElementById('p-hr').innerHTML.length);
} catch (e) {
  console.error("ERROR IN HR.render():", e.message, e.stack);
}
`;

try {
  eval(code);
} catch (e) {
  console.error("ERROR EVALUATING erp_app.js:", e.message);
}
