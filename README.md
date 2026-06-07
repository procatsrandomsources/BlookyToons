# 📚 Bookytoons — Private Book Library

A retro vintage book library with a custom page-flip reader, hosted on GitHub Pages.  
Only you control what books appear — no external logins, no accounts.

---

## ✦ Setup on GitHub Pages

### 1. Create a GitHub repo
- Go to [github.com](https://github.com) → **New repository**
- Name it whatever you like (e.g. `bookytoons`)
- Set to **Public** (required for free GitHub Pages)
- Click **Create repository**

### 2. Upload the files
Upload this entire folder structure to your repo:
```
bookytoons/
├── index.html
├── reader.html
├── css/
│   ├── style.css
│   └── reader.css
├── js/
│   ├── library.js
│   └── reader.js
└── books/
    ├── books.json        ← edit this to manage your library
    └── your-book.pdf     ← your PDF files go here
```

### 3. Enable GitHub Pages
- Go to your repo → **Settings** → **Pages**
- Under **Source** choose: `Deploy from a branch`
- Branch: `main` / folder: `/ (root)`
- Click **Save**
- Your site will be live at: `https://YOUR-USERNAME.github.io/REPO-NAME/`

---

## ✦ Adding or Removing Books

Open **`books/books.json`** and edit it. Each book is one entry:

```json
[
  {
    "title": "The Unknown",
    "author": "Procat",
    "file": "books/the-unknown.pdf",
    "color": "#2a1a3a"
  },
  {
    "title": "My Second Book",
    "author": "Procat",
    "file": "books/second-book.pdf",
    "color": "#1a3a2a"
  }
]
```

| Field | Required | Description |
|-------|----------|-------------|
| `title` | ✅ | Book title shown on the spine and label |
| `author` | optional | Shown smaller on the spine |
| `file` | ✅ | Path to the PDF relative to repo root |
| `color` | optional | Hex color for the book spine (e.g. `#2a1a3a`) |

**To add a book:** Upload the PDF to `books/` and add an entry to `books.json`.  
**To remove a book:** Delete the entry from `books.json` (and optionally delete the PDF).

Commit and push — GitHub Pages auto-updates within ~1 minute.

---

## ✦ Spine Color Ideas

| Color | Hex |
|-------|-----|
| Dark violet (horror) | `#2a1a3a` |
| Deep forest green | `#1a3a2a` |
| Navy blue | `#1a2a4a` |
| Dark burgundy | `#4a1a1a` |
| Olive bronze | `#3a3a1a` |
| Aged leather | `#6b3a1f` |

---

## ✦ Controls

| Action | Method |
|--------|--------|
| Next page | Click ▶, press → arrow, swipe left, or click bottom-right corner |
| Prev page | Click ◀, press ← arrow, or swipe right |
| First / Last | ⏮ ⏭ buttons or Home/End keys |

---

## ✦ PDF Tips

- PDFs hosted in the `books/` folder work without any CORS issues
- Large PDFs (100+ pages) load fine — only the visible pages render at once
- Works on desktop (two-page spread) and mobile (single page + swipe)
- For best quality, export your PDFs at 150–200 DPI

---

*Made with love, leather, and a little bit of magic.* ✦
