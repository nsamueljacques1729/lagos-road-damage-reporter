// Enhanced page transitions and animations

// Utility functions
const utils = {
  prefersReducedMotion: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  // Ensure smooth animation frame timing
  nextFrame: () => new Promise(resolve => requestAnimationFrame(resolve)),
  // Wait for a specified duration
  wait: ms => new Promise(resolve => setTimeout(resolve, ms)),
  // Check if element is fully loaded (including images)
  isElementLoaded: async (element) => {
    const images = Array.from(element.getElementsByTagName('img'));
    await Promise.all(images.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    }));
    return true;
  }
};

// Handle background images from data-bg attributes
const initBackgroundImages = () => {
  document.querySelectorAll('[data-bg]').forEach(el => {
    const url = el.getAttribute('data-bg');
    if (url) {
      const img = new Image();
      img.onload = () => el.style.backgroundImage = `url(${url})`;
      img.src = url;
    }
  });
};

// Enhanced content fade-in initialization
const initContentFadeIn = async () => {
  const contentSections = document.querySelectorAll('.content-fade-in');
  if (!contentSections.length) return;

  for (const section of contentSections) {
    // Wait for all images in the section to load
    await utils.isElementLoaded(section);
    // Ensure DOM is ready for animation
    await utils.nextFrame();
    section.classList.add('active');
  }
};

// Initialize page transitions
const initPageTransitions = async () => {
  const screen = document.querySelector('main') || 
                document.querySelector('div[role="main"]') || 
                document.querySelector('body > div');
  if (!screen) return;

  // Setup initial page state
  screen.classList.add('screen');
  await utils.nextFrame();
  screen.classList.add('active');
  await initContentFadeIn();

  // Handle navigation
  document.querySelectorAll('a[href]').forEach(a => {
    const href = a.getAttribute('href');
    if (!href) return;
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    
    const isInternal = href.endsWith('.html') || (!href.includes('://') && !href.startsWith('http'));
    if (!isInternal) return;

    a.addEventListener('click', async (e) => {
      e.preventDefault();
      
      // Handle reduced motion preference
      if (utils.prefersReducedMotion()) {
        window.location.href = href;
        return;
      }

      // Smooth exit animation
      screen.classList.add('exiting');
      screen.classList.remove('active');
      
      // Wait for exit animation
      await utils.wait(600);
      window.location.href = href;
    });
  });
};

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initBackgroundImages();
  initPageTransitions();
});
      screen.classList.add('exiting');
      setTimeout(function() { window.location = href; }, 260);
    });
  });
});