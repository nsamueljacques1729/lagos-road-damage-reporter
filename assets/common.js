// Common JavaScript functionality shared across pages

// Handle background images from data-bg attributes
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('[data-bg]').forEach(function(el) {
    var url = el.getAttribute('data-bg');
    if (url) el.style.backgroundImage = 'url(' + url + ')';
  });
});

// Page transition router
document.addEventListener('DOMContentLoaded', function() {
  var screen = document.querySelector('main') || document.querySelector('div[role="main"]') || document.querySelector('body > div');
  if (!screen) return;

  screen.classList.add('screen');
  requestAnimationFrame(function() { 
    screen.classList.add('active'); 
  });

  document.querySelectorAll('a[href]').forEach(function(a) {
    var href = a.getAttribute('href');
    if (!href) return;
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    var isInternal = href.endsWith('.html') || (!href.includes('://') && !href.startsWith('http'));
    if (!isInternal) return;

    a.addEventListener('click', function(e) { 
      e.preventDefault();
      screen.classList.remove('active');
      screen.classList.add('exiting');
      setTimeout(function() { window.location = href; }, 260);
    });
  });
});