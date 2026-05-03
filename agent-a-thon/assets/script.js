/* ============================================================
   Cagamas Agent-a-thon — Team Page Script
   13 May 2026
   ============================================================ */

const TEAM_HASHES = {
  'business-client':       'f3dd3759847b73a98b9d70f5af63f55b83381559f10a3943c4128ca17c2dbe3e',
  'islamic-business':      '2d89485b597992f67d784956d0ff9f493f8f43991f83d5f31f86a3d1275d756f',
  'treasury-dcm':          'f9f01825521ff40c974e7404d3632c67570c7b9c58e068ba41e2f345a4e95126',
  'finance-reporting':     'c9c0d50183f2ebfc1b4f4b85d467ca9862c7052c32fa674d038f696abd25847e',
  'technology-operations': '6eaf003125f3e5a67f4b3959532d008f40f840979540ce510674a1c242f1e753',
  'human-capital':         '679765d5387c849dcf949d21e918b1790bc9e73ed9551f6e15c3f1a7040a42b5',
  'risk-compliance':       '639f00a4ea038772bc3005ce5d83d4af1bd809fc4e1952c2a6d4d511c1f5fd34',
  'strategy-research':     '5e63d40d3a5b2ea56e12edd4c8e6abf53febe198c3bafeb78e1595d04244552b'
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
  return sessionStorage.getItem(STORAGE_PREFIX + 'agt_team');
}
function setStoredTeam(teamId) {
  sessionStorage.setItem(STORAGE_PREFIX + 'agt_team', teamId);
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
  const storageKey = STORAGE_PREFIX + 'agt_powerup_' + teamId;
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

  if (isFacilitator()) {
    showTeamContent();
    return;
  }

  const storedTeam = getStoredTeam();
  if (storedTeam && storedTeam !== teamId) {
    const wrongMsg = document.getElementById('wrong-team-msg');
    if (wrongMsg) wrongMsg.style.display = 'flex';
    return;
  }

  if (storedTeam === teamId) {
    showTeamContent();
    return;
  }

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
