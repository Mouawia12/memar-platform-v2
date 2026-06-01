const fs = require('fs');
let text = fs.readFileSync('erp/erp_app.js', 'utf8');

const regex = /projs = projs\.filter\(p => p\.status === this\.filters\.status\);/;
const goodChunk = `projs = projs.filter(p => {
        const s = p.status || 'active';
        if (this.filters.status === 'active') return s === 'active' || s === 'جاري';
        if (this.filters.status === 'review') return s === 'review' || s === 'pending' || s === 'مراجعة';
        if (this.filters.status === 'on_hold') return s === 'on_hold' || s === 'انتظار';
        if (this.filters.status === 'completed') return s === 'completed' || s === 'مكتمل';
        return s === this.filters.status;
      });`;

text = text.replace(regex, goodChunk);

fs.writeFileSync('erp/erp_app.js', text, 'utf8');
console.log('Status filter improved');
