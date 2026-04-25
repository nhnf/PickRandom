/* ================================================
   app.js – Logic Acak Absen & Kuis Kaidah
   ================================================ */

// ── 1. DATA STATIS ────────────────────────────────────────────────────────────

/** Daftar nomor absen 1–30 */
const NOMOR_ABSEN = Array.from({ length: 30 }, (_, i) => i + 1);

/**
 * Daftar kuis kaidah.
 * 6 kaidah × 2 tipe = 12 item.
 * Tampilan instruksi: "Kaidah ke-N" atau "Kaidah ke-N + Makna"
 */
const DAFTAR_KUIS = [
  { kaidah_ke: 1, tipe: 'kaidah' },
  { kaidah_ke: 1, tipe: 'makna'  },
  { kaidah_ke: 2, tipe: 'kaidah' },
  { kaidah_ke: 2, tipe: 'makna'  },
  { kaidah_ke: 3, tipe: 'kaidah' },
  { kaidah_ke: 3, tipe: 'makna'  },
  { kaidah_ke: 4, tipe: 'kaidah' },
  { kaidah_ke: 4, tipe: 'makna'  },
  { kaidah_ke: 5, tipe: 'kaidah' },
  { kaidah_ke: 5, tipe: 'makna'  },
  { kaidah_ke: 6, tipe: 'kaidah' },
  { kaidah_ke: 6, tipe: 'makna'  },
];


// ── 2. STATE ──────────────────────────────────────────────────────────────────

let availableNumbers = [...NOMOR_ABSEN]; // nomor yang belum dipilih
let selectedNumbers  = [];               // nomor yang sudah dipilih
let isRolling        = false;
let currentNumber    = null;
let currentQuiz      = null;
let rollIntervalId   = null;
let confettiFrameId  = null;
let confettiParticles = [];


// ── 3. DOM REFERENCES ─────────────────────────────────────────────────────────

const rollBtn          = document.getElementById('rollBtn');
const rollBtnText      = document.getElementById('rollBtnText');
const displayValue     = document.getElementById('displayValue');
const numberDisplay    = document.getElementById('numberDisplay');
const numberRing       = document.getElementById('numberRing');
const historyContainer = document.getElementById('historyContainer');
const progressFill     = document.getElementById('progressFill');
const progressLabel    = document.getElementById('progressLabel');

const quizModal      = document.getElementById('quizModal');
const modalNumber    = document.getElementById('modalNumber');
const quizQuestion   = document.getElementById('quizQuestion');
const closeModal     = document.getElementById('closeModal');
const closeModalBtn  = document.getElementById('closeModalBtn');

const confettiCanvas = document.getElementById('confettiCanvas');
const ctx            = confettiCanvas.getContext('2d');


// ── 4. UTILITY ────────────────────────────────────────────────────────────────

/** Acak elemen dari array */
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Fisher-Yates shuffle */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Sleep promise */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));


// ── 5. UI UPDATES ─────────────────────────────────────────────────────────────

function updateProgress() {
  const pct = (selectedNumbers.length / NOMOR_ABSEN.length) * 100;
  progressFill.style.width = `${pct}%`;
  progressLabel.textContent =
    `${selectedNumbers.length} / ${NOMOR_ABSEN.length} nomor telah terpilih`;
}

function addHistoryChip(num) {
  const chip = document.createElement('div');
  chip.className = 'history-chip';
  chip.textContent = num;
  chip.title = `Absen no. ${num}`;
  chip.setAttribute('aria-label', `Nomor absen ${num} sudah terpilih`);
  historyContainer.appendChild(chip);
}

function renderAllChips() {
  historyContainer.innerHTML = '';
  selectedNumbers.forEach(n => addHistoryChip(n));
}


// ── 6. ROLL ANIMATION ────────────────────────────────────────────────────────

async function startRoll() {
  if (isRolling) return;

  if (availableNumbers.length === 0) {
    showToast('Semua nomor sudah terpilih! Refresh halaman untuk mengulang.');
    return;
  }

  isRolling = true;
  rollBtn.disabled = true;
  rollBtnText.innerHTML = `
    <svg class="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
    </svg>
    Mengacak...
  `;

  // Phase 1 – rolling fast
  numberDisplay.classList.add('rolling');
  numberRing.classList.add('rolling');
  numberDisplay.classList.remove('revealed');

  const duration = 2000 + Math.random() * 1000; // 2–3 s
  const startTime = Date.now();

  const shuffled = shuffle(availableNumbers);
  let idx = 0;

  rollIntervalId = setInterval(() => {
    displayValue.textContent = shuffled[idx % shuffled.length];
    idx++;
  }, 80);

  await sleep(duration);
  clearInterval(rollIntervalId);

  // Phase 2 – slow down
  numberDisplay.classList.remove('rolling');
  for (let speed = 150; speed <= 500; speed += 70) {
    displayValue.textContent = pickRandom(availableNumbers);
    await sleep(speed);
  }

  // Phase 3 – pick final number
  const finalNum = pickRandom(availableNumbers);
  currentNumber = finalNum;

  // Remove from available, add to selected
  availableNumbers = availableNumbers.filter(n => n !== finalNum);
  selectedNumbers.push(finalNum);

  // Reveal
  displayValue.textContent = finalNum;
  numberDisplay.classList.add('revealed');
  numberRing.classList.remove('rolling');
  numberRing.classList.add('done');

  updateProgress();
  addHistoryChip(finalNum);

  // Reset button state
  isRolling = false;
  rollBtn.disabled = false;
  rollBtnText.innerHTML = `
    <svg class="w-6 h-6 transition-transform group-hover:rotate-180 duration-500"
      fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
    </svg>
    Acak Lagi
  `;

  // Confetti 🎉
  launchConfetti();

  // Open quiz modal after short delay
  await sleep(600);
  openQuizModal(finalNum);
}


// ── 7. QUIZ MODAL ─────────────────────────────────────────────────────────────

function pickQuiz() {
  return pickRandom(DAFTAR_KUIS);
}

function renderQuiz(quiz) {
  currentQuiz = quiz;

  const label = quiz.tipe === 'makna'
    ? `Kaidah ke-${quiz.kaidah_ke} + Makna`
    : `Kaidah ke-${quiz.kaidah_ke}`;

  quizQuestion.textContent = label;
}

function openQuizModal(num) {
  modalNumber.textContent = num;
  renderQuiz(pickQuiz());

  quizModal.classList.remove('hidden');
  quizModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  // Focus trap – focus close button
  setTimeout(() => closeModal.focus(), 50);
}

function closeQuizModal() {
  quizModal.classList.add('hidden');
  quizModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  rollBtn.focus();
}


// ── 9. CONFETTI ───────────────────────────────────────────────────────────────

function resizeCanvas() {
  confettiCanvas.width  = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}

function launchConfetti() {
  resizeCanvas();
  confettiParticles = [];

  const COLORS = ['#7C3AED','#EC4899','#F59E0B','#10B981','#3B82F6','#FBBF24','#A78BFA'];
  const COUNT  = 110;

  for (let i = 0; i < COUNT; i++) {
    confettiParticles.push({
      x:     Math.random() * confettiCanvas.width,
      y:     Math.random() * confettiCanvas.height * 0.4 - confettiCanvas.height * 0.2,
      vx:    (Math.random() - 0.5) * 6,
      vy:    Math.random() * 4 + 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size:  Math.random() * 8 + 4,
      rot:   Math.random() * 360,
      rotV:  (Math.random() - 0.5) * 8,
      alpha: 1,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
    });
  }

  if (confettiFrameId) cancelAnimationFrame(confettiFrameId);
  animateConfetti();
}

function animateConfetti() {
  ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

  confettiParticles = confettiParticles.filter(p => p.alpha > 0.05);

  confettiParticles.forEach(p => {
    p.x   += p.vx;
    p.y   += p.vy;
    p.vy  += 0.12;  // gravity
    p.rot += p.rotV;
    p.alpha -= 0.012;

    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.translate(p.x, p.y);
    ctx.rotate((p.rot * Math.PI) / 180);
    ctx.fillStyle = p.color;

    if (p.shape === 'rect') {
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });

  if (confettiParticles.length > 0) {
    confettiFrameId = requestAnimationFrame(animateConfetti);
  } else {
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }
}


// ── 10. TOAST NOTIFICATION ────────────────────────────────────────────────────

function showToast(msg) {
  const existing = document.getElementById('liveToast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'liveToast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%) translateY(0);
    background: rgba(30,15,60,0.95);
    border: 1px solid rgba(167,139,250,0.3);
    color: #fff;
    font-family: 'Outfit', sans-serif;
    font-size: 0.875rem;
    font-weight: 600;
    padding: 0.75rem 1.5rem;
    border-radius: 999px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.4);
    z-index: 9999;
    backdrop-filter: blur(10px);
    transition: opacity 0.4s, transform 0.4s;
    white-space: nowrap;
  `;
  toast.textContent = msg;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(10px)';
    setTimeout(() => toast.remove(), 400);
  }, 2800);
}


// ── 11. EVENT LISTENERS ───────────────────────────────────────────────────────

rollBtn.addEventListener('click', startRoll);

closeModal.addEventListener('click', closeQuizModal);
closeModalBtn.addEventListener('click', closeQuizModal);

// Close on backdrop click
quizModal.addEventListener('click', (e) => {
  if (e.target === quizModal) closeQuizModal();
});

// Keyboard: Escape to close modal, Space/Enter to roll
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !quizModal.classList.contains('hidden')) {
    closeQuizModal();
  }
  if ((e.key === ' ' || e.key === 'Enter') && document.activeElement === rollBtn) {
    e.preventDefault();
    startRoll();
  }
});

// Resize canvas on window resize
window.addEventListener('resize', resizeCanvas);


// ── 12. INIT ──────────────────────────────────────────────────────────────────

(function init() {
  resizeCanvas();
  updateProgress();
})();
