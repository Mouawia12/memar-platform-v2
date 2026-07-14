const {JSDOM} = require('jsdom');
const dom = new JSDOM('<button onclick="console.log(typeof UserLogs)" id="btn"></button><script>const UserLogs = {};</script>', {runScripts: 'dangerously'});
dom.window.document.getElementById('btn').click();
