const fs = require('fs');

let content = fs.readFileSync('src/app.js', 'utf8');

if (!content.includes('chatbotRoutes')) {
    content = content.replace(
        "const auditRoutes         = require('./modules/audit/audit.routes');",
        "const auditRoutes         = require('./modules/audit/audit.routes');\nconst chatbotRoutes       = require('./modules/chatbot/chatbot.routes');"
    );

    content = content.replace(
        "app.use(`${API}/audit`,         auditRoutes);",
        "app.use(`${API}/audit`,         auditRoutes);\napp.use(`${API}/chatbot`,       chatbotRoutes);"
    );

    fs.writeFileSync('src/app.js', content);
    console.log('App.js updated');
} else {
    console.log('Already updated');
}
