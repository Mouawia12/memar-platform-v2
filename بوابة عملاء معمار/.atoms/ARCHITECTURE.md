---
last_updated: 2026-08-07T13:58:43Z
---

# Architecture Design

## System Overview
نظام ERP متكامل لمجموعة معمار للاستشارات الهندسية يتكون من:
1. **لوحة تحكم المسؤول (Admin ERP)** — واجهة شاملة لإدارة المشاريع والعملاء والموظفين والمالية
2. **بوابة الموظف (Employee Portal)** — واجهة مستقلة للموظفين لإدارة مهامهم وحضورهم وإجازاتهم

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | HTML5 + CSS3 + Vanilla JS |
| Build Tool | Vite 6.x (Multi-page) |
| Fonts | Cairo (Google Fonts) |
| Design | RTL Arabic, Glassmorphism, Responsive |
| Package Manager | pnpm |

## Module Design
| Module | Responsibility | Key Files |
|--------|---------------|-----------|
| Admin ERP | لوحة تحكم شاملة (CRM, Projects, HR, Finance, DMS, etc.) | index.html, style.css, script.js |
| Employee Portal | بوابة الموظف (Dashboard, Tasks, Attendance, Salary, Chat, Referral) | employee-portal.html, employee-portal.css, employee-portal.js |
| Build Config | إعداد Vite لدعم multi-page | vite.config.js |

## Tech Decisions
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Multi-page setup | Vite rollupOptions.input | دعم ملفات HTML متعددة مستقلة |
| Module scripts | type="module" + window export | توافق مع Vite bundling مع الحفاظ على onclick handlers |
| Standalone portal | ملف HTML منفصل | فصل تجربة الموظف عن لوحة المسؤول |
| RTL Arabic | dir="rtl" + Cairo font | دعم كامل للغة العربية |

## File Tree Plan
```
app/frontend/
├── index.html              # Admin ERP Dashboard
├── style.css               # Admin ERP Styles
├── script.js               # Admin ERP Logic
├── employee-portal.html    # Employee Portal (standalone)
├── employee-portal.css     # Employee Portal Styles
├── employee-portal.js      # Employee Portal Logic
├── vite.config.js          # Multi-page Vite config
├── package.json            # Dependencies
└── .mgx/config.yaml        # Preview config
```

## Implementation Guide
- بوابة الموظف صفحة مستقلة تماماً عن Admin ERP
- التنقل بين الأقسام يتم عبر `switchPage()` التي تخفي/تظهر divs
- Toast notifications عبر `showToast(message, type)`
- Sidebar responsive مع toggle للموبايل
- جميع الدوال مصدّرة إلى `window` للتوافق مع onclick attributes

