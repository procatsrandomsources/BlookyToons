/* ============================================
   BOOKYTOONS — LIBRARY SCRIPT
   Reads books/books.json and builds the shelf.
   ============================================ */

// Spawn ambient dust particles
(function spawnDust() {
  const container = document.getElementById('dust');
  if (!container) return;
  for (let i = 0; i < 22; i++) {
    const p = document.createElement('div');
    p.className = 'dust-particle';
    const left = Math.random() * 100;
    const size = 1 + Math.random() * 2;
    const duration = 12 + Math.random() * 20;
    const delay = Math.random() * 15;
    const drift = (Math.random() - 0.5) * 120;
    p.style.cssText = `
      left: ${left}%;
      bottom: -10px;
      width: ${size}px;
      height: ${size}px;
      animation-duration: ${duration}s;
      animation-delay: ${delay}s;
      --drift: ${drift}px;
    `;
    container.appendChild(p);
  }
})();

// Curated book spine colours for variety
const SPINE_COLOURS = [
  '#6b3a1f','#2d4a2d','#1a2a4a','#4a1a1a','#3a3a1a',
  '#4a2a5a','#1a3a3a','#5a3a1a','#2a1a4a','#3a1a2a',
  '#1a4a2a','#5a1a1a','#2a3a5a','#4a3a2a','#1a2a3a',
];

const BOOK_HEIGHTS = [180, 200, 220, 210, 190, 215, 205, 195];
const BOOK_WIDTHS  = [65,  72,  80,  68,  75,  70,  78,  62 ];

async function loadBooks() {
  let books = [];
  try {
    const res = await fetch('books/books.json');
    if (!res.ok) throw new Error('Not found');
    books = await res.json();
  } catch (e) {
    console.warn('Could not load books/books.json:', e);
  }
  return books;
}

function renderShelf(books) {
  const shelf = document.getElementById('bookshelf');
  const empty = document.getElementById('emptyState');

  if (!books || books.length === 0) {
    shelf.style.display = 'none';
    empty.style.display = 'flex';
    return;
  }

  books.forEach((book, i) => {
    const color = book.color || SPINE_COLOURS[i % SPINE_COLOURS.length];
    const h = BOOK_HEIGHTS[i % BOOK_HEIGHTS.length];
    const w = BOOK_WIDTHS[i % BOOK_WIDTHS.length];

    const item = document.createElement('div');
    item.className = 'book-item';
    item.title = `Open "${book.title}"`;
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');

    item.innerHTML = `
      <div class="book-3d" style="
        --book-color: ${color};
        --book-w: ${w}px;
        --book-h: ${h}px;
        background: linear-gradient(135deg, ${color} 0%, ${darken(color, 30)} 100%);
      ">
        <div class="book-line-top"></div>
        <div class="book-spine-title">${escapeHtml(book.title)}</div>
        ${book.author ? `<div class="book-spine-title" style="font-size:0.48rem;opacity:0.7;margin-top:6px;">${escapeHtml(book.author)}</div>` : ''}
        <div class="book-line-bottom"></div>
      </div>
      <div class="book-label">${escapeHtml(book.title)}</div>
    `;

    const open = () => {
      const url = `reader.html?pdf=${encodeURIComponent(book.file)}&title=${encodeURIComponent(book.title)}`;
      window.location.href = url;
    };
    item.addEventListener('click', open);
    item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') open(); });

    shelf.appendChild(item);
  });
}

function darken(hex, amount) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (n >> 16) - amount);
  const g = Math.max(0, ((n >> 8) & 0xff) - amount);
  const b = Math.max(0, (n & 0xff) - amount);
  return '#' + [r,g,b].map(x => x.toString(16).padStart(2,'0')).join('');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

loadBooks().then(renderShelf);
