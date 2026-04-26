'use strict';

const CONFIG = {
  formspreeEndpoint: 'https://formspree.io/f/mwvabvov',
  whatsappNumber: '233558505906',
};

(function initNav() {
  const nav  = document.getElementById('mainNav');
  const btn  = document.getElementById('hamburgerBtn');
  const menu = document.getElementById('navLinks');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 36);
  }, { passive: true });
  if (btn && menu) {
    btn.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', isOpen);
    });
    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        menu.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      });
    });
  }
})();

(function initAccordion() {
  const items = document.querySelectorAll('.accordion-item');
  if (!items.length) return;
  items.forEach(item => {
    const trigger = item.querySelector('.accordion-trigger');
    if (!trigger) return;
    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      items.forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
})();

(function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(el => observer.observe(el));
})();

(function initForm() {
  const form      = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitBtn');
  const labelEl   = document.getElementById('submitLabel');
  const successEl = document.getElementById('formSuccess');
  const errorEl   = document.getElementById('formError');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.classList.add('loading');
    labelEl.textContent = 'Sending...';
    submitBtn.querySelector('i').className = 'fa-solid fa-spinner fa-spin';
    errorEl.style.display   = 'none';
    successEl.style.display = 'none';
    try {
      const res = await fetch(CONFIG.formspreeEndpoint, {
        method: 'POST', body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        form.querySelectorAll('.form-row,.form-group,#submitBtn,.form-error')
            .forEach(el => el.style.display = 'none');
        successEl.style.display = 'block';
      } else {
        const json = await res.json().catch(() => ({}));
        const msg = Array.isArray(json.errors)
          ? json.errors.map(err => err.message).join(' | ')
          : 'Something went wrong. Please try again.';
        showError(msg);
      }
    } catch { showError('Network error. Please check your connection.'); }
  });
  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.style.display = 'block';
    submitBtn.classList.remove('loading');
    submitBtn.querySelector('i').className = 'fa-solid fa-paper-plane';
    labelEl.textContent = 'Send My Request';
  }
})();
