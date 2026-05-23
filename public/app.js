// Animate counter on load
function animateCounter(el, target, duration) {
  let start = 0;
  const step = Math.ceil(target / (duration / 50));
  const timer = setInterval(() => {
    start += step;
    if (start >= target) { start = target; clearInterval(timer); }
    el.textContent = start.toLocaleString() + '+';
  }, 50);
}

// Fetch current sign-up count
async function loadCount() {
  try {
    const res = await fetch('/api/count');
    if (res.ok) {
      const { count } = await res.json();
      const el = document.getElementById('counter');
      if (el && count > 0) animateCounter(el, count, 1200);
      else if (el) el.textContent = '0+';
    }
  } catch {
    const el = document.getElementById('counter');
    if (el) el.textContent = '0+';
  }
}

// Navbar scroll effect
window.addEventListener('scroll', () => {
  const nav = document.querySelector('.navbar');
  nav.style.boxShadow = window.scrollY > 20
    ? '0 4px 30px rgba(19,54,141,0.15)'
    : '0 2px 20px rgba(19,54,141,0.07)';
});

// Intersection observer for fade-in
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.problem-card, .offer-card, .trust-item, .solution-text, .solution-visual')
  .forEach(el => {
    el.classList.add('fade-in');
    observer.observe(el);
  });

// Inject fade-in styles
const style = document.createElement('style');
style.textContent = `
  .fade-in { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
  .fade-in.visible { opacity: 1; transform: translateY(0); }
`;
document.head.appendChild(style);

// Form submission
document.getElementById('waitlistForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const btn = document.getElementById('submitBtn');
  const btnText = document.getElementById('btnText');
  const spinner = document.getElementById('btnSpinner');
  const msg = document.getElementById('formMsg');

  // Collect services checkboxes
  const services = [...form.querySelectorAll('input[name="services"]:checked')].map(c => c.value);
  const wouldPay = form.querySelector('input[name="wouldPay"]:checked')?.value || '';

  const payload = {
    fullName: form.fullName.value.trim(),
    email: form.email.value.trim(),
    location: form.location.value.trim(),
    customerType: form.customerType.value,
    services,
    wouldPay,
    wantToBeSteper: form.wantToBeSteper.checked,
  };

  if (!payload.fullName || !payload.email) {
    showMsg(msg, 'Please fill in your name and email.', 'error');
    return;
  }

  // Loading state
  btn.disabled = true;
  btnText.classList.add('hidden');
  spinner.classList.remove('hidden');
  msg.classList.add('hidden');

  try {
    const res = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (res.ok) {
      showMsg(msg, '🎉 ' + data.message, 'success');
      form.reset();
      loadCount();
    } else {
      showMsg(msg, data.error || 'Something went wrong. Please try again.', 'error');
    }
  } catch {
    showMsg(msg, 'Network error. Please check your connection and try again.', 'error');
  } finally {
    btn.disabled = false;
    btnText.classList.remove('hidden');
    spinner.classList.add('hidden');
  }
});

function showMsg(el, text, type) {
  el.textContent = text;
  el.className = 'form-message ' + type;
  el.classList.remove('hidden');
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Init
loadCount();
