// Enhanced page transitions and UI interactions
document.addEventListener('DOMContentLoaded', () => {
    // Initialize page transitions
    initializePageTransitions();
    // Initialize content transitions
    initializeContentTransitions();
    // Handle background image loading
    handleBackgroundImages();
    // Ensure there's an initial screen and mark it active for transitions
    ensureInitialScreen();

    // Inject flow navigation buttons (Prev / Next) to help move between pages
    injectFlowButtons();
});

// Initialize page transition system
function initializePageTransitions() {
    // Create overlay for transitions
    const overlay = document.createElement('div');
    overlay.className = 'page-transition-overlay';
    // Ensure cross-browser backdrop filter availability
    overlay.style.webkitBackdropFilter = 'blur(var(--blur-strength))';
    document.body.appendChild(overlay);

    // Current active screen
    let currentScreen = document.querySelector('.screen.active');
    
    // Handle navigation clicks
    document.addEventListener('click', async (e) => {
        const link = e.target.closest('a[href]');
        if (!link) return;

        // Read raw href attribute (may be '#', relative path, or full URL)
        let href = link.getAttribute('href') || '';

        // If href is exactly '#', try to map the link to a proper route using data or visible label
        if (href === '#') {
            const mapped = mapPlaceholderLinkToRoute(link);
            if (mapped) {
                href = mapped;
            } else {
                // If it's a fragment anchor or intentionally empty, allow default behavior
                return;
            }
        }

        // If it's an in-page fragment like '#section' and that element exists, allow default
        if (href.startsWith('#')) {
            const targetId = href.slice(1);
            if (document.getElementById(targetId)) return;
            // otherwise fall through
        }

        // Ignore external links and protocol-relative
        if (href.startsWith('http') || href.startsWith('//')) return;

        e.preventDefault();
        try {
            await transitionToPage(href);
        } catch (error) {
            console.error('Navigation error:', error);
            // Fallback to normal navigation
            window.location.href = href;
        }
    });

    // Page transition logic
    async function transitionToPage(href) {
        // Show overlay
        overlay.classList.add('visible');

        try {
            // Exit animation for current screen
            if (currentScreen) {
                currentScreen.classList.add('exiting');
                await waitForTransition(currentScreen);
            }

            // Load new page content
            const response = await fetch(href);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const html = await response.text();

            // Parse new content
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            let newScreen = doc.querySelector('.screen');

            // Fallback: try common main selectors if .screen is missing
            if (!newScreen) {
                newScreen = doc.querySelector('main') || doc.querySelector('div[role="main"]') || doc.querySelector('body > div');
            }

            if (!newScreen) throw new Error('No screen element found in new page');

            // Update title
            document.title = doc.title || document.title;

            // Import node into current document to avoid cross-document issues
            const imported = document.importNode(newScreen, true);

            // Replace current screen
            if (currentScreen) {
                currentScreen.replaceWith(imported);
            } else {
                document.body.appendChild(imported);
            }

            // Update history
            window.history.pushState({ path: href }, '', href);

            // Initialize new screen
            currentScreen = imported;
            initializeContentTransitions();
            handleBackgroundImages();

            // Trigger enter animation
            requestAnimationFrame(() => {
                newScreen.classList.add('active');
            });

            // Wait for enter animation
            await waitForTransition(currentScreen);

        } finally {
            // Hide overlay
            overlay.classList.remove('visible');
        }
    }

    // Handle browser back/forward
    window.addEventListener('popstate', async (e) => {
        try {
            await transitionToPage(window.location.pathname);
        } catch (error) {
            console.error('Navigation error:', error);
            window.location.reload();
        }
    });
}

// Initialize content transitions
function initializeContentTransitions() {
    document.querySelectorAll('.content-fade-in').forEach(container => {
        if (!container.dataset.transitionInitialized) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('active');
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.2,
                rootMargin: '50px'
            });

            observer.observe(container);
            container.dataset.transitionInitialized = 'true';
        }
    });
}

// Handle background image loading
function handleBackgroundImages() {
    document.querySelectorAll('.cover-bg').forEach(element => {
        if (!element.dataset.bgInitialized) {
            // Prefer data-bg attribute (used in markup) then fallback to computed style
            const dataBg = element.dataset.bg;
            let bgUrl = '';

            if (dataBg) {
                bgUrl = dataBg;
                // Apply as inline background-image so computed styles work later
                element.style.backgroundImage = `url("${bgUrl}")`;
            } else {
                const computed = getComputedStyle(element).backgroundImage;
                if (computed && computed !== 'none') {
                    bgUrl = computed.slice(4, -1).replace(/["']/g, '');
                }
            }

            if (bgUrl) {
                // Create placeholder
                const placeholder = document.createElement('div');
                placeholder.className = 'bg-placeholder';
                // Mirror the same background so blur shows the image while loading
                placeholder.style.backgroundImage = `url("${bgUrl}")`;
                element.insertBefore(placeholder, element.firstChild);

                // Preload image
                const img = new Image();
                img.onload = () => {
                    // Fade placeholder out and remove when loaded
                    placeholder.style.opacity = '0';
                    setTimeout(() => placeholder.remove(), 500);
                };
                img.onerror = () => {
                    // If loading fails, remove the placeholder after a short delay
                    placeholder.style.opacity = '0';
                    setTimeout(() => placeholder.remove(), 500);
                };
                img.src = bgUrl;
            }
            element.dataset.bgInitialized = 'true';
        }
    });
}

// Utility: Wait for transition
function waitForTransition(element) {
    return new Promise(resolve => {
        try {
            if (!element) return resolve();

            const style = getComputedStyle(element);
            // transitionDuration / transitionDelay may be comma-separated lists
            const durParts = (style.transitionDuration || '0s').split(',').map(s => s.trim());
            const delayParts = (style.transitionDelay || '0s').split(',').map(s => s.trim());

            const toMs = s => {
                if (!s) return 0;
                // supports 'ms' and 's'
                if (s.endsWith('ms')) return parseFloat(s);
                if (s.endsWith('s')) return parseFloat(s) * 1000;
                return parseFloat(s) || 0;
            };

            const totals = durParts.map((d, i) => toMs(d) + toMs(delayParts[i] || delayParts[0] || '0s'));
            const max = Math.max(0, ...totals);
            const timeout = Math.ceil(max) + 80; // small safety margin

            if (timeout === 80) {
                // No transition duration -> resolve next frame
                requestAnimationFrame(resolve);
                return;
            }

            let resolved = false;
            const onEnd = (ev) => {
                if (ev && ev.target !== element) return; // ignore child transitions
                if (resolved) return;
                resolved = true;
                element.removeEventListener('transitionend', onEnd);
                clearTimeout(timer);
                resolve();
            };

            element.addEventListener('transitionend', onEnd);
            const timer = setTimeout(() => {
                if (resolved) return;
                resolved = true;
                element.removeEventListener('transitionend', onEnd);
                resolve();
            }, timeout);
        } catch (err) {
            // In case of any error, don't block navigation
            resolve();
        }
    });
}

// Ensure there is a `.screen` element on initial load and mark it active
function ensureInitialScreen() {
    let screen = document.querySelector('.screen');
    if (!screen) {
        // Try common main selectors
        screen = document.querySelector('main') || document.querySelector('div[role="main"]') || document.querySelector('body > div');
        if (screen) {
            screen.classList.add('screen');
        }
    }

    if (screen && !screen.classList.contains('active')) {
        // Small timeout to allow other scripts/styles to initialize
        requestAnimationFrame(() => screen.classList.add('active'));
    }
}

// Inject floating Prev/Next buttons according to a simple app flow
function injectFlowButtons() {
    // Define the linear app flow (first -> next -> ...)
    const flow = [
        'welcome home screen.html',
        'map dashboard.html',
        'personalize routes.html',
        'fuel station finder.html',
        'report road condition.html',
        'road details.html',
        'settings.html'
    ];

    const current = decodeURIComponent(window.location.pathname.split('/').pop() || '');
    const idx = flow.indexOf(current);

    // If current page isn't in flow, don't show buttons
    if (idx === -1) return;

    const container = document.createElement('div');
    container.setAttribute('aria-hidden', 'false');
    container.style.position = 'fixed';
    container.style.right = '18px';
    container.style.bottom = '18px';
    container.style.zIndex = '10010';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '8px';

    const makeButton = (label, href, title) => {
        const a = document.createElement('a');
        a.href = href;
        a.title = title || label;
        a.className = 'flow-nav-btn';
        a.style.display = 'inline-flex';
        a.style.alignItems = 'center';
        a.style.justifyContent = 'center';
        a.style.width = '44px';
        a.style.height = '44px';
        a.style.borderRadius = '10px';
        a.style.background = 'rgba(10,12,16,0.7)';
        a.style.color = 'white';
        a.style.textDecoration = 'none';
    a.style.webkitBackdropFilter = 'blur(6px)';
    a.style.backdropFilter = 'blur(6px)';
        a.style.boxShadow = '0 6px 14px rgba(0,0,0,0.35)';
        a.style.border = '1px solid rgba(255,255,255,0.04)';
        a.style.fontSize = '18px';
        a.setAttribute('aria-label', label);
        a.innerText = label;
        return a;
    };

    if (idx > 0) {
        const prev = makeButton('\u2190', flow[idx - 1], 'Previous');
        container.appendChild(prev);
    }
    if (idx < flow.length - 1) {
        const next = makeButton('\u2192', flow[idx + 1], 'Next');
        container.appendChild(next);
    }

    document.body.appendChild(container);

    // Add a small CSS rule for hover/focus states to match site styles
    const style = document.createElement('style');
    style.textContent = `
        .flow-nav-btn:hover, .flow-nav-btn:focus { transform: translateY(-2px); background: rgba(6,182,212,0.95); color: #071226; }
    `;
    document.head.appendChild(style);
}

// Map placeholder anchors (href="#") to real routes using heuristics
function mapPlaceholderLinkToRoute(link) {
    // If the element declares an explicit data-route, use it
    const dataRoute = link.dataset.route;
    if (dataRoute) return dataRoute;

    // Use aria-label or title if available
    const label = (link.getAttribute('aria-label') || link.title || link.textContent || '').trim().toLowerCase();
    if (!label) return null;

    // Heuristic mapping - extend this as needed
    const map = {
        'map': 'map dashboard.html',
        'fuel': 'fuel station finder.html',
        'routes': 'personalize routes.html',
        'report': 'report road condition.html',
        'settings': 'settings.html',
        'home': 'welcome home screen.html',
        'start now': 'map dashboard.html',
        'i have an account': 'map dashboard.html'
    };

    // try direct match
    if (map[label]) return map[label];

    // try first word
    const first = label.split(/[\s\-]+/)[0];
    if (map[first]) return map[first];

    return null;
}