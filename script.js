/* ────────────────────────────────────────────
   script.js  –  Ahmed Shalaby Portfolio
   ──────────────────────────────────────────── */

(function () {
  'use strict';

  /* ── 0. Mobile detection ───────────────── */
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth <= 768;

  /* ── 1. Custom cursor ──────────────────── */
  const dot  = document.getElementById('cursor');
  const ring = document.getElementById('cursor-ring');

  // Hide cursor elements on mobile
  if (isMobile) {
    if (dot)  dot.style.display  = 'none';
    if (ring) ring.style.display = 'none';
    document.body.style.cursor = 'auto';
  }

  let mx = -100, my = -100;
  let rx = -100, ry = -100;

  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

  function animateCursor() {
    if (dot)  { dot.style.left  = mx + 'px'; dot.style.top  = my + 'px'; }

    // ring lerps behind
    rx += (mx - rx) * .14;
    ry += (my - ry) * .14;
    if (ring) { ring.style.left = rx + 'px'; ring.style.top = ry + 'px'; }

    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  /* ── 2. Cursor trail ───────────────────── */
  const TRAIL = 14;
  const trailDots = [];
  const trailPos  = Array.from({length: TRAIL}, () => ({ x: -100, y: -100 }));
  const COLORS_DARK  = ['#00ff88','#00d4ff','#ff0066','#ffea00'];
  const COLORS_LIGHT = ['#00875a','#0070a8','#cc0052','#b8860b'];

  for (let i = 0; i < TRAIL; i++) {
    const d = document.createElement('div');
    d.className = 'trail-dot';
    const size = Math.max(2, 6 - i * .35) + 'px';
    d.style.cssText = `width:${size};height:${size};opacity:${(1 - i / TRAIL).toFixed(2)};`;
    document.body.appendChild(d);
    trailDots.push(d);
  }

  function updateTrailColors() {
    const isLight = document.body.classList.contains('light-mode');
    const colors = isLight ? COLORS_LIGHT : COLORS_DARK;
    trailDots.forEach((d, i) => {
      d.style.background = colors[i % colors.length];
    });
  }
  updateTrailColors();

  (function animateTrail() {
    trailPos[0].x = mx; trailPos[0].y = my;
    for (let i = 1; i < TRAIL; i++) {
      trailPos[i].x += (trailPos[i-1].x - trailPos[i].x) * .35;
      trailPos[i].y += (trailPos[i-1].y - trailPos[i].y) * .35;
    }
    trailDots.forEach((d, i) => {
      d.style.left = trailPos[i].x + 'px';
      d.style.top  = trailPos[i].y + 'px';
    });
    requestAnimationFrame(animateTrail);
  })();

  /* ── 3. Particle canvas ────────────────── */
  const canvas = document.getElementById('bg-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let W, H, particles = [];

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const PARTICLE_COUNT = 90;

    class Particle {
      constructor() { this.reset(true); }
      reset(initial = false) {
        this.x  = Math.random() * W;
        this.y  = initial ? Math.random() * H : H + 10;
        this.vx = (Math.random() - .5) * .3;
        this.vy = -(Math.random() * .6 + .2);
        this.size = Math.random() * 1.5 + .3;
        this.alpha = Math.random() * .5 + .1;
        this.life = 1;
        this.updateColor();
      }
      updateColor() {
        const isLight = document.body.classList.contains('light-mode');
        this.color = isLight
          ? ['#00875a','#0070a8','#cc0052'][Math.floor(Math.random()*3)]
          : ['#00ff88','#00d4ff','#ff0066'][Math.floor(Math.random()*3)];
      }
      update() {
        this.x += this.vx + (mx - W/2) * .00012;
        this.y += this.vy;
        this.life -= .003;
        if (this.y < -10 || this.life <= 0) {
          this.reset();
        }
      }
      draw() {
        const isLight = document.body.classList.contains('light-mode');
        ctx.save();
        ctx.globalAlpha = isLight ? this.alpha * this.life * 0.5 : this.alpha * this.life;
        ctx.fillStyle   = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur  = isLight ? 3 : 6;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    particles = Array.from({length: PARTICLE_COUNT}, () => new Particle());

    /* connect nearby particles */
    function drawLines() {
      const isLight = document.body.classList.contains('light-mode');
      for (let i = 0; i < particles.length; i++) {
        for (let j = i+1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 120) {
            ctx.save();
            ctx.globalAlpha = (1 - dist/120) * (isLight ? 0.04 : 0.07);
            ctx.strokeStyle = isLight ? '#0070a8' : '#00d4ff';
            ctx.lineWidth   = .5;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
            ctx.restore();
          }
        }
      }
    }

    (function animateParticles() {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => { p.update(); p.draw(); });
      drawLines();
      requestAnimationFrame(animateParticles);
    })();
  }

  /* ── 4. Intersection observer (scroll in) ── */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('show'); }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.hidden').forEach(el => observer.observe(el));

  /* ── 5. Typewriter for h2 role ─────────── */
  const roleEl = document.querySelector('.hero-text h2');
  if (roleEl) {
    const text = roleEl.dataset.text || roleEl.textContent.trim();
    roleEl.textContent = '';
    roleEl.style.cssText = 'border-right:2px solid var(--neon-green); padding-right:4px; display:inline-block;';

    let idx = 0;
    function type() {
      if (idx < text.length) {
        roleEl.textContent += text[idx++];
        setTimeout(type, idx === 1 ? 800 : 75 + Math.random() * 40);
      } else {
        let v = true;
        setInterval(() => {
          roleEl.style.borderRightColor = (v = !v) ? 'var(--neon-green)' : 'transparent';
        }, 530);
      }
    }
    setTimeout(type, 1200);
  }

  /* ── 6. Active nav on scroll ───────────── */
  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('nav ul li a');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 220) current = s.getAttribute('id');
    });
    navLinks.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });
  }, { passive: true });

  /* ── 7. Magnetic buttons ───────────────── */
  document.querySelectorAll('.btn, .contact-item').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r  = btn.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top  + r.height / 2;
      const dx = (e.clientX - cx) * .22;
      const dy = (e.clientY - cy) * .22;
      btn.style.transform = `translate(${dx}px,${dy}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });

  /* ── 8. Random page-level glitch flash ─── */
  function randomGlitch() {
    const isLight = document.body.classList.contains('light-mode');
    if (!isLight) {
      const body = document.body;
      body.style.transition = 'none';
      body.style.filter = 'hue-rotate(90deg) saturate(2) brightness(1.2)';
      setTimeout(() => { body.style.filter = ''; }, 60);
      setTimeout(() => {
        body.style.transform = 'translate(-3px,1px)';
        setTimeout(() => { body.style.transform = ''; }, 40);
      }, 30);
    }
    setTimeout(randomGlitch, 8000 + Math.random() * 12000);
  }
  setTimeout(randomGlitch, 5000);

  /* ── 9. Project card tilt ──────────────── */
  document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const x  = (e.clientX - r.left) / r.width  - .5;
      const y  = (e.clientY - r.top)  / r.height - .5;
      card.style.transform = `translateY(-8px) rotateX(${(-y*8).toFixed(1)}deg) rotateY(${(x*8).toFixed(1)}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

})();


/* ── Theme Toggle ───────────────────── */
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = themeToggle ? themeToggle.querySelector('i') : null;

const savedTheme = localStorage.getItem('portfolio-theme');
if (savedTheme === 'light') {
  document.body.classList.add('light-mode');
  if (themeIcon) {
    themeIcon.classList.remove('fa-moon');
    themeIcon.classList.add('fa-sun');
  }
}

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('portfolio-theme', isLight ? 'light' : 'dark');

    if (themeIcon) {
      themeIcon.classList.toggle('fa-moon', !isLight);
      themeIcon.classList.toggle('fa-sun', isLight);
    }
  });
}