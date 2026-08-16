/* ═══════════════════════════════════════════════════════════════════
   EMPLOYEE PORTAL — JavaScript
   مجموعة معمار للاستشارات الهندسية
   ═══════════════════════════════════════════════════════════════════ */

// ── Page Navigation ─────────────────────────────────────────────
function switchPage(pageId) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  // Show target page
  const target = document.getElementById(pageId);
  if (target) target.classList.add('active');
  // Update sidebar active state
  document.querySelectorAll('.sb-link').forEach(link => {
    link.classList.toggle('active', link.getAttribute('data-page') === pageId);
  });
  // Close sidebar on mobile
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('open');
  }
}

// ── Sidebar Toggle (Mobile) ─────────────────────────────────────
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ── Toast Notification ──────────────────────────────────────────
function showToast(message, type) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = 'toast show ' + (type || '');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// ── Close sidebar on outside click (mobile) ─────────────────────
document.addEventListener('click', function(e) {
  const sidebar = document.getElementById('sidebar');
  const menuBtn = document.querySelector('.menu-toggle');
  if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
    if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  }
});

// ── Expose functions to global scope (module mode) ──────────────
window.switchPage = switchPage;
window.toggleSidebar = toggleSidebar;
window.showToast = showToast;

// ── Initialize ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  // Set current date in greeting
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const dateStr = now.toLocaleDateString('ar-KW', options);
  const greetingDate = document.querySelector('.greeting-date');
  if (greetingDate) greetingDate.textContent = dateStr;

  // Determine greeting based on time
  const hour = now.getHours();
  let greeting = 'مرحباً';
  if (hour < 12) greeting = 'صباح الخير';
  else if (hour < 17) greeting = 'مساء الخير';
  else greeting = 'مساء الخير';
  
  const greetingText = document.querySelector('.greeting-text');
  if (greetingText) greetingText.textContent = greeting + '، م. أحمد 👋';
});