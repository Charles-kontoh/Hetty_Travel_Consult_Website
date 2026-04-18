/* ═══════════════════════════════════════════════════════
   HETTY TRAVEL & CONSULTING  ·  main.js
   ═══════════════════════════════════════════════════════
   Sections:
     1. CONFIG            — update before deploying
     2. NAVIGATION        — scroll shadow + hamburger
     3. FAQ ACCORDION     — smooth open/close
     4. SCROLL REVEAL     — IntersectionObserver
     5. FORMSPREE FORM    — fetch() submission
     6. WORLD GLOBE       — Three.js + canvas world map
   ═══════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────────
   1. CONFIG  —  EDIT THESE BEFORE GOING LIVE
───────────────────────────────────────────────────── */
const CONFIG = {
  /**
   * Formspree endpoint
   * Steps:
   *   1. Create a free account at https://formspree.io
   *   2. Click "New Form" → choose "AJAX" submission
   *   3. Copy the endpoint URL (e.g. https://formspree.io/f/xabc1234)
   *   4. Paste it below, replacing YOUR_FORM_ID
   */
  formspreeEndpoint: 'https://formspree.io/f/mwvabvov',

  /**
   * WhatsApp number (international format, no "+", no spaces)
   * Example Ghana number: 233241234567
   */
  whatsappNumber: '233558505906',
};

/* ─────────────────────────────────────────────────────
   2. NAVIGATION
───────────────────────────────────────────────────── */
(function initNav() {
  const nav  = document.getElementById('mainNav');
  const btn  = document.getElementById('hamburgerBtn');
  const menu = document.getElementById('navLinks');

  // Shadow on scroll
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 36);
  }, { passive: true });

  // Hamburger toggle
  if (btn && menu) {
    btn.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', isOpen);
    });

    // Close menu when a link is clicked
    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        menu.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      });
    });
  }
})();

/* ─────────────────────────────────────────────────────
   3. FAQ ACCORDION  (smooth max-height animation)
───────────────────────────────────────────────────── */
(function initAccordion() {
  const items = document.querySelectorAll('.accordion-item');
  if (!items.length) return;

  items.forEach(item => {
    const trigger = item.querySelector('.accordion-trigger');
    if (!trigger) return;

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // Close all
      items.forEach(i => i.classList.remove('open'));

      // Open clicked (if it was closed)
      if (!isOpen) item.classList.add('open');
    });
  });
})();

/* ─────────────────────────────────────────────────────
   4. SCROLL REVEAL
───────────────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────────────
   5. FORMSPREE FORM SUBMISSION
───────────────────────────────────────────────────── */
(function initForm() {
  const form       = document.getElementById('contactForm');
  const submitBtn  = document.getElementById('submitBtn');
  const labelEl    = document.getElementById('submitLabel');
  const successEl  = document.getElementById('formSuccess');
  const errorEl    = document.getElementById('formError');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // --- Loading state ---
    submitBtn.classList.add('loading');
    labelEl.textContent = 'Sending…';
    submitBtn.querySelector('i').className = 'fa-solid fa-spinner fa-spin';
    errorEl.style.display  = 'none';
    successEl.style.display = 'none';

    try {
      const res = await fetch(CONFIG.formspreeEndpoint, {
        method:  'POST',
        body:    new FormData(form),
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        // --- Success ---
        // Hide all form fields and the submit button
        form.querySelectorAll(
          '.form-row, .form-group, #submitBtn, .form-error'
        ).forEach(el => el.style.display = 'none');
        successEl.style.display = 'block';
      } else {
        // --- API error ---
        const json = await res.json().catch(() => ({}));
        const msg  = Array.isArray(json.errors)
          ? json.errors.map(err => err.message).join(' · ')
          : 'Something went wrong. Please try again or contact us directly.';
        showError(msg);
      }
    } catch {
      showError('Network error — please check your connection and try again.');
    }
  });

  function showError(msg) {
    errorEl.textContent   = msg;
    errorEl.style.display = 'block';
    submitBtn.classList.remove('loading');
    submitBtn.querySelector('i').className = 'fa-solid fa-paper-plane';
    labelEl.textContent = 'Send My Request';
  }
})();

/* ─────────────────────────────────────────────────────
   6. THREE.JS WORLD GLOBE  with real world-map texture
───────────────────────────────────────────────────── */
(function initGlobe() {
  const wrap = document.getElementById('globeWrap');
  if (!wrap) return;

  /* Dynamically load Three.js r128 from CDN */
  const script = document.createElement('script');
  script.src   = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  script.onload  = buildGlobe;
  script.onerror = () => console.warn('Hetty Globe: Three.js failed to load.');
  document.head.appendChild(script);

  /* ── Build everything after Three.js loads ── */
  function buildGlobe() {
    const W = wrap.clientWidth  || 580;
    const H = wrap.clientHeight || 580;

    /* Renderer */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    wrap.appendChild(renderer.domElement);

    /* Scene + Camera */
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 100);
    camera.position.z = 2.5;

    /* ── World-map canvas texture ── */
    const mapTex = new THREE.CanvasTexture(buildWorldMapCanvas());

    /* Globe mesh */
    const globeGeo = new THREE.SphereGeometry(1, 72, 72);
    const globeMat = new THREE.MeshPhongMaterial({
      map:         mapTex,
      specular:    new THREE.Color(0x334466),
      shininess:   14,
      transparent: true,
      opacity:     0.97,
    });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    scene.add(globe);

    /* Atmosphere shell */
    const atmoGeo = new THREE.SphereGeometry(1.025, 64, 64);
    const atmoMat = new THREE.MeshPhongMaterial({
      color: new THREE.Color(0x1a3a6e),
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
    });
    scene.add(new THREE.Mesh(atmoGeo, atmoMat));

    /* Outer glow ring */
    const ringGeo = new THREE.TorusGeometry(1.1, 0.006, 16, 128);
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0xC9A84C),
      transparent: true, opacity: 0.3,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.2;
    scene.add(ring);

    /* Lights */
    scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    const sunLight = new THREE.DirectionalLight(0xfff4e0, 1.15);
    sunLight.position.set(5, 3, 4);
    scene.add(sunLight);
    const rimLight = new THREE.DirectionalLight(0xC9A84C, 0.22);
    rimLight.position.set(-4, -2, -3);
    scene.add(rimLight);

    /* Animation loop */
    let prev = 0;
    (function animate(t) {
      requestAnimationFrame(animate);
      const dt = t - prev; prev = t;
      globe.rotation.y += 0.00016 * dt;
      ring.rotation.z  -= 0.00007 * dt;
      renderer.render(scene, camera);
    })(0);

    /* Handle resize */
    const ro = new ResizeObserver(() => {
      const nW = wrap.clientWidth;
      const nH = wrap.clientHeight;
      if (!nW || !nH) return;
      renderer.setSize(nW, nH);
      camera.aspect = nW / nH;
      camera.updateProjectionMatrix();
    });
    ro.observe(wrap);
  }

  /* ══════════════════════════════════════════════════
     Build a 2048×1024 equirectangular world-map canvas
     Ocean: dark navy  |  Land: mid-navy  |  Grid: gold
     Continent outlines are drawn as closed polygons in
     lon/lat space mapped to pixel space.
  ══════════════════════════════════════════════════ */
  function buildWorldMapCanvas() {
    const W = 2048, H = 1024;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');

    /* ── Ocean background ── */
    const ocean = ctx.createLinearGradient(0, 0, 0, H);
    ocean.addColorStop(0,   '#0c2040');
    ocean.addColorStop(0.5, '#0B1D3A');
    ocean.addColorStop(1,   '#081428');
    ctx.fillStyle = ocean;
    ctx.fillRect(0, 0, W, H);

    /* ── Latitude / longitude grid ── */
    ctx.strokeStyle = 'rgba(201,168,76,0.07)';
    ctx.lineWidth   = 0.9;
    // Parallels
    for (let lat = -80; lat <= 80; lat += 20) {
      const y = latToY(lat);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    // Meridians
    for (let lon = -180; lon <= 180; lon += 30) {
      const x = lonToX(lon);
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }

    /* Equator & Prime Meridian — slightly more visible */
    ctx.strokeStyle = 'rgba(201,168,76,0.14)';
    ctx.lineWidth   = 1.2;
    const eqY = latToY(0), pmX = lonToX(0);
    ctx.beginPath(); ctx.moveTo(0, eqY); ctx.lineTo(W, eqY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pmX, 0); ctx.lineTo(pmX, H); ctx.stroke();

    /* ── Land style ── */
    ctx.fillStyle   = '#1a3a6c';
    ctx.strokeStyle = 'rgba(201,168,76,0.6)';
    ctx.lineWidth   = 1.4;

    /* ── Draw continent polygons ── */
    // Each array is [lon, lat] pairs (equirectangular)

    // NORTH AMERICA (mainland)
    land([
      [-168,72],[-155,72],[-140,70],[-130,68],[-120,68],
      [-105,74],[-90,75],[-80,73],[-72,68],[-64,48],
      [-53,47],[-56,44],[-70,44],[-75,35],[-80,25],
      [-87,17],[-83,10],[-78,9],[-78,8],[-77,8],
      [-83,10],[-88,15],[-92,18],[-95,22],[-100,22],
      [-105,23],[-110,24],[-115,30],[-120,34],[-124,40],
      [-124,48],[-130,55],[-140,59],[-150,61],[-155,59],
      [-160,65],[-166,68],[-168,72],
    ]);

    // GREENLAND
    land([
      [-44,84],[-30,83],[-18,77],[-18,70],[-24,65],
      [-34,64],[-42,65],[-50,68],[-56,77],[-44,84],
    ]);

    // ALASKA
    land([
      [-168,72],[-160,65],[-152,60],[-148,60],[-142,58],
      [-136,58],[-132,56],[-130,56],[-132,60],[-140,62],
      [-148,64],[-155,62],[-162,65],[-166,68],[-168,72],
    ]);

    // SOUTH AMERICA
    land([
      [-80,10],[-75,12],[-63,12],[-52,5],[-50,2],
      [-46,-1],[-40,-5],[-36,-8],[-35,-14],[-40,-22],
      [-43,-23],[-48,-28],[-52,-33],[-57,-38],[-64,-44],
      [-68,-54],[-74,-50],[-72,-44],[-70,-36],[-72,-30],
      [-70,-20],[-76,-12],[-80,0],[-80,10],
    ]);

    // EUROPE (western & central)
    land([
      [-10,36],[0,36],[10,38],[18,40],[24,38],[30,42],
      [32,47],[28,55],[22,58],[16,58],[10,56],[8,48],
      [2,46],[0,43],[-5,44],[-9,39],[-10,36],
    ]);

    // SCANDINAVIA + FINLAND
    land([
      [5,58],[10,56],[18,56],[24,60],[28,65],[28,72],
      [22,72],[18,70],[14,68],[8,64],[5,58],
    ]);

    // ICELAND
    land([[-24,63],[-14,63],[-14,66],[-20,66],[-24,65],[-24,63]]);

    // BRITISH ISLES (simplified)
    land([[-5,50],[2,51],[2,53],[-2,58],[-6,58],[-8,54],[-5,51],[-5,50]]);

    // IBERIAN PENINSULA
    land([[-9,36],[-1,36],[3,40],[0,44],[-4,44],[-9,39],[-9,36]]);

    // ITALY
    land([[8,44],[14,44],[18,40],[16,38],[16,37],[12,36],[8,38],[8,44]]);

    // AFRICA
    land([
      [-18,16],[-16,10],[-14,5],[-8,5],[0,5],
      [8,4],[12,2],[18,-1],[24,-5],[32,-5],
      [38,0],[42,5],[44,12],[44,20],[40,26],
      [36,30],[32,32],[26,32],[20,38],[14,36],
      [8,38],[0,36],[-4,36],[-10,28],[-16,20],[-18,16],
    ]);

    // MADAGASCAR
    land([[44,-12],[48,-12],[50,-16],[48,-24],[44,-24],[44,-18],[44,-12]]);

    // ASIA (main Eurasian block)
    land([
      [26,72],[40,73],[60,75],[80,76],[100,72],[120,72],[140,72],
      [144,62],[142,52],[138,42],[133,36],[128,28],[120,22],
      [110,16],[100,6],[96,4],[90,22],[84,28],[76,22],
      [66,22],[56,25],[48,28],[40,38],[36,42],[28,46],
      [26,52],[26,72],
    ]);

    // ARABIAN PENINSULA
    land([[36,30],[56,24],[58,22],[56,12],[44,12],[38,15],[36,22],[36,30]]);

    // INDIAN SUBCONTINENT
    land([[66,24],[70,22],[74,20],[76,14],[78,10],[80,8],[82,10],[86,20],[88,24],[84,28],[76,30],[72,26],[66,24]]);

    // SOUTHEAST ASIA (mainland)
    land([[96,24],[100,20],[104,14],[108,10],[110,2],[100,2],[96,6],[94,18],[96,24]]);

    // MALAY PENINSULA
    land([[100,6],[104,2],[104,4],[102,6],[100,6]]);

    // BORNEO
    land([[108,2],[118,6],[118,2],[114,-2],[108,-2],[108,2]]);

    // SUMATRA
    land([[96,4],[106,-6],[104,-6],[96,0],[96,4]]);

    // JAVA
    land([[106,-6],[114,-8],[112,-8],[106,-7],[106,-6]]);

    // SULAWESI (simplified)
    land([[120,2],[124,2],[124,-2],[122,-4],[120,0],[120,2]]);

    // NEW GUINEA
    land([[131,-2],[148,-6],[148,-8],[140,-8],[132,-6],[131,-2]]);

    // JAPAN (Honshu)
    land([[130,32],[135,34],[138,36],[142,38],[142,42],[140,44],[136,40],[132,34],[130,32]]);

    // JAPAN (Hokkaido)
    land([[140,42],[146,44],[144,44],[142,44],[140,42]]);

    // KOREA
    land([[126,34],[130,34],[128,38],[126,38],[126,34]]);

    // TAIWAN
    land([[120,22],[122,24],[120,24],[120,22]]);

    // SRI LANKA
    land([[80,6],[82,8],[80,10],[80,6]]);

    // PHILIPPINES (Luzon)
    land([[120,14],[124,16],[122,18],[120,16],[120,14]]);

    // AUSTRALIA
    land([
      [114,-22],[116,-20],[122,-18],[128,-14],[132,-12],[136,-12],
      [140,-14],[144,-18],[148,-20],[152,-24],[152,-32],
      [148,-38],[144,-38],[140,-36],[136,-34],[130,-34],
      [124,-34],[118,-32],[114,-26],[114,-22],
    ]);

    // TASMANIA
    land([[144,-40],[148,-40],[148,-44],[144,-44],[144,-40]]);

    // NEW ZEALAND (North Island)
    land([[172,-36],[178,-38],[176,-42],[172,-40],[172,-36]]);

    // NEW ZEALAND (South Island)
    land([[168,-44],[174,-44],[172,-47],[168,-46],[168,-44]]);

    // CUBA
    land([[-84,22],[-74,20],[-74,22],[-82,24],[-84,22]]);

    // HISPANIOLA
    land([[-74,18],[-70,18],[-70,20],[-74,20],[-74,18]]);

    /* ── Antarctica strip ── */
    ctx.fillStyle = 'rgba(180,210,240,0.1)';
    ctx.fillRect(0, H * 0.91, W, H * 0.09);

    /* ── Subtle radial highlight (specular effect) ── */
    const hl = ctx.createRadialGradient(W*0.28, H*0.26, 0, W*0.32, H*0.3, W * 0.38);
    hl.addColorStop(0, 'rgba(201,168,76,0.07)');
    hl.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = hl;
    ctx.fillRect(0, 0, W, H);

    return c;

    /* ── helpers ── */
    function lonToX(lon) { return ((lon + 180) / 360) * W; }
    function latToY(lat) { return ((90  - lat) / 180) * H; }

    function land(coords) {
      if (!coords.length) return;
      ctx.beginPath();
      ctx.moveTo(lonToX(coords[0][0]), latToY(coords[0][1]));
      for (let i = 1; i < coords.length; i++) {
        ctx.lineTo(lonToX(coords[i][0]), latToY(coords[i][1]));
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }
})();
