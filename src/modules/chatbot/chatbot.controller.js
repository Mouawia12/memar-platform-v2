'use strict';

const logger = require('../../config/logger');

const SYSTEM_PROMPT_TEMPLATE = `أنت موظف مبيعات وخدمة عملاء محترف وخبير تعمل في "مجموعة معمار للاستشارات الهندسية" في الكويت (تأسست عام 2007).
خدماتنا الرئيسية: تصميم معماري وإنشائي، استخراج تراخيص البناء، إشراف هندسي ميداني.

أسلوبك:
- مختصر جداً ومباشر.
- احترافي، ودود ومقنع.
- استخدم لهجة كويتية مهنية أو عربية فصحى مبسطة مطعمة بكلمات ترحيبية كويتية (مثل: هلا بك، حياك الله).
- مهمتك هي مساعدة العميل بناءً على المعلومات المرفقة فقط. لا تخترع أرقاماً أو تفاصيل غير موجودة.

قواعد مهمة جداً (Actions):
- إذا استفسر العميل عن تسعير مشروع أو كم التكلفة وكان واضحاً أنه يريد حسبة، أضف في نهاية ردك بالضبط: [ACTION:PRICING]
- إذا رغب العميل في حجز استشارة أو تحديد موعد لزيارة المكتب، أضف في نهاية ردك بالضبط: [ACTION:MEETING]

المعلومات المدربة (Knowledge Base):\n`;

exports.handleChat = async (req, res, next) => {
  try {
    const { message, kbContext, history } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      logger.warn('OpenAI API Key is missing. Falling back to simple default response.');
      return res.json({ 
          success: true, 
          reply: "عذراً، نظام الذكاء الاصطناعي قيد الإعداد حالياً (مفتاح OpenAI غير متوفر). هل يمكنني مساعدتك في شيء آخر؟"
      });
    }

    // Prepare messages array for OpenAI
    const messages = [];

    // 1. System Prompt + Training Context
    const systemPrompt = SYSTEM_PROMPT_TEMPLATE + (kbContext || 'لا توجد معلومات تدريبية إضافية.');
    messages.push({ role: 'system', content: systemPrompt });

    // 2. Chat History
    if (Array.isArray(history)) {
        history.forEach(h => {
            if (h.role && h.content) {
                // Ensure only 'user' and 'assistant' roles are passed
                const role = h.role === 'user' ? 'user' : 'assistant';
                messages.push({ role, content: h.content });
            }
        });
    }

    // 3. Current User Message
    messages.push({ role: 'user', content: message });

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: messages,
            temperature: 0.5,
            max_tokens: 300
        })
    });

    if (!response.ok) {
        const errorData = await response.text();
        logger.error('OpenAI API Error:', errorData);
        throw new Error('Failed to fetch from OpenAI');
    }

    const data = await response.json();
    const replyText = data.choices[0].message.content;

    return res.json({ success: true, reply: replyText });

  } catch (err) {
    logger.error('Chatbot Chat Error:', err);
    return res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
};
