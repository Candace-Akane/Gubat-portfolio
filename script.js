(function () {
    'use strict';

    var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var finePointer = !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);

    function $(s, r) { return (r || document).querySelector(s); }
    function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

    
    var toggle = $('#navToggle');
    var links = $('#navLinks');
    function closeMenu() {
        if (!toggle || !links) return;
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
        links.classList.remove('open');
    }
    if (toggle && links) {
        toggle.addEventListener('click', function () {
            var open = toggle.getAttribute('aria-expanded') === 'true';
            toggle.setAttribute('aria-expanded', String(!open));
            toggle.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
            links.classList.toggle('open', !open);
        });
    }

    
    $$('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (e) {
            var id = a.getAttribute('href').slice(1);
            var target = id ? document.getElementById(id) : null;
            if (!target) return;
            e.preventDefault();
            closeMenu();
            target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        });
    });

    
    var bar = $('#progress');
    var toTop = $('#toTop');
    var ticking = false;
    function onScroll() {
        var de = document.documentElement;
        var y = window.pageYOffset || de.scrollTop || 0;
        var max = de.scrollHeight - de.clientHeight;
        if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
        if (toTop) toTop.classList.toggle('show', y > 500);
        ticking = false;
    }
    window.addEventListener('scroll', function () {
        if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
    }, { passive: true });
    onScroll();
    if (toTop) {
        toTop.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
        });
    }

    
    $$('.stagger').forEach(function (parent) {
        Array.prototype.forEach.call(parent.children, function (child, i) {
            child.classList.add('reveal');
            child.style.setProperty('--d', (i * 0.08) + 's');
        });
    });

   
    function countUp(el) {
        var end = parseInt(el.getAttribute('data-count'), 10);
        if (isNaN(end) || reduce) return;
        var start = null;
        var dur = 1200;
        el.textContent = '0';
        function step(t) {
            if (start === null) start = t;
            var p = Math.min(1, (t - start) / dur);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = String(Math.round(end * eased));
            if (p < 1) window.requestAnimationFrame(step);
            else el.textContent = String(end);
        }
        window.requestAnimationFrame(step);
    }

    var revealEls = $$('.reveal, .section-title');
    if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (!en.isIntersecting) return;
                en.target.classList.add('in');
                $$('[data-count]', en.target).forEach(countUp);
                io.unobserve(en.target);
            });
        }, { threshold: 0.15 });
        revealEls.forEach(function (el) { io.observe(el); });
    } else {
        revealEls.forEach(function (el) { el.classList.add('in'); });
    }

    var navItems = $$('#navLinks a');
    if ('IntersectionObserver' in window && navItems.length) {
        var so = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (!en.isIntersecting) return;
                navItems.forEach(function (a) {
                    a.parentNode.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id);
                });
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        ['home', 'about', 'experience', 'projects', 'skills', 'contact'].forEach(function (id) {
            var s = document.getElementById(id);
            if (s) so.observe(s);
        });
    }


    $$('.card, .skills li, .stat, .certs li, .duty').forEach(function (el) {
        var tilt = el.classList.contains('tilt') && finePointer && !reduce;
        el.addEventListener('pointermove', function (e) {
            var r = el.getBoundingClientRect();
            var x = e.clientX - r.left;
            var y = e.clientY - r.top;
            el.style.setProperty('--mx', x + 'px');
            el.style.setProperty('--my', y + 'px');
            if (tilt) {
                var rx = ((y / r.height) - 0.5) * -8;
                var ry = ((x / r.width) - 0.5) * 8;
                el.style.transition = 'transform .12s ease-out, border-color .4s, box-shadow .4s, translate .4s';
                el.style.transform = 'perspective(700px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
            }
        });
        el.addEventListener('pointerleave', function () {
            if (tilt) {
                el.style.transition = '';
                el.style.transform = '';
            }
        });
    });

    var copyBtn = $('#copyEmail');
    if (copyBtn) {
        var label = copyBtn.textContent;
        var timer = null;
        var done = function (ok) {
            copyBtn.textContent = ok ? 'Copied!' : 'Select and copy';
            clearTimeout(timer);
            timer = setTimeout(function () { copyBtn.textContent = label; }, 1800);
        };
        var fallback = function () {
            var el = $('#emailText');
            try {
                if (el && window.getSelection) {
                    var range = document.createRange();
                    range.selectNodeContents(el);
                    var sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            } catch (err) {  }
            done(false);
        };
        copyBtn.addEventListener('click', function () {
            var text = copyBtn.getAttribute('data-copy');
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(function () { done(true); }, fallback);
            } else {
                fallback();
            }
        });
    }


    var canvas = $('#net');
    if (canvas && canvas.getContext) {
        var ctx = canvas.getContext('2d');
        var w = 0, h = 0, dpr = 1, dots = [];
        var mouse = { x: -9999, y: -9999 };
        var running = false;

        var resize = function () {
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            w = window.innerWidth;
            h = window.innerHeight;
            canvas.width = Math.floor(w * dpr);
            canvas.height = Math.floor(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            var count = Math.max(24, Math.min(70, Math.floor((w * h) / 24000)));
            dots = [];
            for (var i = 0; i < count; i++) {
                dots.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    vx: (Math.random() - 0.5) * 0.45,
                    vy: (Math.random() - 0.5) * 0.45,
                    r: 1 + Math.random() * 1.6
                });
            }
        };

        var draw = function () {
            ctx.clearRect(0, 0, w, h);
            var i, j, a, b, dx, dy, d;
            for (i = 0; i < dots.length; i++) {
                a = dots[i];
                if (!reduce) {
                    a.x += a.vx;
                    a.y += a.vy;
                    if (a.x < 0 || a.x > w) a.vx *= -1;
                    if (a.y < 0 || a.y > h) a.vy *= -1;
                }
                ctx.beginPath();
                ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(88, 245, 88, 0.75)';
                ctx.fill();
                for (j = i + 1; j < dots.length; j++) {
                    b = dots[j];
                    dx = a.x - b.x;
                    dy = a.y - b.y;
                    d = Math.sqrt(dx * dx + dy * dy);
                    if (d < 130) {
                        ctx.strokeStyle = 'rgba(88, 245, 88, ' + (0.22 * (1 - d / 130)).toFixed(3) + ')';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
                dx = a.x - mouse.x;
                dy = a.y - mouse.y;
                d = Math.sqrt(dx * dx + dy * dy);
                if (d < 160) {
                    ctx.strokeStyle = 'rgba(0, 229, 255, ' + (0.45 * (1 - d / 160)).toFixed(3) + ')';
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.stroke();
                    if (!reduce) {
                        a.x += (mouse.x - a.x) * 0.012;
                        a.y += (mouse.y - a.y) * 0.012;
                    }
                }
            }
        };

        var loop = function () {
            if (!running) return;
            draw();
            window.requestAnimationFrame(loop);
        };

        resize();
        window.addEventListener('resize', function () { resize(); if (reduce) draw(); });
        window.addEventListener('pointermove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
        window.addEventListener('pointerleave', function () { mouse.x = -9999; mouse.y = -9999; });
        document.addEventListener('visibilitychange', function () {
            if (reduce) return;
            if (document.hidden) { running = false; }
            else if (!running) { running = true; loop(); }
        });

        if (reduce) {
            draw();
        } else {
            running = true;
            loop();
        }
    }
})();
