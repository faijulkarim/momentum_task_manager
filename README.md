# Momentum — Task Manager

A modern, professional Task Manager built with **HTML5, CSS3, and Vanilla JavaScript** — no frameworks, no UI libraries, no build
step, and no backend. Fully responsive, accessible, and deploys as-is to
any static host.

**Developed & Customized by Md. Faijul Karim**

![Vanilla JS](https://img.shields.io/badge/JavaScript-Vanilla%20ES6-F7DF1E)
![No Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)
![Deploy Ready](https://img.shields.io/badge/deploy-static%20hosting-blue)

---

## ✨ Features

- **Task management** — add, edit, delete, mark complete, and undo (both
  completing and deleting a task can be undone from the toast notification)
- **Due date & time**, **priority** (High / Medium / Low), and **category**
  (Personal, Work, Study, Shopping, Health, Others) on every task
- **Search** tasks by title, with debounced input
- **Filter views** — All, Today, This Week, High Priority, Pending, Completed
- **Sort** — Newest, Oldest, Due Date, Priority
- **Category filtering**, independent of the view filter
- **Dark mode / light mode**, persisted and defaulting to the OS preference
- **Statistics panel** — total, completed, pending, completion percentage,
  and an animated progress bar
- **Delete confirmation modal** and **beautiful toast notifications**
  (built on the native `<dialog>` element)
- **Empty state illustration** and a **loading state** on first paint
- **Smooth CSS animations** throughout, with `prefers-reduced-motion` respected
- **Keyboard support** — <kbd>Enter</kbd> to add a task, checkboxes are
  fully operable via keyboard
- **Auto save** — every change is written to `localStorage` immediately;
  your list survives a refresh or closed tab
- **Fully responsive** — desktop, tablet, and mobile layouts, including an
  off-canvas sidebar drawer on smaller screens

---

## 📁 Project Structure

```
todo-app/
│
├── index.html              # Semantic markup, all views and modals
│
├── css/
│   ├── style.css            # Design tokens, layout, and component styles
│   ├── responsive.css        # Breakpoints (tablet / mobile / small phones / print)
│   └── animations.css        # All @keyframes and motion utility classes
│
├── js/
│   ├── storage.js            # localStorage read/write — the only file that touches it
│   ├── task.js                # Task model, validation, date helpers, DOM builder
│   ├── filter.js              # Search / filter / sort — pure functions, no DOM
│   ├── theme.js                # Dark/light theme, persisted + OS preference fallback
│   ├── ui.js                   # All DOM rendering, toasts, modals, sidebar
│   └── app.js                   # State + event wiring + init (loads last)
│
├── assets/
│   ├── icons/
│   │   └── favicon.svg          # Brand mark, used as the site favicon
│   └── images/
│       └── README.md             # Notes on adding custom illustrations later
│
└── README.md
```

### Load order matters

`index.html` loads the JS files in this exact order, each with `defer`:

```
storage.js → task.js → filter.js → theme.js → ui.js → app.js
```

Every file attaches itself to a single shared namespace, `window.App`
(e.g. `App.Storage`, `App.Task`, `App.Filter`, `App.Theme`, `App.UI`).
There's no bundler and no ES module `import`/`export` — this keeps the
project runnable by simply opening `index.html`, and avoids the
`file://` CORS restrictions that ES modules run into without a server.

---

## 🚀 Getting Started

No installation, no build step, no dependencies.

1. Download or clone the project.
2. Open `index.html` directly in a browser, **or** serve the folder with
   any static server for a nicer local URL:

   ```bash
   # Python
   python3 -m http.server 8000

   # Node (npx, no install)
   npx serve .
   ```
3. Visit `http://localhost:8000` (or whichever port your server prints).

Your tasks are stored in `localStorage` under the key `momentum_tasks_v1`,
and your theme preference under `momentum_theme_v1` — both scoped to
whichever origin you serve the app from.

---

## ☁️ Deployment

The project is static, so it deploys to any of the following **without
any modification**:

**GitHub Pages**
1. Push the repository to GitHub.
2. Repo → Settings → Pages → Deploy from branch → select `main` and `/root`.
3. Your app is live at `https://<username>.github.io/<repo>/`.

**Netlify**
1. Drag and drop the `todo-app` folder onto [app.netlify.com/drop](https://app.netlify.com/drop), **or**
2. Connect the Git repository — build command: *none*, publish directory: `/`.

**Vercel**
1. Import the Git repository at [vercel.com/new](https://vercel.com/new).
2. Framework preset: **Other**. Build command: *none*. Output directory: `/`.

---

## 🌐 Live Demo

- **Live Website:** https://momentumtaskmanager.vercel.app
- **GitHub Repository:** https://github.com/faijulakrim/momentum-task-manager

## 🎨 Customization

All colors, spacing, radii, shadows, and typography are CSS custom
properties defined once at the top of `css/style.css`:

```css
:root{
  --accent: #5B5FEF;
  --accent-gradient: linear-gradient(135deg, #6C5CE7 0%, #5B5FEF 55%, #4C46B8 100%);
  --radius-md: 14px;
  --font-display: 'Sora', 'Inter', system-ui, sans-serif;
  /* ...and more */
}

[data-theme="dark"]{
  --bg: #101119;
  /* dark-theme overrides */
}
```

Change a token once and it propagates everywhere it's used — priority
colors, category dots, buttons, badges, and both themes.

Category and priority labels live in `js/task.js` (`CATEGORY_LABELS`,
`PRIORITY_LABELS`) if you want to rename or add options — remember to
also update the `<option>` values in `index.html` and the
`badge--priority-*` / `dot--*` CSS classes to match.

---

## ♿ Accessibility

- Semantic landmarks (`header`, `aside`, `main`) and a skip-to-content link
- Every form input has an associated `<label>`
- Filters, categories, checkboxes, and the progress bar use appropriate
  ARIA roles/attributes (`role="checkbox"`, `aria-checked`,
  `aria-current`, `aria-live`, `role="progressbar"`, etc.)
- Modals use the native `<dialog>` element, which provides built-in focus
  trapping and `Esc`-to-close
- Visible focus states on every interactive element
- `prefers-reduced-motion` is respected across all animations

---

## 🌐 Browser Support

Built on evergreen web standards — the native `<dialog>` element,
`backdrop-filter`, and CSS custom properties. Recommended: the latest two
versions of Chrome, Edge, Firefox, and Safari.

---

## 👨‍💻 Developer

**Md. Faijul Karim**

Electrical & Electronic Engineering (EEE) Graduate

Aspiring Software Engineer | Web Developer | IoT & AI Enthusiast

### Connect with me

- 💻 GitHub: https://github.com/faijulakrim
- 💼 LinkedIn: https://linkedin.com/in/md-faijul-karim
- 📧 Email: faijulakrimofficial@gmail.com


---

## 📄 License

This project is licensed under the MIT License.

© 2026 Md. Faijul Karim. All rights reserved.