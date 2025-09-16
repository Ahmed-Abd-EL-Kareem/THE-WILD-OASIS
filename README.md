### The Wild Oasis — React Admin Dashboard (EN)

The Wild Oasis is a hotel management dashboard built with React and Vite. It helps staff manage cabins, bookings, guests, and check-in/out workflows, featuring analytics, filtering/sorting, and role-based access via Supabase.

---

### Features

- **Authentication**: Email/password and update profile; session-based auth via Supabase
- **Bookings**: List, create, edit, delete, and view booking details
- **Check-in / Check-out**: Guided flows with UI validation
- **Cabins**: CRUD for cabin inventory with images and pricing
- **Guests**: Manage guests and look up stays
- **Dashboard**: KPIs and charts (sales, stay durations)
- **Settings**: Configure app/global settings
- **UI/UX**: Responsive layout, dark mode, toasts, modals, and pagination

---

### Tech Stack

- **React 19**, **Vite 7**
- **React Router 7** for routing
- **@tanstack/react-query 5** for server state and caching
- **Supabase** for auth and database
- **styled-components 6** for styling
- **recharts 3** for charts
- **date-fns 4** for date utilities
- **react-hook-form 7** for forms
- **react-hot-toast** and **react-icons** for UI enhancements

---

### Getting Started

1. Ensure Node.js 18+ is installed.
2. Install dependencies:

```bash
npm install
```

3. Start the dev server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
```

5. Preview the production build:

```bash
npm run preview
```

---

### Environment & Supabase

By default, `src/services/supabase.js` creates a client using constants in the file. For better security, move these to environment variables and import them instead:

```js
// src/services/supabase.js (suggested)
import { createClient } from "@supabase/supabase-js";
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export default createClient(supabaseUrl, supabaseKey);
```

Then create a `.env` file at the project root:

```bash
VITE_SUPABASE_URL=YOUR_PROJECT_URL
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Note: Restart the dev server after adding/changing env vars.

---

### Available Scripts

- `npm run dev`: Start Vite dev server
- `npm run build`: Create production build
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint

---

### Project Structure (high level)

```
src/
  features/            # domain features: bookings, cabins, auth, check-in/out, dashboard
  services/            # API clients (Supabase, bookings, cabins, users, settings)
  ui/                  # shared UI components
  pages/               # route pages
  styles/              # global styles
  utils/               # helpers and constants
```

---

### Notes

- For production, ensure environment variables are used for Supabase configuration and that keys are not committed.
- Linting is configured via `eslint.config.js`.

---

### الواحة البرية — لوحة تحكم الإدارة (AR)

مشروع "الواحة البرية" هو لوحة تحكم لإدارة فندق مبنية باستخدام React وVite. تساعد فريق العمل على إدارة الكبائن والحجوزات والضيوف وإجراءات الدخول والخروج، مع تحليلات وعرض إحصائي وتصنيفات وفلاتر ودخول مُؤمَّن عبر Supabase.

---

### المزايا

- **تسجيل الدخول**: بريد/كلمة مرور وتحديث الملف الشخصي؛ جلسات آمنة عبر Supabase
- **الحجوزات**: عرض، إنشاء، تعديل، حذف، وتفاصيل كل حجز
- **الدخول/الخروج**: خطوات إرشادية مع تحقق من صحة المدخلات
- **الكبائن**: إدارة كاملة للكبائن بالصور والتسعير
- **الضيوف**: إدارة بيانات الضيوف والبحث عن الإقامات
- **لوحة المعلومات**: مؤشرات أداء ورسوم بيانية (المبيعات، مدد الإقامة)
- **الإعدادات**: تخصيص إعدادات التطبيق العامة
- **الواجهة**: تصميم متجاوب، الوضع الداكن، إشعارات، حوارات، وتقسيم الصفحات

---

### التقنيات المستخدمة

- React 19، Vite 7
- React Router 7 للتوجيه
- React Query (TanStack v5) لإدارة الحالة من الخادم
- Supabase للمصادقة وقاعدة البيانات
- styled-components للتنسيق
- recharts للرسوم البيانية
- date-fns لمعالجة التواريخ
- react-hook-form للنماذج
- react-hot-toast و react-icons لتحسين الواجهة

---

### البدء السريع

1. تأكد من وجود Node.js 18 أو أحدث.
2. تثبيت الحِزم:

```bash
npm install
```

3. تشغيل بيئة التطوير:

```bash
npm run dev
```

4. إنشاء نسخة الإنتاج:

```bash
npm run build
```

5. معاينة نسخة الإنتاج:

```bash
npm run preview
```

---

### البيئة وSupabase

افتراضياً يتم تهيئة Supabase داخل الملف `src/services/supabase.js`. يُفضَّل نقل القيم إلى متغيرات بيئية لحماية المفاتيح:

```bash
VITE_SUPABASE_URL=رابط_مشروعك
VITE_SUPABASE_ANON_KEY=المفتاح_العام
```

ثم استخدام هذه المتغيرات في الكود كما في المثال ضمن القسم الإنجليزي.

---

### الأوامر المتاحة

- `npm run dev`: تشغيل الخادم التطويري
- `npm run build`: بناء نسخة الإنتاج
- `npm run preview`: معاينة نسخة الإنتاج
- `npm run lint`: تشغيل ESLint

---

### ملاحظات

- في بيئة الإنتاج، استخدم متغيرات البيئة لإعداد Supabase وتجنب رفع المفاتيح للمستودع.
- تم إعداد أدوات الفحص البرمجي عبر `eslint.config.js`.
