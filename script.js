// script.js
(() => {
  const GITHUB_USERNAME = 'qassimAlsmadi';
  const THEME_KEY = 'portfolio_theme';

  const prefersReducedMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const els = {
    themeToggle: document.getElementById('themeToggle'),
    themeToggleLabel: document.getElementById('themeToggleLabel'),
    projectsGrid: document.getElementById('projectsGrid'),
    projectsStatus: document.getElementById('projectsStatus'),
    profilePhoto: document.getElementById('profilePhoto'),
    avatarFallback: document.getElementById('avatarFallback'),
    projectsMore: document.getElementById('projectsMore'),
    contactForm: document.getElementById('contactForm'),
    contactStatus: document.getElementById('contactStatus'),
  };

  function setTheme(theme) {
    const isLight = theme === 'light';
    document.documentElement.setAttribute(
      'data-theme',
      isLight ? 'light' : 'dark',
    );

    if (els.themeToggle) {
      els.themeToggle.setAttribute('aria-pressed', String(!isLight));
    }
    if (els.themeToggleLabel) {
      els.themeToggleLabel.textContent = isLight ? 'Light' : 'Dark';
    }

    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Ignore storage failures (privacy mode, disabled storage, etc.)
    }
  }

  function getInitialTheme() {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === 'light' || stored === 'dark') return stored;
    } catch {
      // Ignore storage failures
    }
    return 'dark';
  }

  function initThemeToggle() {
    setTheme(getInitialTheme());

    if (!els.themeToggle) return;

    els.themeToggle.addEventListener('click', () => {
      const current =
        document.documentElement.getAttribute('data-theme') || 'dark';
      setTheme(current === 'light' ? 'dark' : 'light');
    });
  }

  function initSmoothScrolling() {
    const internalLinks = document.querySelectorAll('a[href^="#"]');
    internalLinks.forEach((a) => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        if (!href || href === '#') return;

        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();
        target.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: 'start',
        });
      });
    });
  }

  function initScrollSpy() {
    const navLinks = Array.from(
      document.querySelectorAll('.nav__link[href^="#"]'),
    );
    if (navLinks.length === 0) return;

    const items = navLinks
      .map((a) => {
        const id = (a.getAttribute('href') || '').trim();
        if (!id || id === '#' || !id.startsWith('#')) return null;
        const section = document.querySelector(id);
        if (!section) return null;
        return { a, section, id };
      })
      .filter(Boolean);

    if (items.length === 0) return;

    const setActive = (id) => {
      for (const item of items) {
        item.a.classList.toggle('is-active', item.id === id);
      }
    };

    if (!('IntersectionObserver' in window)) {
      setActive(items[0].id);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0),
          );

        if (visible.length === 0) return;
        const top = visible[0].target;
        const active = items.find((x) => x.section === top);
        if (active) setActive(active.id);
      },
      {
        threshold: [0.2, 0.35, 0.5],
        rootMargin: '-20% 0px -60% 0px',
      },
    );

    items.forEach((item) => io.observe(item.section));
    setActive(items[0].id);
  }

  function initRevealAnimations() {
    const revealEls = document.querySelectorAll('.reveal');
    if (revealEls.length === 0) return;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach((el) => el.classList.add('in-view'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.16, rootMargin: '0px 0px -10% 0px' },
    );

    revealEls.forEach((el) => io.observe(el));
  }

  function initSkillBars() {
    const bars = document.querySelectorAll('.skillbar');
    if (bars.length === 0) return;

    bars.forEach((bar) => {
      const raw = Number(bar.getAttribute('data-level') || 0);
      const level = Math.min(100, Math.max(0, Number.isFinite(raw) ? raw : 0));
      bar.style.setProperty('--level', `${level}%`);
      bar.classList.add('is-ready');
    });

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      bars.forEach((bar) => bar.classList.add('is-animated'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-animated');
          io.unobserve(entry.target);
        }
      },
      { threshold: 0.25, rootMargin: '0px 0px -10% 0px' },
    );

    bars.forEach((bar) => io.observe(bar));
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (m) => {
      switch (m) {
        case '&':
          return '&amp;';
        case '<':
          return '&lt;';
        case '>':
          return '&gt;';
        case '"':
          return '&quot;';
        case "'":
          return '&#039;';
        default:
          return m;
      }
    });
  }

  function setProjectsStatus(title, subtitle) {
    if (!els.projectsStatus) return;
    const safeTitle = escapeHtml(title);
    const safeSubtitle = escapeHtml(subtitle);

    els.projectsStatus.innerHTML = `
      <div class="projects__status-title">${safeTitle}</div>
      <div class="projects__status-subtitle">${safeSubtitle}</div>
    `;
  }

  function renderProjects(repos) {
    if (!els.projectsGrid) return;

    const cards = repos
      .map((repo) => {
        const name = escapeHtml(repo.name || 'Repository');
        const desc = escapeHtml(repo.description || 'No description provided.');
        const lang = escapeHtml(repo.language || 'N/A');
        const url = repo.html_url;

        return `
          <article class="project card reveal">
            <div class="project__top">
              <h3 class="project__name">${name}</h3>
              <span class="project__badge">Public</span>
            </div>

            <p class="project__desc">${desc}</p>

            <div class="project__meta">
              <span class="project__lang">Tech: <strong>${lang}</strong></span>
            </div>

            <div class="project__actions">
              <a class="project__link" href="${url}" target="_blank" rel="noopener noreferrer">GitHub</a>
            </div>
          </article>
        `;
      })
      .join('');

    els.projectsGrid.innerHTML = cards;

    initRevealAnimations();
  }

  async function fetchGitHubRepos() {
    const endpoint = `https://api.github.com/users/${encodeURIComponent(GITHUB_USERNAME)}/repos?per_page=100&sort=updated`;

    try {
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.github+json',
        },
      });

      if (!res.ok) {
        if (res.status === 404) {
          setProjectsStatus(
            'GitHub user or repositories not found',
            `GitHub returned 404. Verify the username "${GITHUB_USERNAME}" and that you have public, non-fork repositories.`,
          );
          return [];
        }

        if (res.status === 403) {
          setProjectsStatus(
            'GitHub API rate limit reached',
            'Please refresh later or open the GitHub profile directly.',
          );
          return [];
        }

        setProjectsStatus(
          'Could not load repositories',
          `GitHub returned an error (${res.status}).`,
        );
        return [];
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        setProjectsStatus(
          'Could not load repositories',
          'Unexpected response from GitHub.',
        );
        return [];
      }

      const nonForks = data.filter((r) => r && r.fork === false);

      nonForks.sort((a, b) => {
        const ta = new Date(a.pushed_at || a.updated_at || 0).getTime();
        const tb = new Date(b.pushed_at || b.updated_at || 0).getTime();
        return tb - ta;
      });

      const top = nonForks.slice(0, 9);

      if (top.length === 0) {
        setProjectsStatus(
          'No public non-fork repositories found',
          'Visit GitHub for the latest activity.',
        );
      } else {
        setProjectsStatus(
          'Latest projects',
          'Up-to-date repositories loaded directly from GitHub.',
        );
      }

      return top;
    } catch {
      setProjectsStatus(
        'Network error',
        'Unable to reach GitHub. Check your connection and try again.',
      );
      return [];
    }
  }

  async function initProjects() {
    if (!els.projectsGrid || !els.projectsStatus) return;

    const mode = els.projectsGrid.getAttribute('data-projects');
    if (mode === 'static') {
      return;
    }

    setProjectsStatus(
      'Fetching repositories…',
      'Loading public, non-forked projects from GitHub.',
    );
    const repos = await fetchGitHubRepos();
    if (repos.length > 0) renderProjects(repos);
  }

  function initProfilePhoto() {
    if (!els.profilePhoto || !els.avatarFallback) return;

    const showFallback = () => {
      els.profilePhoto.style.display = 'none';
      els.avatarFallback.style.display = 'grid';
    };

    const showImage = () => {
      els.profilePhoto.style.display = 'block';
      els.avatarFallback.style.display = 'none';
    };

    els.avatarFallback.style.display = 'grid';

    if (els.profilePhoto.complete && els.profilePhoto.naturalWidth > 0) {
      showImage();
      return;
    }

    els.profilePhoto.addEventListener('load', showImage, { once: true });
    els.profilePhoto.addEventListener('error', showFallback, { once: true });
  }

  function initProjectsUi() {
    const grid = els.projectsGrid;
    if (!grid) return;

    const tabs = Array.from(document.querySelectorAll('.tab[data-tab]'));
    const cards = Array.from(grid.querySelectorAll('.project'));
    const initialVisibleRaw = Number(grid.getAttribute('data-visible') || 0);
    const initialVisible =
      Number.isFinite(initialVisibleRaw) && initialVisibleRaw > 0
        ? initialVisibleRaw
        : cards.length;
    let visibleCount = initialVisible;
    let activeTab = 'all';

    const step = 3;

    function setTab(next) {
      activeTab = next;
      visibleCount = initialVisible;

      for (const btn of tabs) {
        const isActive = btn.getAttribute('data-tab') === next;
        btn.classList.toggle('is-active', isActive);
        btn.setAttribute('aria-selected', String(isActive));
      }

      apply();
    }

    function apply() {
      let shown = 0;
      let eligible = 0;

      for (const card of cards) {
        const cat = (card.getAttribute('data-category') || '').trim();
        const matches = activeTab === 'all' || cat === activeTab;

        if (!matches) {
          card.classList.add('is-hidden');
          continue;
        }

        eligible += 1;
        shown += 1;
        card.classList.toggle('is-hidden', shown > visibleCount);
      }

      if (els.projectsMore) {
        const hasMore = visibleCount < eligible;
        els.projectsMore.style.display = hasMore ? 'inline-flex' : 'none';
        els.projectsMore.disabled = !hasMore;
      }
    }

    if (tabs.length > 0) {
      tabs.forEach((btn) => {
        btn.addEventListener('click', () => {
          const next = btn.getAttribute('data-tab') || 'all';
          setTab(next);
        });
      });
    }

    if (els.projectsMore) {
      els.projectsMore.addEventListener('click', () => {
        visibleCount += step;
        apply();
      });
    }

    setTab(activeTab);
  }

  function initContactForm() {
    if (!els.contactForm || !els.contactStatus) return;

    const setStatus = (type, msg) => {
      els.contactStatus.textContent = msg || '';
      els.contactStatus.classList.toggle('is-success', type === 'success');
      els.contactStatus.classList.toggle('is-error', type === 'error');
    };

    els.contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      setStatus('', 'Sending…');

      const formData = new FormData(els.contactForm);

      try {
        const res = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(formData).toString(),
        });

        if (!res.ok) {
          throw new Error(`Request failed (${res.status})`);
        }

        els.contactForm.reset();
        setStatus('success', 'Message sent successfully. I will reply soon.');
      } catch {
        setStatus(
          'error',
          'Could not send the message right now. Please try again, or contact me via email/WhatsApp.',
        );

        try {
          els.contactForm.submit();
        } catch {
          // Ignore
        }
      }
    });
  }

  function init() {
    initThemeToggle();
    initSmoothScrolling();
    initScrollSpy();
    initRevealAnimations();
    initSkillBars();
    initProfilePhoto();
    initProjects();
    initProjectsUi();
    initContactForm();
  }

  // CV Download Function
  window.downloadCV = function () {
    const link = document.createElement('a');
    link.href = 'CV-Qasim-Al-Smadi.pdf';
    link.download = 'CV-Qasim-Al-Smadi.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
