const fs = require('fs');

let content = fs.readFileSync('website/memar_login.html', 'utf8');

// 1. Update closeOrGoHome
const closeStr = `    if (mode === 'pricing_discuss') {
      window.parent.postMessage('close_pricing_discuss', '*');
      return;
    }`;
const closeReplaceStr = `    if (mode === 'pricing_discuss') {
      window.parent.postMessage('close_pricing_discuss', '*');
      return;
    }
    if (mode === 'chatbot_booking') {
      window.parent.postMessage('close_chatbot_booking', '*');
      return;
    }`;
if (content.includes(closeStr)) {
    content = content.replace(closeStr, closeReplaceStr);
}

// 2. Update showSuccess
const successStr = `  const isPricingDiscussMode = new URLSearchParams(window.location.search).get('mode') === 'pricing_discuss';
  if (isPricingDiscussMode) {
    setTimeout(() => window.parent.postMessage('pricing_discuss_success', '*'), 400);
    return;
  }`;
const successReplaceStr = `  const isPricingDiscussMode = new URLSearchParams(window.location.search).get('mode') === 'pricing_discuss';
  if (isPricingDiscussMode) {
    setTimeout(() => window.parent.postMessage('pricing_discuss_success', '*'), 400);
    return;
  }
  
  const isChatbotBookingMode = new URLSearchParams(window.location.search).get('mode') === 'chatbot_booking';
  if (isChatbotBookingMode) {
    setTimeout(() => window.parent.postMessage('chatbot_booking_success', '*'), 400);
    return;
  }`;
if (content.includes(successStr)) {
    content = content.replace(successStr, successReplaceStr);
}

fs.writeFileSync('website/memar_login.html', content);
console.log('Login HTML updated');
