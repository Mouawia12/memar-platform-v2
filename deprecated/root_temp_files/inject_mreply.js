const fs = require('fs');

let content = fs.readFileSync('shared/memar_chatbot.js', 'utf8');

const targetStr = `function mReply(msg) {
  const type = mDetect(msg);
  mTyping();
  setTimeout(() => {
    mHT();
    if(type === 'pricing') {
      mOpenPricing();
    } else if(type === 'meeting') {
      mCheckBooking();
    } else {
      const currentKB = getMemarKB();
      let resp = currentKB[type] || currentKB.default;
      if (type === 'default' && msg.length > 5) {
        let unanswered = [];
        try { unanswered = JSON.parse(localStorage.getItem('memar_chatbot_unanswered') || '[]'); } catch(e){}
        unanswered.push({ text: msg, date: new Date().toISOString(), status: 'pending' });
        localStorage.setItem('memar_chatbot_unanswered', JSON.stringify(unanswered));
        
        const custom = JSON.parse(localStorage.getItem('memar_chatbot_qa')||'{}');
        const customKeys = Object.keys(custom).filter(k=>k!=='default').map(k=>k.split(',')[0].trim()).slice(0, 3);
        const qrs = [...(currentKB.default.qr || []), ...customKeys];
        
        resp = { text: currentKB.default.text + '\\n\\n(لقد قمت بإرسال استفسارك للإدارة للرد عليه قريباً)', qr: qrs };
      }
      mBot(resp.text, resp.extra, resp.qr, resp.cta);
    }
  }, 800 + Math.random() * 500);
}`;

const replaceStr = `async function mReply(msg) {
  mTyping();
  
  try {
    const currentKB = getMemarKB();
    
    // Fallback simple detection to skip API if exact command matched
    const type = mDetect(msg);
    if(type === 'pricing') {
       mHT(); mOpenPricing(); return;
    } else if(type === 'meeting') {
       mHT(); if(typeof mCheckBooking === 'function') mCheckBooking(); return;
    }
    
    // Construct Knowledge Base Text (Subset to save tokens)
    let kbText = "";
    const kbKeys = Object.keys(currentKB).filter(k => k !== 'default');
    
    // Optimization: find top matching keys based on words, else send all (since it's small)
    kbKeys.forEach(key => {
        kbText += \`Topic/Keywords: \${key}\\nAnswer: \${currentKB[key].text}\\n\\n\`;
    });
    
    // Get History
    const u = JSON.parse(localStorage.getItem('memar_user') || 'null');
    const histKey = 'memar_chat_history_' + (u ? (u.phone || 'def') : 'def');
    let hist = [];
    try { hist = JSON.parse(localStorage.getItem(histKey) || '[]'); } catch(e){}
    const formattedHist = hist.slice(-10).map(h => ({ 
        role: h.type === 'bot' ? 'assistant' : 'user', 
        content: h.html.replace(/<[^>]*>?/gm, '') 
    }));
    
    const response = await fetch('/api/v1/chatbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           message: msg,
           kbContext: kbText,
           history: formattedHist
        })
    });
    
    mHT();
    if(response.ok) {
        const data = await response.json();
        let replyText = data.reply || '';
        
        // Handle Action Triggers
        if (replyText.includes('[ACTION:PRICING]')) {
            replyText = replyText.replace(/\\[ACTION:PRICING\\]/g, '').trim();
            if(replyText) mBot(replyText);
            mOpenPricing();
            return;
        }
        if (replyText.includes('[ACTION:MEETING]')) {
            replyText = replyText.replace(/\\[ACTION:MEETING\\]/g, '').trim();
            if(replyText) mBot(replyText);
            if(typeof mCheckBooking === 'function') mCheckBooking();
            return;
        }
        
        // Log unanswered if AI couldn't find an answer and acts confused
        if (replyText.includes('لا أعرف') || replyText.includes('ليس لدي معلومات')) {
            let unanswered = [];
            try { unanswered = JSON.parse(localStorage.getItem('memar_chatbot_unanswered') || '[]'); } catch(e){}
            unanswered.push({ text: msg, date: new Date().toISOString(), status: 'pending' });
            localStorage.setItem('memar_chatbot_unanswered', JSON.stringify(unanswered));
        }

        mBot(replyText);
    } else {
        mBot("عذراً، نظام الذكاء الاصطناعي قيد الإعداد حالياً. يرجى الاتصال بنا عبر الهاتف.");
    }
  } catch(err) {
    console.error("OpenAI Chatbot Error:", err);
    mHT();
    mBot("عذراً، واجهت مشكلة في الاتصال بالخادم. حاول مجدداً.");
  }
}`;

content = content.replace(targetStr, replaceStr);

fs.writeFileSync('shared/memar_chatbot.js', content);
console.log('Done mReply replacement');
