// VIDIT UNIVERSE — Main Engine & Interaction Controller
import { UNIVERSE_DATA } from './data.js';
import { sound } from './audio.js';

class UniverseEngine {
  constructor() {
    this.canvas = document.getElementById('space-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.landingCanvas = document.getElementById('landing-canvas');
    this.landingCtx = this.landingCanvas ? this.landingCanvas.getContext('2d') : null;
    this.landingAurora = document.getElementById('landing-aurora');
    this.svg = document.getElementById('constellation-svg');
    this.spatialWorld = document.getElementById('spatial-world');
    this.planetsContainer = document.getElementById('planets-container');
    this.experimentalContainer = document.getElementById('experimental-container');
    this.constellationNodesLayer = document.getElementById('constellation-nodes-layer');
    this.radarBlips = document.getElementById('radar-blips');

    // Engine States
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.isEntered = false;
    this.gravityMode = false;
    this.traceMode = false;
    this.activeFilter = 'all';
    this.selectedPlanet = null;
    this.activeTech = null;
    this.currentStatusText = 'SIGNAL : ONLINE';

    // Status Pill Elements
    this.statusPill = document.getElementById('hud-status-pill');
    this.statusTextEl = document.getElementById('status-pill-text');
    this.statusDotEl = document.getElementById('status-pulse-dot');

    // Physics & Camera
    this.camera = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      scale: 1,
      targetScale: 1
    };

    this.mouse = {
      x: this.width / 2,
      y: this.height / 2,
      worldX: 0,
      worldY: 0,
      isDown: false,
      dragStartX: 0,
      dragStartY: 0
    };

    // Stars & Particles
    this.stars = [];
    this.dustParticles = [];
    this.landingParticles = [];
    this.planets = [];
    this.experimental = [];
    this.constellations = [];

    // Custom Cursor Elements
    this.cursorDot = document.getElementById('cursor-dot');
    this.cursorRing = document.getElementById('cursor-ring');
    this.cursorRingPos = { x: this.width / 2, y: this.height / 2 };

    this.init();
  }

  // Dynamic Status Pill Method
  setStatus(text, type = 'normal') {
    if (!this.statusTextEl) return;
    this.statusTextEl.style.opacity = '0';
    this.statusTextEl.style.transform = 'translateY(-3px)';
    
    setTimeout(() => {
      this.statusTextEl.textContent = text;
      this.statusTextEl.style.opacity = '1';
      this.statusTextEl.style.transform = 'translateY(0)';

      if (this.statusDotEl) {
        if (text.startsWith('TARGET :')) {
          this.statusDotEl.style.background = 'var(--accent-purple)';
          this.statusDotEl.style.boxShadow = '0 0 10px var(--accent-purple)';
        } else if (text === 'TRACE : ACTIVE') {
          this.statusDotEl.style.background = 'var(--accent-cyan)';
          this.statusDotEl.style.boxShadow = '0 0 12px var(--accent-cyan)';
        } else if (text.startsWith('MODE :')) {
          this.statusDotEl.style.background = 'var(--accent-pink)';
          this.statusDotEl.style.boxShadow = '0 0 10px var(--accent-pink)';
        } else {
          this.statusDotEl.style.background = 'var(--accent-emerald)';
          this.statusDotEl.style.boxShadow = '0 0 8px var(--accent-emerald)';
        }
      }
    }, 120);
  }

  resetStatus() {
    if (this.traceMode) {
      this.setStatus('TRACE : ACTIVE');
    } else {
      this.setStatus('SIGNAL : ONLINE');
    }
  }

  init() {
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());

    this.generateStarfield();
    this.mountPlanets();
    this.mountExperimental();
    this.mountConstellations();
    this.mountRadar();
    this.mountRecruiterModeProjects();

    this.bindEvents();
    this.bindModalEvents();
    this.startLoop();
  }

  handleResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * window.devicePixelRatio;
    this.canvas.height = this.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    if (this.landingCanvas && this.landingCtx) {
      this.landingCanvas.width = this.width * window.devicePixelRatio;
      this.landingCanvas.height = this.height * window.devicePixelRatio;
      this.landingCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    this.generateStarfield();
  }

  generateStarfield() {
    this.stars = [];
    const starCount = Math.floor((this.width * this.height) / 2800);

    for (let i = 0; i < starCount; i++) {
      this.stars.push({
        x: (Math.random() - 0.5) * 3600,
        y: (Math.random() - 0.5) * 3600,
        size: Math.random() * 1.8 + 0.3,
        alpha: Math.random() * 0.75 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinkleOffset: Math.random() * Math.PI * 2,
        layer: Math.random() * 0.7 + 0.2
      });
    }

    // Cosmic Dust Nebulae
    this.dustParticles = [];
    for (let i = 0; i < 40; i++) {
      this.dustParticles.push({
        x: (Math.random() - 0.5) * 2600,
        y: (Math.random() - 0.5) * 2600,
        radius: Math.random() * 220 + 90,
        color: i % 2 === 0 ? 'rgba(139, 92, 246, 0.035)' : 'rgba(6, 182, 212, 0.03)'
      });
    }

    // Landing Screen Stardust Particles
    this.landingParticles = [];
    for (let i = 0; i < 70; i++) {
      this.landingParticles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35 - 0.15,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.7 + 0.2,
        pulseSpeed: Math.random() * 0.03 + 0.01,
        color: i % 3 === 0 ? '#a855f7' : (i % 3 === 1 ? '#06b6d4' : '#ffffff')
      });
    }
  }

  // Unique visual structure generator for each planet
  getPlanetVisualContent(id) {
    switch (id) {
      case 'roleflow':
        // Purple orbital world, multiple structured rings, connected-system feeling
        return `
          <div class="planet-sphere sphere-roleflow"></div>
          <div class="planet-atmosphere atmosphere-roleflow"></div>
          <div class="planet-ring ring-structure-1"></div>
          <div class="planet-ring ring-structure-2"></div>
          <div class="planet-ring ring-structure-3"></div>
          <div class="planet-nodes-cluster">
            <div class="sys-satellite-node node-a"></div>
            <div class="sys-satellite-node node-b"></div>
            <div class="sys-satellite-node node-c"></div>
          </div>
        `;
      
      case 'paytodo':
        // Pink world, distinctive double-orbit crescent structure, product/escrow feeling
        return `
          <div class="planet-sphere sphere-paytodo"></div>
          <div class="planet-atmosphere atmosphere-paytodo"></div>
          <div class="crescent-shadow-rim"></div>
          <div class="crescent-orbit-ring ring-crescent-1"></div>
          <div class="crescent-orbit-ring ring-crescent-2"></div>
          <div class="escrow-bead-node"></div>
        `;

      case 'insightai':
        // Blue/violet neural world, small glowing neural nodes around core, AI intelligence feeling
        return `
          <div class="planet-sphere sphere-insightai"></div>
          <div class="planet-atmosphere atmosphere-insightai"></div>
          <div class="neural-web-mesh"></div>
          <div class="neural-synapse-ring">
            <div class="neural-node node-1"></div>
            <div class="neural-node node-2"></div>
            <div class="neural-node node-3"></div>
            <div class="neural-node node-4"></div>
          </div>
        `;

      case 'routewise':
        // Cyan world, glowing route/path lines wrapping around surface, navigation feeling
        return `
          <div class="planet-sphere sphere-routewise"></div>
          <div class="planet-atmosphere atmosphere-routewise"></div>
          <div class="route-orbit-trail route-trail-1"></div>
          <div class="route-orbit-trail route-trail-2"></div>
          <div class="route-waypoint-beacon"></div>
        `;

      case 'deployhub':
        // Teal technological core, segmented mechanical orbital rings (cgroup container plates)
        return `
          <div class="planet-sphere sphere-deployhub"></div>
          <div class="planet-atmosphere atmosphere-deployhub"></div>
          <div class="segmented-cgroup-ring cgroup-outer"></div>
          <div class="segmented-cgroup-ring cgroup-inner"></div>
          <div class="deploy-core-grid"></div>
        `;

      case 'medicura':
        // Blue medical-tech world, pulsing heartbeat-inspired orbital rhythm ring
        return `
          <div class="planet-sphere sphere-medicura"></div>
          <div class="planet-atmosphere atmosphere-medicura"></div>
          <div class="pulse-ecg-orbit-ring"></div>
          <div class="bio-beacon-core"></div>
        `;

      case 'modelforge':
        // Orange/gold molten core with rotating weight fragments
        return `
          <div class="planet-sphere sphere-modelforge"></div>
          <div class="planet-atmosphere atmosphere-modelforge"></div>
          <div class="molten-plasma-halo"></div>
          <div class="rotating-fragment-orbit">
            <div class="weight-fragment frag-1"></div>
            <div class="weight-fragment frag-2"></div>
            <div class="weight-fragment frag-3"></div>
          </div>
        `;

      default:
        return `
          <div class="planet-sphere"></div>
          <div class="planet-atmosphere"></div>
          <div class="planet-ring-disc"></div>
        `;
    }
  }

  getExperimentalVisualContent(id) {
    if (id === 'saferoute-ai') {
      // Dark/amber world, shield atmosphere, safety route trajectory
      return `
        <div class="experimental-star-core exp-saferoute">
          <div class="safety-shield-halo"></div>
          <div class="safe-trajectory-arc"></div>
          <div class="star-point star-point-safe"></div>
        </div>
      `;
    } else {
      // Helmet Detection: Red/orange technical world, radar scanning orbital sweep
      return `
        <div class="experimental-star-core exp-helmet">
          <div class="radar-scan-sweep-ring"></div>
          <div class="star-point star-point-helmet"></div>
          <div class="vision-target-reticle"></div>
        </div>
      `;
    }
  }

  mountPlanets() {
    this.planetsContainer.innerHTML = '';
    this.planets = UNIVERSE_DATA.planets.map((data) => {
      const el = document.createElement('div');
      el.className = `planet-item planet-${data.id}`;
      el.id = `planet-${data.id}`;
      el.style.setProperty('--x', `${data.coords.x}px`);
      el.style.setProperty('--y', `${data.coords.y}px`);
      el.style.setProperty('--size', `${data.radius * 2}px`);
      el.style.setProperty('--planet-color', data.color);
      el.style.setProperty('--planet-sec', data.secondaryColor);
      el.style.setProperty('--planet-glow', data.glowColor);

      el.innerHTML = `
        <div class="planet-body">
          ${this.getPlanetVisualContent(data.id)}
        </div>
        <div class="planet-hud-card">
          <span class="planet-hud-category">${data.category}</span>
          <span class="planet-hud-name">${data.name}</span>
          <p class="planet-hud-tagline">${data.tagline}</p>
          <div class="planet-hud-cta">
            <span>EXPLORE</span>
            <span>→</span>
          </div>
        </div>
      `;

      el.addEventListener('mouseenter', () => {
        sound.playHover();
        if (this.cursorRing) this.cursorRing.classList.add('cursor-hover');
        this.setStatus(`TARGET : ${data.name.toUpperCase()}`);

        // If TRACE mode is active, dynamically trace technologies
        if (this.traceMode) {
          this.tracePlanetArchitecture(data);
        }
      });

      el.addEventListener('mouseleave', () => {
        if (this.cursorRing) this.cursorRing.classList.remove('cursor-hover');
        this.resetStatus();

        if (this.traceMode && !this.activeTech) {
          this.clearTraceLinesOnly();
        }
      });

      el.addEventListener('click', () => {
        sound.playSelect();
        this.openPlanetModal(data);
      });

      this.planetsContainer.appendChild(el);

      return {
        data,
        el,
        x: data.coords.x,
        y: data.coords.y,
        baseX: data.coords.x,
        baseY: data.coords.y,
        vx: 0,
        vy: 0,
        radius: data.radius
      };
    });
  }

  mountExperimental() {
    this.experimentalContainer.innerHTML = `
      <div class="sector-boundary-tag" style="--x: 520px; --y: -300px;">
        <span class="sector-marker">// SECTOR : EXPERIMENTAL SYSTEMS</span>
      </div>
    `;

    this.experimental = UNIVERSE_DATA.experimental.map((data) => {
      const el = document.createElement('div');
      el.className = `experimental-item exp-${data.id}`;
      el.id = `exp-${data.id}`;
      el.style.setProperty('--x', `${data.coords.x}px`);
      el.style.setProperty('--y', `${data.coords.y}px`);
      el.style.setProperty('--size', `${data.radius * 2}px`);
      el.style.setProperty('--star-color', data.color);
      el.style.setProperty('--star-glow', data.glowColor);

      el.innerHTML = `
        ${this.getExperimentalVisualContent(data.id)}
        <div class="planet-hud-card">
          <span class="planet-hud-category">${data.category}</span>
          <span class="planet-hud-name">${data.name}</span>
          <p class="planet-hud-tagline">${data.tagline}</p>
          <div class="planet-hud-cta"><span>INSPECT EXP</span> <span>→</span></div>
        </div>
      `;

      el.addEventListener('mouseenter', () => {
        sound.playHover();
        if (this.cursorRing) this.cursorRing.classList.add('cursor-hover');
        this.setStatus(`TARGET : ${data.name.toUpperCase()}`);

        if (this.traceMode) {
          this.tracePlanetArchitecture(data);
        }
      });

      el.addEventListener('mouseleave', () => {
        if (this.cursorRing) this.cursorRing.classList.remove('cursor-hover');
        this.resetStatus();

        if (this.traceMode && !this.activeTech) {
          this.clearTraceLinesOnly();
        }
      });

      el.addEventListener('click', () => {
        sound.playSelect();
        this.openPlanetModal(data);
      });

      this.experimentalContainer.appendChild(el);

      return {
        data,
        el,
        x: data.coords.x,
        y: data.coords.y,
        baseX: data.coords.x,
        baseY: data.coords.y,
        vx: 0,
        vy: 0,
        radius: data.radius
      };
    });
  }

  mountConstellations() {
    this.constellationNodesLayer.innerHTML = '';
    const gridEl = document.getElementById('tech-constellation-grid');
    if (gridEl) gridEl.innerHTML = '';

    this.constellations = UNIVERSE_DATA.constellations.map((node) => {
      // Spatial star node in the universe
      const el = document.createElement('div');
      el.className = 'constellation-node';
      el.id = `constellation-${node.id}`;
      el.style.setProperty('--x', `${node.x}px`);
      el.style.setProperty('--y', `${node.y}px`);

      el.innerHTML = `
        <div class="tech-star-dot"></div>
        <span class="tech-star-label">${node.name}</span>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        sound.playSelect();
        this.selectTechnology(node);
      });

      this.constellationNodesLayer.appendChild(el);

      // Pill inside Constellations modal
      if (gridEl) {
        const pill = document.createElement('div');
        pill.className = 'tech-grid-pill';
        pill.id = `tech-pill-${node.id}`;
        pill.innerHTML = `
          <span class="tech-cat">${node.category}</span>
          <span class="tech-name">${node.name}</span>
        `;
        pill.addEventListener('click', () => {
          sound.playSelect();
          this.selectTechnology(node);
        });
        gridEl.appendChild(pill);
      }

      return {
        node,
        el,
        x: node.x,
        y: node.y
      };
    });
  }

  mountRadar() {
    if (!this.radarBlips) return;
    this.radarBlips.innerHTML = '';

    // Radar mapping scale: universe coordinate (-800 to 800) -> radar pixel (0 to 84)
    const toRadar = (coord) => 42 + (coord / 900) * 38;

    // Station blip
    const stationBlip = document.createElement('div');
    stationBlip.className = 'radar-blip';
    stationBlip.style.left = `${toRadar(0)}px`;
    stationBlip.style.top = `${toRadar(0)}px`;
    stationBlip.style.background = 'var(--accent-purple)';
    this.radarBlips.appendChild(stationBlip);

    // Planets blips
    UNIVERSE_DATA.planets.forEach((p) => {
      const blip = document.createElement('div');
      blip.className = 'radar-blip';
      blip.style.left = `${toRadar(p.coords.x)}px`;
      blip.style.top = `${toRadar(p.coords.y)}px`;
      blip.style.background = p.color;
      this.radarBlips.appendChild(blip);
    });
  }

  mountRecruiterModeProjects() {
    const listEl = document.getElementById('recruiter-projects-list');
    if (!listEl) return;

    const allProjects = [...UNIVERSE_DATA.planets, ...UNIVERSE_DATA.experimental];

    listEl.innerHTML = allProjects.map(p => `
      <div class="recruiter-proj-item">
        <div class="rec-proj-content">
          <div class="rec-proj-header">
            <span class="rec-proj-title">${p.name}</span>
            <span class="rec-proj-cat-badge">${p.category}</span>
          </div>
          <div class="rec-proj-tag">${p.tagline}</div>
          
          <div class="rec-proj-demonstrates">
            <strong class="rec-demo-lbl">WHAT THIS DEMONSTRATES:</strong>
            <span class="rec-demo-text">${p.demonstrates}</span>
          </div>

          <div class="rec-proj-stack">
            ${p.stack.map(s => `<span class="rec-stack-pill">${s}</span>`).join('')}
          </div>
        </div>
        
        <div class="recruiter-action-links">
          ${p.links.live ? `<a href="${p.links.live}" target="_blank" rel="noopener noreferrer" class="btn-briefing-action btn-highlight">Live Demo ↗</a>` : ''}
          <a href="${p.links.github}" target="_blank" rel="noopener noreferrer" class="btn-briefing-action">GitHub ↗</a>
        </div>
      </div>
    `).join('');
  }

  bindEvents() {
    // Landing Singularity Warp
    const btnEnter = document.getElementById('btn-enter-universe');
    const singularity = document.getElementById('singularity-trigger');
    const triggerEnter = () => {
      if (this.isEntered) return;
      this.isEntered = true;
      sound.playEnterWarp();
      
      const landing = document.getElementById('landing-stage');
      const universeStage = document.getElementById('universe-stage');
      
      landing.classList.add('warp-out');
      setTimeout(() => {
        landing.classList.add('hidden');
        universeStage.classList.remove('hidden');
      }, 800);
    };

    if (btnEnter) btnEnter.addEventListener('click', triggerEnter);
    if (singularity) singularity.addEventListener('click', triggerEnter);

    // Mouse Movement Tracking
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;

      // Custom Cursor Center Dot (Precisely centered)
      if (this.cursorDot) {
        this.cursorDot.style.transform = `translate3d(calc(${e.clientX}px - 50%), calc(${e.clientY}px - 50%), 0)`;
      }

      // Landing Screen Aurora Light Movement
      if (!this.isEntered && this.landingAurora) {
        this.landingAurora.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      }

      // World Space Coordinates Calculation
      const cx = this.width / 2;
      const cy = this.height / 2;
      this.mouse.worldX = (this.mouse.x - cx - this.camera.x) / this.camera.scale;
      this.mouse.worldY = (this.mouse.y - cy - this.camera.y) / this.camera.scale;

      // Update Telemetry
      const teleCoord = document.getElementById('tele-coord');
      if (teleCoord) {
        teleCoord.textContent = `X: ${Math.round(this.mouse.worldX)} Y: ${Math.round(this.mouse.worldY)}`;
      }

      // Parallax Target with extended roaming space on sides
      if (!this.mouse.isDown) {
        const nx = (e.clientX / this.width - 0.5) * 2;
        const ny = (e.clientY / this.height - 0.5) * 2;
        this.camera.targetX = -nx * 240;
        this.camera.targetY = -ny * 180;
      }
    });

    // Drag to Pan Space (Desktop & Touch)
    window.addEventListener('mousedown', (e) => {
      // Ignore clicks on HUD buttons or modals
      if (e.target.closest('.dock-hud, .top-hud, .universe-overlay, .spectrum-filter-bar')) return;
      this.mouse.isDown = true;
      this.mouse.dragStartX = e.clientX - this.camera.x;
      this.mouse.dragStartY = e.clientY - this.camera.y;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.mouse.isDown) {
        this.camera.targetX = e.clientX - this.mouse.dragStartX;
        this.camera.targetY = e.clientY - this.mouse.dragStartY;
      }
    });

    window.addEventListener('mouseup', () => {
      this.mouse.isDown = false;
    });

    // Touch Support for Mobile / Tablets
    window.addEventListener('touchstart', (e) => {
      if (e.target.closest('.dock-hud, .top-hud, .universe-overlay, .spectrum-filter-bar')) return;
      if (e.touches.length === 1) {
        this.mouse.isDown = true;
        this.mouse.dragStartX = e.touches[0].clientX - this.camera.x;
        this.mouse.dragStartY = e.touches[0].clientY - this.camera.y;
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (this.mouse.isDown && e.touches.length === 1) {
        this.camera.targetX = e.touches[0].clientX - this.mouse.dragStartX;
        this.camera.targetY = e.touches[0].clientY - this.mouse.dragStartY;
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.mouse.isDown = false;
    });

    // Wheel Zoom
    window.addEventListener('wheel', (e) => {
      if (e.target.closest('.universe-overlay')) return;
      const zoomDelta = e.deltaY * -0.001;
      this.camera.targetScale = Math.min(Math.max(this.camera.targetScale + zoomDelta, 0.5), 1.8);
    }, { passive: true });

    // HUD Actions
    // TRACE Mode Toggle (New Feature)
    const btnTrace = document.getElementById('btn-trace');
    const traceStatus = document.getElementById('trace-status');
    if (btnTrace) {
      btnTrace.addEventListener('click', () => {
        sound.playSelect();
        this.traceMode = !this.traceMode;
        if (this.traceMode) {
          btnTrace.classList.add('active');
          if (traceStatus) {
            traceStatus.textContent = 'ON';
            traceStatus.className = 'status-on';
          }
          this.setStatus('TRACE : ACTIVE');
          if (this.cursorRing) this.cursorRing.classList.add('cursor-hover');
        } else {
          btnTrace.classList.remove('active');
          if (traceStatus) {
            traceStatus.textContent = 'OFF';
            traceStatus.className = 'status-off';
          }
          this.resetStatus();
          this.clearTechnologySelection();
          if (this.cursorRing) this.cursorRing.classList.remove('cursor-hover');
        }
      });
    }

    // Gravity Toggle
    const btnGravity = document.getElementById('btn-gravity');
    const gravityStatus = document.getElementById('gravity-status');
    const teleGrav = document.getElementById('tele-grav');
    if (btnGravity) {
      btnGravity.addEventListener('click', () => {
        sound.playSelect();
        this.gravityMode = !this.gravityMode;
        if (this.gravityMode) {
          btnGravity.classList.add('active');
          if (gravityStatus) {
            gravityStatus.textContent = 'ON';
            gravityStatus.className = 'status-on';
          }
          if (teleGrav) teleGrav.textContent = '2.40 G';
          if (this.cursorRing) this.cursorRing.classList.add('cursor-grav-active');
        } else {
          btnGravity.classList.remove('active');
          if (gravityStatus) {
            gravityStatus.textContent = 'OFF';
            gravityStatus.className = 'status-off';
          }
          if (teleGrav) teleGrav.textContent = '1.00 G';
          if (this.cursorRing) this.cursorRing.classList.remove('cursor-grav-active');
          // Smoothly reset body velocities so they cleanly return to equilibrium
          [...this.planets, ...this.experimental].forEach(b => {
            b.vx = 0;
            b.vy = 0;
          });
        }
      });
    }

    // Audio Toggle
    const btnAudio = document.getElementById('btn-audio-toggle');
    const iconSoundOff = document.getElementById('icon-sound-off');
    const iconSoundOn = document.getElementById('icon-sound-on');
    if (btnAudio) {
      btnAudio.addEventListener('click', () => {
        const isEnabled = sound.toggle();
        if (isEnabled) {
          iconSoundOff.classList.add('hidden');
          iconSoundOn.classList.remove('hidden');
          btnAudio.classList.add('active');
        } else {
          iconSoundOff.classList.remove('hidden');
          iconSoundOn.classList.add('hidden');
          btnAudio.classList.remove('active');
        }
      });
    }

    // Recenter
    const btnRecenter = document.getElementById('btn-recenter');
    if (btnRecenter) {
      btnRecenter.addEventListener('click', () => {
        sound.playSelect();
        this.camera.targetX = 0;
        this.camera.targetY = 0;
        this.camera.targetScale = 1;
        this.clearTechnologySelection();
        this.resetStatus();
      });
    }

    // Filter Pills
    document.querySelectorAll('.filter-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        sound.playSelect();
        document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const filter = pill.dataset.filter;
        this.applyFilter(filter);
      });
    });

    // Central Station (Mission Control) Hover & Click
    const station = document.getElementById('central-station');
    if (station) {
      station.addEventListener('mouseenter', () => {
        sound.playHover();
        this.setStatus('TARGET : MISSION CONTROL');
      });
      station.addEventListener('mouseleave', () => {
        this.resetStatus();
      });
      station.addEventListener('click', () => {
        sound.playSelect();
        this.openModal('mission-control-modal');
      });
    }

    // Communication Satellite Hover & Click
    const satellite = document.getElementById('comm-satellite');
    if (satellite) {
      satellite.addEventListener('mouseenter', () => {
        sound.playHover();
        this.setStatus('TARGET : COMMUNICATION SATELLITE');
      });
      satellite.addEventListener('mouseleave', () => {
        this.resetStatus();
      });
      satellite.addEventListener('click', () => {
        sound.playSelect();
        this.openModal('satellite-modal');
      });
    }
  }

  // TRACE: Reveal technology nodes around planet and connect lines to related projects
  tracePlanetArchitecture(planetData) {
    if (!this.svg) return;
    this.svg.innerHTML = '';

    const planetTechs = planetData.technologies || [];
    const allTechNodes = UNIVERSE_DATA.constellations.filter(c => planetTechs.includes(c.name));

    // Highlight related constellation stars in space
    document.querySelectorAll('.constellation-node').forEach(nodeEl => {
      const id = nodeEl.id.replace('constellation-', '');
      const matched = allTechNodes.some(t => t.id === id);
      if (matched) {
        nodeEl.classList.add('highlighted');
      } else {
        nodeEl.classList.remove('highlighted');
      }
    });

    // Find all other projects sharing any of these technologies
    const connectedProjectIds = new Set();
    allTechNodes.forEach(t => {
      t.projects.forEach(pid => connectedProjectIds.add(pid));
    });

    // Highlight matching projects, dim others
    this.planets.forEach(p => {
      if (connectedProjectIds.has(p.data.id)) {
        p.el.classList.remove('dimmed');
        p.el.style.transform = `translate(calc(-50% + ${p.x}px), calc(-50% + ${p.y}px)) scale(${p.data.id === planetData.id ? '1.18' : '1.08'})`;
      } else {
        p.el.classList.add('dimmed');
        p.el.style.transform = `translate(calc(-50% + ${p.x}px), calc(-50% + ${p.y}px)) scale(1)`;
      }
    });

    // Draw connecting paths from the hovered planet to its technology stars
    allTechNodes.forEach(techNode => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const midX = (planetData.coords.x + techNode.x) / 2;
      const midY = (planetData.coords.y + techNode.y) / 2 - 25;
      const d = `M ${planetData.coords.x} ${planetData.coords.y} Q ${midX} ${midY} ${techNode.x} ${techNode.y}`;

      path.setAttribute('d', d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', planetData.color || '#a855f7');
      path.setAttribute('stroke-width', '2');
      path.setAttribute('stroke-dasharray', '5,5');
      path.setAttribute('opacity', '0.85');
      path.style.filter = `drop-shadow(0 0 8px ${planetData.glowColor || 'rgba(168,85,247,0.5)'})`;

      this.svg.appendChild(path);
    });
  }

  clearTraceLinesOnly() {
    if (this.activeTech) return;
    if (this.svg) this.svg.innerHTML = '';
    
    document.querySelectorAll('.constellation-node').forEach(nodeEl => {
      nodeEl.classList.remove('highlighted');
    });

    this.applyFilter(this.activeFilter);
  }

  applyFilter(filter) {
    this.activeFilter = filter;
    const catObj = UNIVERSE_DATA.categories.find(c => c.id === filter);
    const hudSector = document.getElementById('current-sector-text');

    if (hudSector) {
      hudSector.textContent = filter === 'all' ? 'HELIOS CORE' : catObj.name.toUpperCase();
    }

    this.planets.forEach(p => {
      if (filter === 'all' || (catObj && catObj.filter.includes(p.data.id))) {
        p.el.classList.remove('dimmed');
      } else {
        p.el.classList.add('dimmed');
      }
    });

    this.experimental.forEach(exp => {
      if (filter === 'all' || (catObj && catObj.filter.includes(exp.data.id))) {
        exp.el.classList.remove('dimmed');
      } else {
        exp.el.classList.add('dimmed');
      }
    });
  }

  selectTechnology(techNode) {
    // If clicking the same already-active technology, toggle it OFF!
    if (this.activeTech && this.activeTech.id === techNode.id) {
      this.clearTechnologySelection();
      return;
    }

    this.activeTech = techNode;

    // Highlight the clicked tech node star
    document.querySelectorAll('.constellation-node').forEach(nodeEl => {
      if (nodeEl.id === `constellation-${techNode.id}`) {
        nodeEl.classList.add('highlighted');
      } else {
        nodeEl.classList.remove('highlighted');
      }
    });

    // Highlight matching pill in modal
    document.querySelectorAll('.tech-grid-pill').forEach(pill => {
      if (pill.id === `tech-pill-${techNode.id}`) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });

    // Dim unrelated planets and highlight connected ones
    const connectedPlanets = techNode.projects;
    this.planets.forEach(p => {
      if (connectedPlanets.includes(p.data.id)) {
        p.el.classList.remove('dimmed');
        p.el.style.transform = `translate(calc(-50% + ${p.x}px), calc(-50% + ${p.y}px)) scale(1.1)`;
      } else {
        p.el.classList.add('dimmed');
        p.el.style.transform = `translate(calc(-50% + ${p.x}px), calc(-50% + ${p.y}px)) scale(1)`;
      }
    });

    // Update modal details
    const activeTechTitle = document.getElementById('active-tech-name');
    const activeProjContainer = document.getElementById('active-connected-projects');
    if (activeTechTitle && activeProjContainer) {
      activeTechTitle.textContent = `// CONNECTED WORLDS FOR: ${techNode.name.toUpperCase()} (${techNode.category})`;
      
      const allProjects = [...UNIVERSE_DATA.planets, ...UNIVERSE_DATA.experimental];
      const matched = allProjects.filter(p => connectedPlanets.includes(p.id));

      activeProjContainer.innerHTML = matched.map(m => `
        <div class="connected-proj-card" onclick="window.universeEngine.openPlanetModalById('${m.id}')">
          <div class="conn-proj-name">${m.name}</div>
          <div class="conn-proj-cat">${m.category}</div>
        </div>
      `).join('');
    }

    this.drawConstellationSplines(techNode);
  }

  clearTechnologySelection() {
    this.activeTech = null;

    // Remove highlighted states on constellation nodes
    document.querySelectorAll('.constellation-node').forEach(nodeEl => {
      nodeEl.classList.remove('highlighted');
    });

    // Remove active state on pills
    document.querySelectorAll('.tech-grid-pill').forEach(pill => {
      pill.classList.remove('active');
    });

    // Clear SVG splines
    if (this.svg) {
      this.svg.innerHTML = '';
    }

    // Restore planet opacities based on active filter
    this.applyFilter(this.activeFilter);

    // Reset modal container text
    const activeTechTitle = document.getElementById('active-tech-name');
    const activeProjContainer = document.getElementById('active-connected-projects');
    if (activeTechTitle) activeTechTitle.textContent = 'Select a node above';
    if (activeProjContainer) activeProjContainer.innerHTML = '';
  }

  drawConstellationSplines(techNode) {
    if (!this.svg) return;
    this.svg.innerHTML = '';

    const allBodies = [...this.planets, ...this.experimental];
    const connectedBodies = allBodies.filter(b => techNode.projects.includes(b.data.id));

    connectedBodies.forEach(body => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('id', `spline-${techNode.id}-${body.data.id}`);
      
      const midX = (techNode.x + body.x) / 2;
      const midY = (techNode.y + body.y) / 2 - 35;
      const d = `M ${techNode.x} ${techNode.y} Q ${midX} ${midY} ${body.x} ${body.y}`;

      path.setAttribute('d', d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', body.data.color || '#a855f7');
      path.setAttribute('stroke-width', '2.5');
      path.setAttribute('stroke-dasharray', '6,6');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('opacity', '0.85');
      path.style.filter = `drop-shadow(0 0 8px ${body.data.glowColor || 'rgba(168,85,247,0.6)'})`;

      this.svg.appendChild(path);
    });
  }

  updateConstellationSplines() {
    if (!this.activeTech || !this.svg) return;

    const allBodies = [...this.planets, ...this.experimental];
    const connectedBodies = allBodies.filter(b => this.activeTech.projects.includes(b.data.id));

    connectedBodies.forEach(body => {
      const path = document.getElementById(`spline-${this.activeTech.id}-${body.data.id}`);
      if (path) {
        const midX = (this.activeTech.x + body.x) / 2;
        const midY = (this.activeTech.y + body.y) / 2 - 35;
        path.setAttribute('d', `M ${this.activeTech.x} ${this.activeTech.y} Q ${midX} ${midY} ${body.x} ${body.y}`);
      }
    });
  }

  bindModalEvents() {
    // Dock Modal Triggers
    document.getElementById('btn-constellations')?.addEventListener('click', () => {
      sound.playSelect();
      this.setStatus('MODE : CONSTELLATIONS');
      this.openModal('constellations-modal');
    });

    document.getElementById('btn-mission-control')?.addEventListener('click', () => {
      sound.playSelect();
      this.setStatus('TARGET : MISSION CONTROL');
      this.openModal('mission-control-modal');
    });

    document.getElementById('btn-recruiter-mode')?.addEventListener('click', () => {
      sound.playSelect();
      this.setStatus('MODE : RECRUITER');
      this.openModal('recruiter-modal');
    });

    document.getElementById('btn-satellite-dock')?.addEventListener('click', () => {
      sound.playSelect();
      this.setStatus('TARGET : SATELLITE');
      this.openModal('satellite-modal');
    });

    // Close buttons
    document.querySelectorAll('.btn-close-modal, .overlay-backdrop').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.universe-overlay');
        if (modal) {
          sound.playSelect();
          modal.classList.add('hidden');
          this.resetStatus();
        }
      });
    });

    // Return to Orbit from Planet Detail
    document.getElementById('btn-return-orbit')?.addEventListener('click', () => {
      sound.playSelect();
      document.getElementById('planet-modal').classList.add('hidden');
      this.camera.targetScale = 1;
      this.resetStatus();
    });

    // Resume Modals Trigger
    document.getElementById('btn-open-resume-action')?.addEventListener('click', () => {
      sound.playSelect();
      this.openModal('resume-modal');
    });
    document.getElementById('btn-recruiter-resume')?.addEventListener('click', () => {
      sound.playSelect();
      this.openModal('resume-modal');
    });

    // Download PDF Resume Simulation
    document.getElementById('btn-download-resume-file')?.addEventListener('click', () => {
      sound.playSelect();
      window.print();
    });

    // Satellite Transmission Form Handler (Real Backend API & Resend Integration)
    const commForm = document.getElementById('comm-form');
    const btnSubmitComm = document.getElementById('btn-submit-comm');
    const btnSubmitText = document.getElementById('btn-submit-text');
    const btnSubmitIcon = document.getElementById('btn-submit-icon');
    const statusBox = document.getElementById('comm-status-box');
    const statusTitle = document.getElementById('comm-status-title');
    const statusDesc = document.getElementById('comm-status-desc');

    if (commForm) {
      commForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('comm-sender')?.value.trim();
        const email = document.getElementById('comm-email')?.value.trim();
        const message = document.getElementById('comm-msg')?.value.trim();

        if (!name || !email || !message) return;

        // Enter Transmitting State
        sound.playSelect();
        if (btnSubmitComm) btnSubmitComm.disabled = true;
        if (btnSubmitText) btnSubmitText.textContent = 'TRANSMITTING...';
        if (btnSubmitIcon) btnSubmitIcon.textContent = '⏳';

        if (statusBox) {
          statusBox.className = 'comm-status-box status-transmitting';
          statusBox.classList.remove('hidden');
          if (statusTitle) statusTitle.textContent = 'TRANSMITTING...';
          if (statusDesc) statusDesc.textContent = 'Relaying signal to satellite uplink buffer...';
        }

        try {
          const response = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, message })
          });

          const result = await response.json();

          if (response.ok && result.success) {
            // Success State
            sound.playChime(640, 'sine', 0.5);
            commForm.reset();

            if (statusBox) {
              statusBox.className = 'comm-status-box status-success';
              if (statusTitle) statusTitle.textContent = 'TRANSMISSION RECEIVED';
              if (statusDesc) statusDesc.textContent = 'Your message has reached Mission Control.';
            }

            if (btnSubmitText) btnSubmitText.textContent = 'MESSAGE SENT';
            if (btnSubmitIcon) btnSubmitIcon.textContent = '✓';

            setTimeout(() => {
              if (btnSubmitComm) btnSubmitComm.disabled = false;
              if (btnSubmitText) btnSubmitText.textContent = 'SEND MESSAGE';
              if (btnSubmitIcon) btnSubmitIcon.textContent = '→';
            }, 5000);
          } else {
            // Failure State (Honest feedback, never fake success)
            sound.playChime(220, 'sawtooth', 0.4);
            if (statusBox) {
              statusBox.className = 'comm-status-box status-error';
              if (statusTitle) statusTitle.textContent = 'TRANSMISSION FAILED';
              if (statusDesc) statusDesc.textContent = result.error || 'Something went wrong. Please try again or contact me directly.';
            }

            if (btnSubmitComm) btnSubmitComm.disabled = false;
            if (btnSubmitText) btnSubmitText.textContent = 'RETRY TRANSMISSION';
            if (btnSubmitIcon) btnSubmitIcon.textContent = '↺';
          }
        } catch (err) {
          // Network Error State
          sound.playChime(220, 'sawtooth', 0.4);
          if (statusBox) {
            statusBox.className = 'comm-status-box status-error';
            if (statusTitle) statusTitle.textContent = 'TRANSMISSION FAILED';
            if (statusDesc) statusDesc.textContent = 'Network or server connection failed. Please try again or email kumarvidit69@gmail.com directly.';
          }

          if (btnSubmitComm) btnSubmitComm.disabled = false;
          if (btnSubmitText) btnSubmitText.textContent = 'RETRY TRANSMISSION';
          if (btnSubmitIcon) btnSubmitIcon.textContent = '↺';
        }
      });
    }
  }

  openModal(modalId) {
    document.querySelectorAll('.universe-overlay').forEach(m => m.classList.add('hidden'));
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('hidden');
  }

  openPlanetModal(planetData) {
    this.selectedPlanet = planetData;
    
    // Zoom camera towards planet coordinates smoothly
    this.camera.targetX = -planetData.coords.x;
    this.camera.targetY = -planetData.coords.y;
    this.camera.targetScale = 1.25;

    // Populate modal in exact requested order:
    // 1. Project name
    document.getElementById('modal-planet-name').textContent = planetData.name;
    document.getElementById('modal-planet-category').textContent = planetData.category;
    document.getElementById('modal-planet-sector').textContent = `${planetData.sector || 'ORBITAL SECTOR'} // ${planetData.badge || 'PROJECT'}`;
    
    // 2. One-line "what it does"
    document.getElementById('modal-planet-tagline').textContent = planetData.tagline;

    // 3. What This Demonstrates
    const demonstratesEl = document.getElementById('modal-planet-demonstrates');
    if (demonstratesEl) {
      demonstratesEl.textContent = planetData.demonstrates;
    }

    // Sphere Render Styles
    const sphereRender = document.getElementById('modal-sphere-render');
    if (sphereRender) {
      sphereRender.style.setProperty('--modal-color', planetData.color);
      sphereRender.style.setProperty('--modal-sec', planetData.secondaryColor);
      sphereRender.style.setProperty('--modal-glow', planetData.glowColor);
    }

    // 4. Tech Stack pills
    const stackWrap = document.getElementById('modal-planet-stack');
    if (stackWrap) {
      stackWrap.innerHTML = planetData.stack.map(s => `<span class="stack-pill">${s}</span>`).join('');
    }

    // Metrics List (Holographic panel)
    const metricsList = document.getElementById('modal-metrics-list');
    if (metricsList) {
      if (planetData.metrics) {
        metricsList.innerHTML = planetData.metrics.map(m => `
          <div class="metric-item">
            <span class="metric-item-lbl">${m.label}</span>
            <span class="metric-item-val">${m.val}</span>
          </div>
        `).join('');
      } else {
        metricsList.innerHTML = `
          <div class="metric-item">
            <span class="metric-item-lbl">Type</span>
            <span class="metric-item-val">${planetData.category}</span>
          </div>
          <div class="metric-item">
            <span class="metric-item-lbl">Architecture</span>
            <span class="metric-item-val">Production</span>
          </div>
          <div class="metric-item">
            <span class="metric-item-lbl">Status</span>
            <span class="metric-item-val">Live & Deployed</span>
          </div>
        `;
      }
    }

    // 5. Live Demo & 6. GitHub CTAs
    const linkLive = document.getElementById('modal-link-live');
    const linkGithub = document.getElementById('modal-link-github');

    if (linkLive) {
      if (planetData.links?.live) {
        linkLive.href = planetData.links.live;
        linkLive.style.display = 'inline-flex';
      } else {
        linkLive.style.display = 'none';
      }
    }

    if (linkGithub) {
      linkGithub.href = planetData.links?.github || 'https://github.com/vidit-ks/';
    }

    this.openModal('planet-modal');
  }

  openPlanetModalById(id) {
    const all = [...UNIVERSE_DATA.planets, ...UNIVERSE_DATA.experimental];
    const item = all.find(p => p.id === id);
    if (item) {
      this.openPlanetModal(item);
    }
  }

  updatePhysics() {
    // Smooth Lerp for Cursor Ring (Concentric around mouse dot)
    if (this.cursorRing) {
      this.cursorRingPos.x += (this.mouse.x - this.cursorRingPos.x) * 0.28;
      this.cursorRingPos.y += (this.mouse.y - this.cursorRingPos.y) * 0.28;
      this.cursorRing.style.transform = `translate3d(calc(${this.cursorRingPos.x}px - 50%), calc(${this.cursorRingPos.y}px - 50%), 0)`;
    }

    // Camera Smooth Lerp
    this.camera.x += (this.camera.targetX - this.camera.x) * 0.08;
    this.camera.y += (this.camera.targetY - this.camera.y) * 0.08;
    this.camera.scale += (this.camera.targetScale - this.camera.scale) * 0.08;

    if (this.spatialWorld) {
      this.spatialWorld.style.transform = `translate(${this.camera.x}px, ${this.camera.y}px) scale(${this.camera.scale})`;
    }

    // Dynamically calculate cursor world coordinates per frame based on current interpolated camera
    const cx = this.width / 2;
    const cy = this.height / 2;
    this.mouse.worldX = (this.mouse.x - cx - this.camera.x) / this.camera.scale;
    this.mouse.worldY = (this.mouse.y - cy - this.camera.y) / this.camera.scale;

    // Physical Interactions & Gravity on Planets
    const allBodies = [...this.planets, ...this.experimental];

    allBodies.forEach(body => {
      const dx = this.mouse.worldX - body.x;
      const dy = this.mouse.worldY - body.y;
      const dist = Math.hypot(dx, dy);

      let springK = 0.055;
      let damping = 0.84;

      if (this.gravityMode) {
        // Gravitational Attraction Well (gentle, subtle pull towards cursor)
        const gravityRadius = 420;
        if (dist < gravityRadius && dist > 1) {
          const factor = (gravityRadius - dist) / gravityRadius; // 0 to 1
          const pullForce = factor * 1.1; // Gentle pull
          body.vx += (dx / dist) * pullForce;
          body.vy += (dy / dist) * pullForce;
        }
        springK = 0.036; // Soft anchor to orbit
        damping = 0.86;
      } else {
        // Proximity Subtle Repulsion (Standard exploration mode)
        if (dist < 140 && dist > 5) {
          const repelForce = (140 - dist) / 140;
          body.vx -= (dx / dist) * repelForce * 0.9;
          body.vy -= (dy / dist) * repelForce * 0.9;
        }
        springK = 0.055; // Snappy return to base orbit
        damping = 0.84;
      }

      // Spring-damper force returning to base orbital position
      const springX = (body.baseX - body.x) * springK;
      const springY = (body.baseY - body.y) * springK;

      body.vx = (body.vx + springX) * damping;
      body.vy = (body.vy + springY) * damping;

      body.x += body.vx;
      body.y += body.vy;

      // Restrain maximum displacement so planets are drawn slightly towards cursor without disconnecting
      const dispX = body.x - body.baseX;
      const dispY = body.y - body.baseY;
      const maxDisp = this.gravityMode ? 45 : 25;
      const currentDisp = Math.hypot(dispX, dispY);
      if (currentDisp > maxDisp) {
        body.x = body.baseX + (dispX / currentDisp) * maxDisp;
        body.vx *= 0.6;
        body.vy *= 0.6;
      }

      // Update DOM element translate
      body.el.style.setProperty('--x', `${body.x}px`);
      body.el.style.setProperty('--y', `${body.y}px`);
    });

    // Dynamically update connected constellation splines as planets sway
    if (this.activeTech) {
      this.updateConstellationSplines();
    }
  }

  renderCanvas() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    const cx = this.width / 2;
    const cy = this.height / 2;

    // Render Gravitational Lens Aura when Gravity Mode is Active
    if (this.gravityMode) {
      const gradGrav = this.ctx.createRadialGradient(this.mouse.x, this.mouse.y, 0, this.mouse.x, this.mouse.y, 240);
      gradGrav.addColorStop(0, 'rgba(6, 182, 212, 0.16)');
      gradGrav.addColorStop(0.4, 'rgba(168, 85, 247, 0.08)');
      gradGrav.addColorStop(1, 'transparent');
      this.ctx.fillStyle = gradGrav;
      this.ctx.beginPath();
      this.ctx.arc(this.mouse.x, this.mouse.y, 240, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Render Cosmic Dust Nebulae
    this.dustParticles.forEach(p => {
      const px = cx + (p.x + this.camera.x * 0.3) * this.camera.scale;
      const py = cy + (p.y + this.camera.y * 0.3) * this.camera.scale;

      const grad = this.ctx.createRadialGradient(px, py, 0, px, py, p.radius * this.camera.scale);
      grad.addColorStop(0, p.color);
      grad.addColorStop(1, 'transparent');

      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(px, py, p.radius * this.camera.scale, 0, Math.PI * 2);
      this.ctx.fill();
    });

    // Render Multi-layer Stars
    const time = performance.now() * 0.001;
    this.stars.forEach(star => {
      // Parallax calculation
      const sx = cx + (star.x + this.camera.x * star.layer) * this.camera.scale;
      const sy = cy + (star.y + this.camera.y * star.layer) * this.camera.scale;

      // Wrap around bounds
      if (sx >= -20 && sx <= this.width + 20 && sy >= -20 && sy <= this.height + 20) {
        const twinkle = Math.sin(time * star.twinkleSpeed * 50 + star.twinkleOffset) * 0.3 + 0.7;
        this.ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha * twinkle})`;
        this.ctx.beginPath();
        this.ctx.arc(sx, sy, star.size * this.camera.scale, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });

    // Render Orbital Trace Guides (Faint orbital rings around core station)
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    this.ctx.lineWidth = 1;
    [350, 480, 800].forEach(radius => {
      this.ctx.beginPath();
      this.ctx.arc(cx + this.camera.x * this.camera.scale, cy + this.camera.y * this.camera.scale, radius * this.camera.scale, 0, Math.PI * 2);
      this.ctx.stroke();
    });
  }

  renderLandingCanvas() {
    if (this.isEntered || !this.landingCtx) return;
    this.landingCtx.clearRect(0, 0, this.width, this.height);

    const time = performance.now() * 0.001;

    this.landingParticles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < -10) p.x = this.width + 10;
      if (p.x > this.width + 10) p.x = -10;
      if (p.y < -10) p.y = this.height + 10;
      if (p.y > this.height + 10) p.y = -10;

      const pulse = Math.sin(time * p.pulseSpeed * 60) * 0.3 + 0.7;
      this.landingCtx.fillStyle = p.color;
      this.landingCtx.globalAlpha = p.alpha * pulse;
      this.landingCtx.beginPath();
      this.landingCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.landingCtx.fill();
    });
    this.landingCtx.globalAlpha = 1.0;
  }

  startLoop() {
    const loop = () => {
      this.updatePhysics();
      if (!this.isEntered) {
        this.renderLandingCanvas();
      }
      this.renderCanvas();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
  window.universeEngine = new UniverseEngine();
});
