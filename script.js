// Mobile menu toggle
const menuBtn = document.querySelector('.menu-btn');
const navLinks = document.getElementById('navLinks');
if (menuBtn && navLinks) {
  menuBtn.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
  });
}

// Contact form -> Node API (POST /api/contact)
// If the frontend is hosted separately (GitHub Pages/Netlify), set this to your
// Node server URL, e.g. 'https://zaina-boutique.onrender.com'. Empty = same origin.
const API_BASE = '';

const form = document.getElementById('contactForm');
if (form) {
  const msg = document.getElementById('formMsg');
  const btn = form.querySelector('button[type="submit"]');

  // Pre-fill subject when arriving from a "Book Now" button (?service=...)
  const service = new URLSearchParams(location.search).get('service');
  if (service) form.subject.value = service.slice(0, 120);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.className = 'form-msg';
    msg.textContent = 'Sending…';
    btn.disabled = true;
    try {
      const res = await fetch(API_BASE + '/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form)))
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      msg.classList.add('ok');
      msg.textContent = 'Thank you, ' + form.name.value + '! We will contact you soon.';
      form.reset();
    } catch (err) {
      msg.classList.add('err');
      msg.textContent = err.message === 'Failed to fetch'
        ? 'Could not reach the server. Please call us on 0300 1234567.'
        : err.message;
    } finally {
      btn.disabled = false;
    }
  });
}
