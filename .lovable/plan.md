## Що робимо

Додаємо можливість адміну задавати власні **SEO title** і **description** для будь-якої сторінки сайту. Якщо для сторінки нічого не задано — використовуються поточні дефолтні значення (як зараз).

## База даних

Нова таблиця `seo_overrides`:
- `path` (text, unique) — шлях сторінки, напр. `/`, `/category/run`, `/clubs`, `/event/<slug>`, `/club/<slug>`
- `title` (text, nullable)
- `description` (text, nullable)
- `updated_by`, `created_at`, `updated_at`

RLS:
- SELECT — публічний (потрібно для відображення при завантаженні сторінки).
- INSERT/UPDATE/DELETE — лише адміни (`has_role(auth.uid(),'admin')`).

## Frontend

1. **Хук `useSeoOverride(path)`** — підтягує запис з `seo_overrides` за нормалізованим шляхом і повертає `{ title?, description? }`.

2. **Розширення `SEO` компонента** (`src/components/SEO.tsx`):
   - Новий prop `path?: string` (за замовчуванням `location.pathname`).
   - Перед рендером підмінює дефолтний `title`/`description` на overrides, якщо вони існують.
   - Так усі існуючі сторінки автоматично отримають підтримку без змін у кожному файлі.

3. **Адмін-кнопка SEO**:
   - Маленький плаваючий компонент `<AdminSeoEditor />`, який монтується глобально (через `App.tsx`) і показується **тільки для адміна**.
   - Кнопка в кутку: «SEO». При натисканні — діалог з полями Title (60), Description (160), плейсхолдерами поточних дефолтів і кнопками «Зберегти» / «Скинути до шаблону».
   - Зберігає за `location.pathname`.

4. **Нова адмін-сторінка `/admin/seo`** (опціонально, в межах цього кроку):
   - Список усіх overrides з пошуком, можливістю редагувати/видаляти.
   - Посилання додається в адмін-меню.

## Поведінка

- Якщо override відсутній → працюють поточні `buildEventSeo`, `categorySeo`, статичні значення в сторінках. Нічого не зламається.
- Якщо є override → підставляється замість дефолту (title обрізається до 60, description до 160 — як зараз).

## Файли, що зміняться

- `supabase/migrations/...` — нова таблиця + RLS.
- `src/components/SEO.tsx` — підтримка overrides.
- `src/components/AdminSeoEditor.tsx` — нова, плаваюча кнопка + діалог (адмін only).
- `src/App.tsx` — монтування `AdminSeoEditor`.
- `src/pages/AdminSeo.tsx` + маршрут у `App.tsx` + пункт у меню адміна — список усіх overrides.

Підтверджуєте — і виконую.