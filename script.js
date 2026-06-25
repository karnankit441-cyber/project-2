/* ─────────────────────────────────────────
   APEX GYM — script.js
   Supabase + Formspree + WhatsApp
   ───────────────────────────────────────── */

/* ── Supabase Init ── */
const SUPABASE_URL = 'https://fqnleqcxsivdonvebenx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_FpHnlLVyqwLh747R9RcxdA_RvVqVOyK';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* ── Nav scroll effect ── */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* ── Mobile menu toggle ── */
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');
let menuOpen = false;

function toggleMenu(force) {
  menuOpen = force !== undefined ? force : !menuOpen;
  mobileMenu.classList.toggle('open', menuOpen);
  document.body.style.overflow = menuOpen ? 'hidden' : '';
  const spans = burger.querySelectorAll('span');
  if (menuOpen) {
    spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
    spans[1].style.opacity = '0';
    spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
  } else {
    spans[0].style.transform = '';
    spans[1].style.opacity = '';
    spans[2].style.transform = '';
  }
}

burger.addEventListener('click', () => toggleMenu());
document.querySelectorAll('.mobile-link').forEach(link => {
  link.addEventListener('click', () => toggleMenu(false));
});

/* ── Counter Animation ── */
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 1800;
  const startTime = performance.now();
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
    el.textContent = Math.round(eased * target).toLocaleString();
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

let countersStarted = false;
function checkCounters() {
  if (countersStarted) return;
  const statsSection = document.querySelector('.hero__stats');
  if (!statsSection) return;
  const rect = statsSection.getBoundingClientRect();
  if (rect.top < window.innerHeight * 0.85) {
    countersStarted = true;
    document.querySelectorAll('.stat__num[data-target]').forEach(el => animateCounter(el));
  }
}
window.addEventListener('scroll', checkCounters, { passive: true });
setTimeout(checkCounters, 400);

/* ── Scroll Reveal ── */
function initReveal() {
  const elements = document.querySelectorAll(
    '.program-card, .trainer-card, .pricing-card, .why__feature, .section-header, .hero__content, .hero__stats, .contact__left, .contact__right'
  );
  elements.forEach(el => {
    el.classList.add('reveal');
    const siblings = [...el.parentElement.children].filter(c => c.classList.contains(el.classList[0]));
    const idx = siblings.indexOf(el);
    if (idx > 0 && idx <= 4) el.classList.add(`reveal-delay-${idx}`);
  });
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  elements.forEach(el => observer.observe(el));
}
initReveal();

/* ── Active nav link ── */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav__links a');
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        link.style.color = link.getAttribute('href') === `#${entry.target.id}` ? 'var(--white)' : '';
      });
    }
  });
}, { threshold: 0.4 });
sections.forEach(section => sectionObserver.observe(section));

/* ── Program card hover ── */
document.querySelectorAll('.program-card:not(.program-card--cta)').forEach(card => {
  card.addEventListener('mouseenter', () => card.style.transform = 'translateY(-4px)');
  card.addEventListener('mouseleave', () => card.style.transform = '');
});

/* ── Modal ── */
const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');
const modalPlanName = document.getElementById('modalPlanName');
const modalPlanInput = document.getElementById('modalPlanInput');

function openModal(plan) {
  modalPlanName.textContent = plan;
  modalPlanInput.value = plan;
  modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

document.querySelectorAll('.open-modal').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal(btn.dataset.plan || 'General Enquiry');
  });
});

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (menuOpen) toggleMenu(false);
    closeModal();
  }
});

/* ────────────────────────────────────────
   SUPABASE HELPERS
   Saves leads + contact form submissions
────────────────────────────────────────── */
async function saveToSupabase(table, data) {
  try {
    const { error } = await supabase.from(table).insert([data]);
    if (error) console.warn('Supabase insert warning:', error.message);
  } catch (err) {
    console.warn('Supabase error:', err);
  }
}

/* ────────────────────────────────────────
   CONTACT FORM — Formspree + Supabase
────────────────────────────────────────── */
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    const text = document.getElementById('submitText');
    const spinner = document.getElementById('submitSpinner');
    const successEl = document.getElementById('formSuccess');
    const errorEl = document.getElementById('formError');

    btn.disabled = true;
    text.textContent = 'Sending…';
    spinner.style.display = 'inline-block';
    successEl.style.display = 'none';
    errorEl.style.display = 'none';

    const formData = new FormData(contactForm);
    const payload = {
      first_name: formData.get('firstName'),
      last_name: formData.get('lastName'),
      email: formData.get('email'),
      phone: formData.get('phone') || null,
      interest: formData.get('interest'),
      message: formData.get('message') || null,
      source: 'contact_form',
      submitted_at: new Date().toISOString()
    };

    try {
      // 1. Send to Formspree
      const res = await fetch(contactForm.action, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' }
      });

      if (res.ok) {
        // 2. Save to Supabase
        await saveToSupabase('leads', payload);
        contactForm.reset();
        successEl.style.display = 'flex';
        text.textContent = 'Send Message';
        spinner.style.display = 'none';
        btn.disabled = false;
      } else {
        throw new Error('Formspree error');
      }
    } catch (err) {
      errorEl.style.display = 'flex';
      text.textContent = 'Send Message';
      spinner.style.display = 'none';
      btn.disabled = false;
    }
  });
}

/* ────────────────────────────────────────
   MODAL FORM — Formspree + Supabase
────────────────────────────────────────── */
const modalForm = document.getElementById('modalForm');
if (modalForm) {
  modalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('modalSubmitBtn');
    const text = document.getElementById('modalSubmitText');
    const spinner = document.getElementById('modalSpinner');
    const successEl = document.getElementById('modalSuccess');

    btn.disabled = true;
    text.textContent = 'Confirming…';
    spinner.style.display = 'inline-block';
    successEl.style.display = 'none';

    const formData = new FormData(modalForm);
    const payload = {
      first_name: formData.get('firstName'),
      last_name: formData.get('lastName'),
      email: formData.get('email'),
      phone: formData.get('phone') || null,
      interest: formData.get('plan'),
      source: 'membership_modal',
      submitted_at: new Date().toISOString()
    };

    try {
      const res = await fetch(modalForm.action, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' }
      });

      if (res.ok) {
        await saveToSupabase('leads', payload);
        modalForm.reset();
        successEl.style.display = 'flex';
        btn.style.display = 'none';
        text.textContent = 'Confirm Membership';
        spinner.style.display = 'none';
      } else {
        throw new Error('Formspree error');
      }
    } catch (err) {
      text.textContent = 'Try Again';
      spinner.style.display = 'none';
      btn.disabled = false;
    }
  });
}

/* ── Pre-fill contact form plan from URL hash ── */
window.addEventListener('hashchange', () => {
  if (window.location.hash === '#contact') {
    const planSelect = document.getElementById('plan');
    if (planSelect && window._selectedPlan) {
      planSelect.value = window._selectedPlan;
    }
  }
});