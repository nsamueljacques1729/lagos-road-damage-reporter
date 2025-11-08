// Enhanced page transitions and UI interactions
document.addEventListener('DOMContentLoaded', () => {
    // Initialize page transitions
    initializePageTransitions();
    // Initialize content transitions
    initializeContentTransitions();
    // Handle background image loading
    handleBackgroundImages();
});

// Initialize page transition system
function initializePageTransitions() {
    // Create overlay for transitions
    const overlay = document.createElement('div');
    overlay.className = 'page-transition-overlay';
    document.body.appendChild(overlay);

    // Current active screen
    let currentScreen = document.querySelector('.screen.active');
    
    // Handle navigation clicks
    document.addEventListener('click', async (e) => {
        const link = e.target.closest('a[href]');
        if (!link) return;

        // Only handle internal navigation
        const href = link.getAttribute('href');
        if (href.startsWith('http') || href.startsWith('//') || href.startsWith('#')) return;

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
            const bgUrl = getComputedStyle(element).backgroundImage;
            if (bgUrl !== 'none') {
                // Create placeholder
                const placeholder = document.createElement('div');
                placeholder.className = 'bg-placeholder';
                element.insertBefore(placeholder, element.firstChild);

                // Load image
                const img = new Image();
                img.onload = () => {
                    placeholder.style.opacity = '0';
                    setTimeout(() => placeholder.remove(), 500);
                };
                img.src = bgUrl.slice(4, -1).replace(/["']/g, '');
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