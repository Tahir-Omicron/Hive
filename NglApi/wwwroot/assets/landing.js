/* =============================================================================
 * Hive — landing səhifəsinin davranışı
 *   · mobil menyu
 *   · yumşaq keçid (smooth scroll) + aktiv bölmənin işarələnməsi
 *   · scroll reveal animasiyası
 *   · header kölgəsi
 *   · əlaqə forması (mailto)
 * ========================================================================== */

(function () {
  'use strict';

  var H = window.Hive;
  var I = window.HiveI18n;
  // Naviqasiyada keçidi olan bölmələr
  var SECTIONS = ['home', 'about', 'contact'];
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var menuBtn = H.el('menuBtn');
  var mobileMenu = H.el('mobileMenu');

  /* ---------- Mobil menyu -------------------------------------------------- */

  function closeMenu() {
    if (!menuBtn || !mobileMenu) return;
    menuBtn.setAttribute('aria-expanded', 'false');
    mobileMenu.classList.remove('is-open');
  }

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', function () {
      var open = menuBtn.getAttribute('aria-expanded') === 'true';
      menuBtn.setAttribute('aria-expanded', open ? 'false' : 'true');
      mobileMenu.classList.toggle('is-open', !open);
    });

    document.addEventListener('click', function (event) {
      if (!mobileMenu.classList.contains('is-open')) return;
      if (event.target.closest('#mobileMenu') || event.target.closest('#menuBtn')) return;
      closeMenu();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeMenu();
    });

    if (typeof window.matchMedia === 'function') {
      var desktop = window.matchMedia('(min-width: 1024px)');
      if (desktop && typeof desktop.addEventListener === 'function') {
        desktop.addEventListener('change', function (e) { if (e.matches) closeMenu(); });
      }
    }
  }

  /* ---------- Yumşaq keçid ------------------------------------------------- */

  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-link'));

  function setActive(id) {
    navLinks.forEach(function (link) {
      link.classList.toggle('is-active', link.getAttribute('href') === '#' + id);
    });
  }

  function scrollToSection(id) {
    var target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    setActive(id);
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    var href = link.getAttribute('href');
    if (!href || href === '#') return;

    var id = href.slice(1);
    if (SECTIONS.indexOf(id) === -1) return;

    link.addEventListener('click', function (event) {
      event.preventDefault();
      closeMenu();
      history.replaceState(null, '', '#' + id);
      scrollToSection(id);
    });
  });

  /* ---------- Scroll reveal ------------------------------------------------ */

  (function initReveal() {
    var nodes = document.querySelectorAll('[data-reveal]');
    if (!nodes.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      nodes.forEach(function (n) { n.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);   // performans: bir dəfə göstər
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    nodes.forEach(function (n) { observer.observe(n); });
  })();

  /* ---------- Header kölgəsi ----------------------------------------------- */

  (function initHeader() {
    var sentinel = H.el('scrollSentinel');
    var header = H.el('siteHeader');
    if (!sentinel || !header || !('IntersectionObserver' in window)) return;

    new IntersectionObserver(function (entries) {
      header.classList.toggle('is-scrolled', !entries[0].isIntersecting);
    }, { threshold: 0 }).observe(sentinel);
  })();

  /* ---------- Aktiv bölmə (scroll spy) ------------------------------------- */

  (function initScrollSpy() {
    if (!('IntersectionObserver' in window)) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    SECTIONS.forEach(function (id) {
      var section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  })();

  /* ---------- Əlaqə forması, kopyalama və sayğac --------------------------- */

  var contactForm = H.el('contactForm');
  var copyEmailBtn = H.el('copyEmailBtn');
  var contactMessage = H.el('contactMessage');
  var contactCharCount = H.el('contactCharCount');

  // E-poçtu bir kliklə kopyala
  if (copyEmailBtn) {
    copyEmailBtn.addEventListener('click', function () {
      H.copyToClipboard('destek@hive.az').then(function () {
        H.toast(I.t('contact.copied') || 'E-poçt kopyalandı!', 'success');
      });
    });
  }

  // Canlı simvol sayğacı
  if (contactMessage && contactCharCount) {
    var updateCounter = function () {
      var len = contactMessage.value.length;
      contactCharCount.textContent = len + ' / 800';
      contactCharCount.classList.toggle('is-near-limit', len >= 720);
    };
    contactMessage.addEventListener('input', updateCounter);
    updateCounter();
  }

  if (contactForm) {
    contactForm.addEventListener('submit', function (event) {
      event.preventDefault();

      var name = H.el('contactName').value.trim();
      var email = H.el('contactEmail').value.trim();
      var text = contactMessage ? contactMessage.value.trim() : '';

      // Seçilmiş mövzu
      var selectedTopicRadio = document.querySelector('input[name="contactTopic"]:checked');
      var topicKey = selectedTopicRadio ? selectedTopicRadio.value : 'general';
      var topicLabels = {
        general: I.t('contact.topic.general') || 'Ümumi sual',
        university: I.t('contact.topic.uni') || 'Universitet əlavə et',
        technical: I.t('contact.topic.tech') || 'Texniki dəstək',
        partnership: I.t('contact.topic.partner') || 'Əməkdaşlıq'
      };
      var topicText = topicLabels[topicKey] || topicLabels.general;

      var checks = [
        [H.el('contactName'), H.el('contactNameError'), name ? '' : (I.t('contact.form.name') || 'Adınızı yazın.')],
        [H.el('contactEmail'), H.el('contactEmailError'), H.validate.email(email)],
        [contactMessage, H.el('contactMessageError'), text ? '' : (I.t('contact.form.message') || 'Mesajınızı yazın.')]
      ];

      var firstInvalid = null;
      checks.forEach(function (row) {
        H.setFieldError(row[0], row[1], row[2]);
        if (row[2] && !firstInvalid) firstInvalid = row[0];
      });

      if (firstInvalid) { firstInvalid.focus(); return; }

      var subject = encodeURIComponent('Hive [' + topicText.replace(/^[^\w\u00C0-\u024F\u1E00-\u1EFF]+/g, '').trim() + '] — ' + name);
      var body = encodeURIComponent(
        'Müraciət mövzusu: ' + topicText + '\n' +
        'Göndərən: ' + name + ' (' + email + ')\n' +
        'Tarix: ' + new Date().toLocaleString() + '\n\n' +
        text
      );

      window.location.href = 'mailto:destek@hive.az?subject=' + subject + '&body=' + body;
      H.toast(I.t('contact.form.note'), 'info');
    });
  }

  /* ---------- Universitet Ardıcıl Lupa Vitrini & Filtrləmə ----------------- */

  (function initUniversitySpotlight() {
    var stage = H.el('uniSpotlightContainer');
    var filtersContainer = H.el('uniFilters');
    var prevBtn = H.el('uniPrevBtn');
    var nextBtn = H.el('uniNextBtn');
    var counterEl = H.el('uniCounter');
    var thumbTrack = H.el('uniThumbTrack');
    var quickSearchInput = H.el('uniQuickSearch');
    if (!stage) return;

    var RAW_LIST = (window.HIVE_UNIVERSITIES || []).slice();
    if (!RAW_LIST.length) return;

    var currentFilter = 'all';
    var searchQuery = '';
    var currentIndex = 0;
    var autoPlayTimer = null;

    function getFilteredList() {
      var list = RAW_LIST;
      if (currentFilter !== 'all') {
        list = list.filter(function (item) { return item.category === currentFilter; });
      }
      if (searchQuery) {
        var q = searchQuery.toLowerCase().trim();
        list = list.filter(function (item) {
          return (item.name && item.name.toLowerCase().indexOf(q) !== -1) ||
                 (item.short && item.short.toLowerCase().indexOf(q) !== -1) ||
                 (item.categoryLabel && item.categoryLabel.toLowerCase().indexOf(q) !== -1);
        });
      }
      return list;
    }

    function renderSpotlight(animate) {
      var list = getFilteredList();
      if (!list.length) {
        if (counterEl) counterEl.textContent = '0 / 0';
        if (thumbTrack) thumbTrack.innerHTML = '';
        stage.innerHTML =
          '<div class="py-14 text-center text-muted">' +
            '<div class="mx-auto mb-3 h-12 w-12 rounded-full border border-line bg-[var(--c-surface)] flex items-center justify-center text-muted">' +
              '<svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>' +
            '</div>' +
            '<p class="text-sm font-semibold text-[var(--c-text)]">Axtarışa uyğun universitet tapılmadı</p>' +
            '<p class="text-xs text-muted mt-1">Digər açar sözü sınayın və ya filtrləri sıfırlayın.</p>' +
            '<button type="button" class="btn btn-outline !py-1.5 !px-3 text-xs mt-4" id="clearUniSearchBtn">Axtarışı təmizlə</button>' +
          '</div>';
        var clearBtn = document.getElementById('clearUniSearchBtn');
        if (clearBtn) {
          clearBtn.addEventListener('click', function () {
            if (quickSearchInput) quickSearchInput.value = '';
            searchQuery = '';
            currentIndex = 0;
            renderSpotlight(true);
            resetAutoPlay();
          });
        }
        return;
      }
      if (currentIndex >= list.length) currentIndex = 0;
      if (currentIndex < 0) currentIndex = list.length - 1;

      var item = list[currentIndex];

      if (counterEl) {
        counterEl.textContent = (currentIndex + 1) + ' / ' + list.length;
      }

      var contentHtml =
        '<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">' +
          '<!-- Sol: Kampus binası və Lupa fokus vizualı -->' +
          '<div class="lg:col-span-7 relative group overflow-hidden rounded-2xl border border-line shadow-md bg-[var(--c-surface-2)] aspect-video">' +
            '<img src="' + item.building + '" alt="' + item.name + '" class="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />' +
            '<div class="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"></div>' +
            '<!-- Lupa İşığı Nişanı -->' +
            '<div class="absolute top-4 left-4 flex items-center gap-2">' +
              '<span class="uni-lupa-lens-badge">' +
                '<svg class="h-3.5 w-3.5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>' +
                '<span>Kampus Baxışı</span>' +
              '</span>' +
              '<span class="badge badge-accent shadow-sm">' + (item.categoryLabel || item.short) + '</span>' +
            '</div>' +
            '<!-- Alt Məlumat -->' +
            '<div class="absolute bottom-4 left-4 right-4 text-white">' +
              '<p class="text-xs font-medium text-white/80">' + (item.credit || item.name) + '</p>' +
            '</div>' +
          '</div>' +

          '<!-- Sağ: Rəsmi Gerb, Statistikalar və Fəaliyyət -->' +
          '<div class="lg:col-span-5 flex flex-col justify-between space-y-6">' +
            '<div>' +
              '<div class="flex items-center gap-4">' +
                '<div class="h-16 w-16 shrink-0 rounded-2xl border border-line bg-[var(--c-surface)] p-2 shadow-sm flex items-center justify-center">' +
                  '<img src="' + item.logo + '" alt="' + item.short + ' Gerbi" class="max-h-full max-w-full object-contain" />' +
                '</div>' +
                '<div>' +
                  '<span class="text-xs font-black uppercase tracking-widest text-accent">' + item.short + '</span>' +
                  '<h3 class="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--c-text)] mt-0.5 leading-snug">' + item.name + '</h3>' +
                '</div>' +
              '</div>' +

              '<div class="mt-5 space-y-3">' +
                '<div class="flex items-center gap-2 text-sm font-semibold text-[var(--c-text)]">' +
                  '<span class="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm animate-pulse"></span>' +
                  '<span>' + (item.students || 'Aktiv Tələbə İcması') + '</span>' +
                '</div>' +
                '<p class="text-xs text-muted leading-relaxed">' +
                  'Universitet tələbələri və abituriyentləri üçün anonim sual-cavab platforması, fakültələr üzrə canlı müzakirələr və imtahan dərslikləri.' +
                '</p>' +
              '</div>' +
            '</div>' +

            '<div class="pt-4 border-t border-line flex flex-wrap items-center gap-3">' +
              '<a href="registerpage.html" class="btn btn-accent flex-1 text-center text-xs !py-2.5 font-bold">' +
                'Bu Universitetlə Qeydiyyat' +
              '</a>' +
              '<a href="loginpage.html" class="btn btn-outline text-xs !py-2.5">' +
                'Daxil Ol' +
              '</a>' +
            '</div>' +
          '</div>' +
        '</div>';

      stage.innerHTML = contentHtml;

      renderThumbTrack(list);
    }

    function renderThumbTrack(list) {
      if (!thumbTrack) return;
      thumbTrack.innerHTML = '';

      list.forEach(function (item, idx) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'uni-thumb-item' + (idx === currentIndex ? ' is-active' : '');
        btn.title = item.name + ' (' + item.short + ')';
        btn.setAttribute('aria-label', item.name);

        btn.innerHTML = '<img src="' + item.logo + '" alt="' + item.short + '" />';

        btn.addEventListener('click', function () {
          if (window.HiveAudio) window.HiveAudio.playClick();
          currentIndex = idx;
          renderSpotlight(true);
          resetAutoPlay();
        });

        thumbTrack.appendChild(btn);
      });
    }

    function next() {
      var list = getFilteredList();
      currentIndex = (currentIndex + 1) % list.length;
      renderSpotlight(true);
    }

    function prev() {
      var list = getFilteredList();
      currentIndex = (currentIndex - 1 + list.length) % list.length;
      renderSpotlight(true);
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        if (window.HiveAudio) window.HiveAudio.playClick();
        next();
        resetAutoPlay();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        if (window.HiveAudio) window.HiveAudio.playClick();
        prev();
        resetAutoPlay();
      });
    }

    function startAutoPlay() {
      stopAutoPlay();
      autoPlayTimer = setInterval(next, 4800);
    }

    function stopAutoPlay() {
      if (autoPlayTimer) clearInterval(autoPlayTimer);
      autoPlayTimer = null;
    }

    function resetAutoPlay() {
      stopAutoPlay();
      startAutoPlay();
    }

    stage.addEventListener('mouseenter', stopAutoPlay);
    stage.addEventListener('mouseleave', startAutoPlay);

    if (filtersContainer) {
      filtersContainer.addEventListener('click', function (e) {
        var btn = e.target.closest('button[data-cat]');
        if (!btn) return;
        currentFilter = btn.getAttribute('data-cat') || 'all';
        currentIndex = 0;

        filtersContainer.querySelectorAll('button[data-cat]').forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
        });

        if (window.HiveAudio) window.HiveAudio.playClick();
        renderSpotlight(true);
        resetAutoPlay();
      });
    }

    if (quickSearchInput) {
      quickSearchInput.addEventListener('input', function (e) {
        searchQuery = (e.target.value || '').trim();
        currentIndex = 0;
        renderSpotlight(true);
        resetAutoPlay();
      });
    }

    renderSpotlight(false);
    startAutoPlay();
  })();

  /* ---------- İl ------------------------------------------------------------ */

  H.setText(H.el('year'), new Date().getFullYear());
})();
