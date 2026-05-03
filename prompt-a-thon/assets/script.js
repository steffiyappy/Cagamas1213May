/* ============================================================
   Cagamas Prompt-a-thon — Team Page Script
   12 May 2026
   ============================================================ */

const TEAM_HASHES = {
  'business-client':       'ccaa1dc1e2c98fbeb5a833baea88fdd9ba339b2b28bc00915462b120a40cf1b2',
  'islamic-business':      '5c2bc725c366d8493bf0a0edb016ea64e463d233a558ab45c0e990cb0b2ae6e7',
  'treasury-dcm':          '6e6a9d325b031f30b81730af05ee9034e70d03a5ce061f623fd2a47cc717471a',
  'finance-reporting':     '2179cb6356366d741697568beb536438abe2cc5a23f7bf455583e89cfcbb6c8a',
  'technology-operations': 'f2ffaaa4d0f655f217b4c83b42014da5d2a65ea3b11aabc599d8aeddfd935dd4',
  'human-capital':         'bf0a332369483398be048fbf4c2ada6dfb92c20236de5746904b0f6d857be73f',
  'risk-compliance':       'e29a1e7f4b755a6ce59f8e6f08d9c24e63018e5267d9964397404fb71c8680af',
  'strategy-research':     'bb38b31c43b67dac00a7544838f38605cded47b1faacb0f87fb2f684f01d84c9'
};

const STORAGE_PREFIX = 'cag_';

/* ── SHA-256 via Web Crypto ── */
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ── Helpers ── */
function isFacilitator() {
  return new URLSearchParams(window.location.search).has('facilitator');
}
function getStoredTeam() {
  return sessionStorage.getItem(STORAGE_PREFIX + 'team');
}
function setStoredTeam(teamId) {
  sessionStorage.setItem(STORAGE_PREFIX + 'team', teamId);
}

/* ── Show team content (after unlock) ── */
function showTeamContent() {
  const gate = document.getElementById('lock-gate');
  const content = document.getElementById('team-content');
  if (gate) gate.style.display = 'none';
  if (content) content.style.display = 'block';
  initPowerUpGate();
}

/* ── Power-Up Gate ── */
function initPowerUpGate() {
  const teamId = document.querySelector('meta[name="team-id"]')?.content;
  const storageKey = STORAGE_PREFIX + 'powerup_' + teamId;
  const gate     = document.getElementById('powerup-gate');
  const section  = document.getElementById('powerups-section');
  const revealBtn= document.getElementById('reveal-powerups-btn');
  const banner   = document.getElementById('revealed-banner');

  if (!gate) return;

  const alreadyRevealed = sessionStorage.getItem(storageKey) === 'revealed' || isFacilitator();

  if (alreadyRevealed) {
    gate.style.display    = 'none';
    if (section) section.style.display = 'block';
    if (banner)  banner.style.display  = 'block';
    return;
  }

  if (section) section.style.display = 'none';

  if (revealBtn) {
    revealBtn.addEventListener('click', () => {
      sessionStorage.setItem(storageKey, 'revealed');
      gate.style.display = 'none';
      if (section) section.style.display = 'block';
      if (banner)  banner.style.display  = 'block';
    });
  }
}

/* ── Main team-page initialiser ── */
async function initTeamPage() {
  const teamId = document.querySelector('meta[name="team-id"]')?.content;
  if (!teamId) return;

  /* Facilitator bypass */
  if (isFacilitator()) {
    showTeamContent();
    return;
  }

  /* Cross-team lock */
  const storedTeam = getStoredTeam();
  if (storedTeam && storedTeam !== teamId) {
    const wrongMsg = document.getElementById('wrong-team-msg');
    if (wrongMsg) wrongMsg.style.display = 'flex';
    return;
  }

  /* Already unlocked this session */
  if (storedTeam === teamId) {
    showTeamContent();
    return;
  }

  /* Wire up lock form */
  const form     = document.getElementById('team-lock-form');
  const input    = document.getElementById('team-code-input');
  const errorMsg = document.getElementById('lock-error');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const code = (input.value || '').trim().toUpperCase();
      const hash = await sha256(code);
      if (hash === TEAM_HASHES[teamId]) {
        setStoredTeam(teamId);
        showTeamContent();
      } else {
        if (errorMsg) {
          errorMsg.style.display = 'block';
          errorMsg.textContent = '❌ Incorrect team code. Please check with your facilitator.';
        }
        input.value = '';
        input.focus();
      }
    });
  }
}

/* ── Reset button ── */
function addResetButton() {
  const btn = document.createElement('button');
  btn.id = 'reset-btn';
  btn.textContent = '🔄 Reset Session';
  btn.addEventListener('click', () => {
    if (confirm('Reset your session? You will need to re-enter your team code.')) {
      /* Clear all cag_ session & local storage */
      Object.keys(sessionStorage)
        .filter(k => k.startsWith(STORAGE_PREFIX))
        .forEach(k => sessionStorage.removeItem(k));
      Object.keys(localStorage)
        .filter(k => k.startsWith(STORAGE_PREFIX))
        .forEach(k => localStorage.removeItem(k));
      window.location.href = '../index.html';
    }
  });
  document.body.appendChild(btn);
}

/* ── Boot ── */
document.addEventListener('DOMContentLoaded', () => {
  initTeamPage();
  addResetButton();
});
