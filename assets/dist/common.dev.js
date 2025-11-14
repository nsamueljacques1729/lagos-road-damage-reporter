"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

// Enhanced page transitions and UI interactions
document.addEventListener('DOMContentLoaded', function () {
  // Initialize page transitions
  initializePageTransitions(); // Initialize content transitions

  initializeContentTransitions(); // Handle background image loading

  handleBackgroundImages(); // Ensure there's an initial screen and mark it active for transitions

  ensureInitialScreen(); // Inject flow navigation buttons (Prev / Next) to help move between pages

  injectFlowButtons();
}); // Initialize page transition system

function initializePageTransitions() {
  // Create overlay for transitions
  var overlay = document.createElement('div');
  overlay.className = 'page-transition-overlay'; // Ensure cross-browser backdrop filter availability

  overlay.style.webkitBackdropFilter = 'blur(var(--blur-strength))';
  document.body.appendChild(overlay); // Current active screen

  var currentScreen = document.querySelector('.screen.active'); // Handle navigation clicks

  document.addEventListener('click', function _callee(e) {
    var link, href, mapped, targetId;
    return regeneratorRuntime.async(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            link = e.target.closest('a[href]');

            if (link) {
              _context.next = 3;
              break;
            }

            return _context.abrupt("return");

          case 3:
            // Read raw href attribute (may be '#', relative path, or full URL)
            href = link.getAttribute('href') || ''; // If href is exactly '#', try to map the link to a proper route using data or visible label

            if (!(href === '#')) {
              _context.next = 11;
              break;
            }

            mapped = mapPlaceholderLinkToRoute(link);

            if (!mapped) {
              _context.next = 10;
              break;
            }

            href = mapped;
            _context.next = 11;
            break;

          case 10:
            return _context.abrupt("return");

          case 11:
            if (!href.startsWith('#')) {
              _context.next = 15;
              break;
            }

            targetId = href.slice(1);

            if (!document.getElementById(targetId)) {
              _context.next = 15;
              break;
            }

            return _context.abrupt("return");

          case 15:
            if (!(href.startsWith('http') || href.startsWith('//'))) {
              _context.next = 17;
              break;
            }

            return _context.abrupt("return");

          case 17:
            e.preventDefault();
            _context.prev = 18;
            _context.next = 21;
            return regeneratorRuntime.awrap(transitionToPage(href));

          case 21:
            _context.next = 27;
            break;

          case 23:
            _context.prev = 23;
            _context.t0 = _context["catch"](18);
            console.error('Navigation error:', _context.t0); // Fallback to normal navigation

            window.location.href = href;

          case 27:
          case "end":
            return _context.stop();
        }
      }
    }, null, null, [[18, 23]]);
  }); // Page transition logic

  function transitionToPage(href) {
    var response, html, parser, doc, newScreen, imported;
    return regeneratorRuntime.async(function transitionToPage$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            // Show overlay
            overlay.classList.add('visible');
            _context2.prev = 1;

            if (!currentScreen) {
              _context2.next = 6;
              break;
            }

            currentScreen.classList.add('exiting');
            _context2.next = 6;
            return regeneratorRuntime.awrap(waitForTransition(currentScreen));

          case 6:
            _context2.next = 8;
            return regeneratorRuntime.awrap(fetch(href));

          case 8:
            response = _context2.sent;

            if (response.ok) {
              _context2.next = 11;
              break;
            }

            throw new Error("HTTP error! status: ".concat(response.status));

          case 11:
            _context2.next = 13;
            return regeneratorRuntime.awrap(response.text());

          case 13:
            html = _context2.sent;
            // Parse new content
            parser = new DOMParser();
            doc = parser.parseFromString(html, 'text/html');
            newScreen = doc.querySelector('.screen'); // Fallback: try common main selectors if .screen is missing

            if (!newScreen) {
              newScreen = doc.querySelector('main') || doc.querySelector('div[role="main"]') || doc.querySelector('body > div');
            }

            if (newScreen) {
              _context2.next = 20;
              break;
            }

            throw new Error('No screen element found in new page');

          case 20:
            // Update title
            document.title = doc.title || document.title; // Import node into current document to avoid cross-document issues

            imported = document.importNode(newScreen, true); // Replace current screen

            if (currentScreen) {
              currentScreen.replaceWith(imported);
            } else {
              document.body.appendChild(imported);
            } // Update history


            window.history.pushState({
              path: href
            }, '', href); // Initialize new screen

            currentScreen = imported;
            initializeContentTransitions();
            handleBackgroundImages(); // Trigger enter animation

            requestAnimationFrame(function () {
              newScreen.classList.add('active');
            }); // Wait for enter animation

            _context2.next = 30;
            return regeneratorRuntime.awrap(waitForTransition(currentScreen));

          case 30:
            _context2.prev = 30;
            // Hide overlay
            overlay.classList.remove('visible');
            return _context2.finish(30);

          case 33:
          case "end":
            return _context2.stop();
        }
      }
    }, null, null, [[1,, 30, 33]]);
  } // Handle browser back/forward


  window.addEventListener('popstate', function _callee2(e) {
    return regeneratorRuntime.async(function _callee2$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.prev = 0;
            _context3.next = 3;
            return regeneratorRuntime.awrap(transitionToPage(window.location.pathname));

          case 3:
            _context3.next = 9;
            break;

          case 5:
            _context3.prev = 5;
            _context3.t0 = _context3["catch"](0);
            console.error('Navigation error:', _context3.t0);
            window.location.reload();

          case 9:
          case "end":
            return _context3.stop();
        }
      }
    }, null, null, [[0, 5]]);
  });
} // Initialize content transitions


function initializeContentTransitions() {
  document.querySelectorAll('.content-fade-in').forEach(function (container) {
    if (!container.dataset.transitionInitialized) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
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
} // Handle background image loading


function handleBackgroundImages() {
  document.querySelectorAll('.cover-bg').forEach(function (element) {
    if (!element.dataset.bgInitialized) {
      // Prefer data-bg attribute (used in markup) then fallback to computed style
      var dataBg = element.dataset.bg;
      var bgUrl = '';

      if (dataBg) {
        bgUrl = dataBg; // Apply as inline background-image so computed styles work later

        element.style.backgroundImage = "url(\"".concat(bgUrl, "\")");
      } else {
        var computed = getComputedStyle(element).backgroundImage;

        if (computed && computed !== 'none') {
          bgUrl = computed.slice(4, -1).replace(/["']/g, '');
        }
      }

      if (bgUrl) {
        // Create placeholder
        var placeholder = document.createElement('div');
        placeholder.className = 'bg-placeholder'; // Mirror the same background so blur shows the image while loading

        placeholder.style.backgroundImage = "url(\"".concat(bgUrl, "\")");
        element.insertBefore(placeholder, element.firstChild); // Preload image

        var img = new Image();

        img.onload = function () {
          // Fade placeholder out and remove when loaded
          placeholder.style.opacity = '0';
          setTimeout(function () {
            return placeholder.remove();
          }, 500);
        };

        img.onerror = function () {
          // If loading fails, remove the placeholder after a short delay
          placeholder.style.opacity = '0';
          setTimeout(function () {
            return placeholder.remove();
          }, 500);
        };

        img.src = bgUrl;
      }

      element.dataset.bgInitialized = 'true';
    }
  });
} // Utility: Wait for transition


function waitForTransition(element) {
  return new Promise(function (resolve) {
    try {
      if (!element) return resolve();
      var style = getComputedStyle(element); // transitionDuration / transitionDelay may be comma-separated lists

      var durParts = (style.transitionDuration || '0s').split(',').map(function (s) {
        return s.trim();
      });
      var delayParts = (style.transitionDelay || '0s').split(',').map(function (s) {
        return s.trim();
      });

      var toMs = function toMs(s) {
        if (!s) return 0; // supports 'ms' and 's'

        if (s.endsWith('ms')) return parseFloat(s);
        if (s.endsWith('s')) return parseFloat(s) * 1000;
        return parseFloat(s) || 0;
      };

      var totals = durParts.map(function (d, i) {
        return toMs(d) + toMs(delayParts[i] || delayParts[0] || '0s');
      });
      var max = Math.max.apply(Math, [0].concat(_toConsumableArray(totals)));
      var timeout = Math.ceil(max) + 80; // small safety margin

      if (timeout === 80) {
        // No transition duration -> resolve next frame
        requestAnimationFrame(resolve);
        return;
      }

      var resolved = false;

      var onEnd = function onEnd(ev) {
        if (ev && ev.target !== element) return; // ignore child transitions

        if (resolved) return;
        resolved = true;
        element.removeEventListener('transitionend', onEnd);
        clearTimeout(timer);
        resolve();
      };

      element.addEventListener('transitionend', onEnd);
      var timer = setTimeout(function () {
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
} // Ensure there is a `.screen` element on initial load and mark it active


function ensureInitialScreen() {
  var screen = document.querySelector('.screen');

  if (!screen) {
    // Try common main selectors
    screen = document.querySelector('main') || document.querySelector('div[role="main"]') || document.querySelector('body > div');

    if (screen) {
      screen.classList.add('screen');
    }
  }

  if (screen && !screen.classList.contains('active')) {
    // Small timeout to allow other scripts/styles to initialize
    requestAnimationFrame(function () {
      return screen.classList.add('active');
    });
  }
} // Inject floating Prev/Next buttons according to a simple app flow


function injectFlowButtons() {
  // Define the linear app flow (first -> next -> ...)
  var flow = ['welcome home screen.html', 'map dashboard.html', 'personalize routes.html', 'fuel station finder.html', 'report road condition.html', 'road details.html', 'settings.html'];
  var current = decodeURIComponent(window.location.pathname.split('/').pop() || '');
  var idx = flow.indexOf(current); // If current page isn't in flow, don't show buttons

  if (idx === -1) return;
  var container = document.createElement('div');
  container.setAttribute('aria-hidden', 'false');
  container.style.position = 'fixed';
  container.style.right = '18px';
  container.style.bottom = '18px';
  container.style.zIndex = '10010';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '8px';

  var makeButton = function makeButton(label, href, title) {
    var a = document.createElement('a');
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
    var prev = makeButton("\u2190", flow[idx - 1], 'Previous');
    container.appendChild(prev);
  }

  if (idx < flow.length - 1) {
    var next = makeButton("\u2192", flow[idx + 1], 'Next');
    container.appendChild(next);
  }

  document.body.appendChild(container); // Add a small CSS rule for hover/focus states to match site styles

  var style = document.createElement('style');
  style.textContent = "\n        .flow-nav-btn:hover, .flow-nav-btn:focus { transform: translateY(-2px); background: rgba(6,182,212,0.95); color: #071226; }\n    ";
  document.head.appendChild(style);
} // Map placeholder anchors (href="#") to real routes using heuristics


function mapPlaceholderLinkToRoute(link) {
  // If the element declares an explicit data-route, use it
  var dataRoute = link.dataset.route;
  if (dataRoute) return dataRoute; // Use aria-label or title if available

  var label = (link.getAttribute('aria-label') || link.title || link.textContent || '').trim().toLowerCase();
  if (!label) return null; // Heuristic mapping - extend this as needed

  var map = {
    'map': 'map dashboard.html',
    'fuel': 'fuel station finder.html',
    'routes': 'personalize routes.html',
    'report': 'report road condition.html',
    'settings': 'settings.html',
    'home': 'welcome home screen.html',
    'start now': 'map dashboard.html',
    'i have an account': 'map dashboard.html'
  }; // try direct match

  if (map[label]) return map[label]; // try first word

  var first = label.split(/[\s\-]+/)[0];
  if (map[first]) return map[first];
  return null;
}