/* ============================================
   BOOKYTOONS — READER SCRIPT
   Custom page-flip reader powered by PDF.js
   ============================================ */

pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// ---- STATE ----
let pdfDoc       = null;
let totalPages   = 0;
let currentSpread = 1;   // left page number of current spread (odd = left, even+1 = left)
let isFlipping   = false;
let isMobile     = window.innerWidth <= 580;

// Get params from URL
const params  = new URLSearchParams(window.location.search);
const pdfUrl  = params.get('pdf');
const title   = params.get('title') || 'Book';

// ---- DOM REFS ----
const titleBar       = document.getElementById('bookTitleBar');
const flipbook       = document.getElementById('flipbook');
const canvasLeft     = document.getElementById('canvasLeft');
const canvasRight    = document.getElementById('canvasRight');
const canvasFlip     = document.getElementById('canvasFlip');
const canvasFlipBack = document.getElementById('canvasFlipBack');
const flipPageEl     = document.getElementById('flipPage');
const pageNumLeft    = document.getElementById('pageNumLeft');
const pageNumRight   = document.getElementById('pageNumRight');
const pageIndicator  = document.getElementById('pageIndicator');
const btnFirst       = document.getElementById('btnFirst');
const btnPrev        = document.getElementById('btnPrev');
const btnNext        = document.getElementById('btnNext');
const btnLast        = document.getElementById('btnLast');
const turnCorner     = document.getElementById('turnCorner');
const loadingOverlay = document.getElementById('loadingOverlay');

// ---- INIT ----
document.title = `${title} | Bookytoons`;
titleBar.textContent = title;

if (!pdfUrl) {
  showError('No PDF specified. Check your books.json.');
} else {
  loadPDF(pdfUrl);
}

async function loadPDF(url) {
  try {
    const loadingTask = pdfjsLib.getDocument(url);
    pdfDoc = await loadingTask.promise;
    totalPages = pdfDoc.numPages;
    currentSpread = 1;
    await sizeBookToPage();
    await renderSpread(currentSpread, false);
    hideLoading();
  } catch (err) {
    showError(`Failed to load PDF: ${err.message}`);
  }
}

// ---- SIZE BOOK TO PDF PAGE DIMENSIONS ----
async function sizeBookToPage() {
  if (!pdfDoc) return;
  const page = await pdfDoc.getPage(1);
  const vp = page.getViewport({ scale: 1 });
  const aspect = vp.width / vp.height;

  const maxH = Math.min(window.innerHeight * 0.72, 680);
  const pageH = maxH;
  const pageW = Math.round(pageH * aspect);

  // Double-page spread
  if (!isMobile) {
    const totalW = pageW * 2 + 20; // 20 = spine
    flipbook.style.setProperty('--book-width',  totalW + 'px');
    flipbook.style.setProperty('--book-height', pageH  + 'px');
    flipbook.style.width  = totalW + 'px';
    flipbook.style.height = pageH  + 'px';
  } else {
    flipbook.style.width  = Math.min(pageW, window.innerWidth - 20) + 'px';
    flipbook.style.height = pageH + 'px';
  }
}

// ---- RENDER SPREAD ----
async function renderSpread(leftPageNum, animate, direction) {
  const leftNum  = leftPageNum;
  const rightNum = leftPageNum + 1;

  if (animate && !isMobile) {
    await animateFlip(leftNum, rightNum, direction);
  } else {
    await Promise.all([
      renderPage(leftNum,  canvasLeft,  !isMobile),
      renderPage(rightNum, canvasRight, true),
    ]);
  }

  updatePageNumbers(leftNum, rightNum);
  updateControls();
}

async function renderPage(num, canvas, show) {
  if (!show) { canvas.style.display = 'none'; return; }
  if (num < 1 || num > totalPages) {
    canvas.style.display = 'none';
    return;
  }
  canvas.style.display = 'block';

  const page = await pdfDoc.getPage(num);
  const container = canvas.parentElement;
  const availW = container.clientWidth  - 4;
  const availH = container.clientHeight - 20;

  const vp0   = page.getViewport({ scale: 1 });
  const scale = Math.min(availW / vp0.width, availH / vp0.height);
  const vp    = page.getViewport({ scale });

  canvas.width  = vp.width;
  canvas.height = vp.height;
  canvas.style.maxWidth  = '100%';
  canvas.style.maxHeight = '100%';

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Warm paper tint
  ctx.fillStyle = '#fdf6e3';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({ canvasContext: ctx, viewport: vp }).promise;
}

// ---- PAGE FLIP ANIMATION ----
async function animateFlip(newLeftNum, newRightNum, direction) {
  // direction: 'forward' = turning right, 'backward' = turning left
  const fwd = direction === 'forward';

  // Pre-render next spread onto offscreen canvases for the flip
  // The flying page:
  //   forward: front = old right page, back = new left page
  //   backward: front = old left page (currently on right during anim), back = new right page

  // Determine which pages go on the flip page
  const frontPageNum = fwd
    ? (currentSpread + 1)   // old right → becomes front of flipping page
    : currentSpread;        // old left → becomes front (we're going back)

  const backPageNum = fwd
    ? newLeftNum            // new left page → back of flipping page
    : newRightNum;          // new right page → back of flipping page

  // Render front of flip
  await renderPage(frontPageNum, canvasFlip,     true);
  await renderPage(backPageNum,  canvasFlipBack, true);

  // Show flip element
  flipPageEl.style.display = 'block';

  // Position: for forward, flip starts on right side; for backward, starts on left as mirrored
  if (fwd) {
    flipPageEl.style.left = '50%'; // right half
    flipPageEl.style.transformOrigin = 'left center';
    flipPageEl.style.transform = 'rotateY(0deg)';
  } else {
    flipPageEl.style.left = '0%'; // left half, mirrored start
    flipPageEl.style.transformOrigin = 'right center';
    flipPageEl.style.transform = 'rotateY(0deg)';
  }

  // Trigger animation
  flipPageEl.classList.remove('flipping-forward', 'flipping-backward');
  void flipPageEl.offsetWidth; // reflow
  flipPageEl.classList.add(fwd ? 'flipping-forward' : 'flipping-backward');

  // Wait for animation
  await wait(560);

  // Render the actual spread under the flip page
  await Promise.all([
    renderPage(newLeftNum,  canvasLeft,  true),
    renderPage(newRightNum, canvasRight, true),
  ]);

  // Hide flip page
  flipPageEl.style.display = 'none';
  flipPageEl.classList.remove('flipping-forward', 'flipping-backward');
}

// ---- NAVIGATION ----
async function goNext() {
  if (isFlipping) return;
  const next = isMobile ? currentSpread + 1 : currentSpread + 2;
  if (next > totalPages) return;
  isFlipping = true;
  const old = currentSpread;
  currentSpread = next;
  await renderSpread(currentSpread, true, 'forward');
  isFlipping = false;
}

async function goPrev() {
  if (isFlipping) return;
  const prev = isMobile ? currentSpread - 1 : currentSpread - 2;
  if (prev < 1) return;
  isFlipping = true;
  currentSpread = prev;
  await renderSpread(currentSpread, true, 'backward');
  isFlipping = false;
}

async function goFirst() {
  if (isFlipping) return;
  currentSpread = 1;
  await renderSpread(currentSpread, false);
}

async function goLast() {
  if (isFlipping) return;
  if (isMobile) {
    currentSpread = totalPages;
  } else {
    currentSpread = totalPages % 2 === 0 ? totalPages - 1 : totalPages;
  }
  await renderSpread(currentSpread, false);
}

// ---- UI UPDATES ----
function updatePageNumbers(left, right) {
  pageNumLeft.textContent  = left  <= totalPages ? left  : '';
  pageNumRight.textContent = right <= totalPages ? right : '';

  if (isMobile) {
    pageIndicator.textContent = `${currentSpread} / ${totalPages}`;
  } else {
    const r = Math.min(right, totalPages);
    pageIndicator.textContent = `${left}–${r} / ${totalPages}`;
  }
}

function updateControls() {
  btnFirst.disabled = currentSpread <= 1;
  btnPrev.disabled  = currentSpread <= 1;
  btnNext.disabled  = isMobile
    ? currentSpread >= totalPages
    : currentSpread + 1 >= totalPages;
  btnLast.disabled  = isMobile
    ? currentSpread >= totalPages
    : currentSpread + 1 >= totalPages;
}

// ---- EVENT LISTENERS ----
btnNext.addEventListener('click', goNext);
btnPrev.addEventListener('click', goPrev);
btnFirst.addEventListener('click', goFirst);
btnLast.addEventListener('click', goLast);
turnCorner.addEventListener('click', goNext);

// Keyboard navigation
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext();
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   goPrev();
  if (e.key === 'Home') goFirst();
  if (e.key === 'End')  goLast();
});

// Swipe support
let touchStartX = 0;
document.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
document.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 50) {
    if (dx < 0) goNext(); else goPrev();
  }
}, { passive: true });

// Window resize
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(async () => {
    isMobile = window.innerWidth <= 580;
    await sizeBookToPage();
    await renderSpread(currentSpread, false);
  }, 250);
});

// ---- HELPERS ----
function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function hideLoading() {
  loadingOverlay.classList.add('hidden');
  setTimeout(() => { loadingOverlay.style.display = 'none'; }, 400);
}

function showError(msg) {
  loadingOverlay.innerHTML = `
    <p style="font-family:var(--font-type);color:#c97c3e;font-size:1rem;text-align:center;padding:2rem;max-width:400px;">
      ⚠ ${msg}
    </p>
    <a href="index.html" style="color:var(--gold);font-family:var(--font-type);margin-top:1rem;">← Return to Library</a>
  `;
}
