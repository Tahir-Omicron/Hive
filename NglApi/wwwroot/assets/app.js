/* =============================================================================
 * Hive — Tələbə və Abituriyent Sosial Şəbəkəsi
 *   Home   : Paylaşım axını + AI Köməkçilər + Anonim bildirişlər
 *   Direct : Söhbətlər və mesajlaşma (İpucu açılışı daxil)
 *   Search : Tələbə və Abituriyent axtarışı
 *   Store  : Sikkə balansı, Bank kartı ilə ödəniş və Faktura tarixçəsi
 *   Profile: Şəxsi profil + Redaktə + Paylaşım
 * Marşrutlar: #home · #direct · #direct/<username> · #search · #store · #profile
 * ========================================================================== */

(function () {
  'use strict';

  var H = window.Hive;
  var I = window.HiveI18n;

  if (!H.requireLogin()) return;

  var VIEWS = ['home', 'direct', 'search', 'store', 'profile'];
  var PAGE_TITLES = {
    home: 'Ana Səhifə (Kampus Axını)',
    direct: 'Mesajlar & Söhbətlər',
    search: 'Tələbə & Abituriyent Axtarışı',
    store: 'Hive Mağaza & Balans',
    profile: 'Şəxsi Profil'
  };

  var state = {
    user: H.getStoredUser(),
    conversations: [],
    aiAccounts: [],
    aiNames: {},
    activeThread: '',
    activeClueMessage: null
  };

  /* ---------- Yan Menyu (Left Collapsible Sidebar) -------------------------- */

  var sidebar = H.el('appSidebar');
  var collapseBtn = H.el('sidebarCollapseBtn');
  var isCollapsed = localStorage.getItem('hive.sidebarCollapsed') === 'true';

  function applySidebarState() {
    if (!sidebar) return;
    sidebar.classList.toggle('is-collapsed', isCollapsed);
    var icon = H.el('collapseIcon');
    if (icon) {
      icon.style.transform = isCollapsed ? 'rotate(180deg)' : 'none';
    }
  }

  if (collapseBtn) {
    collapseBtn.addEventListener('click', function () {
      isCollapsed = !isCollapsed;
      localStorage.setItem('hive.sidebarCollapsed', isCollapsed ? 'true' : 'false');
      applySidebarState();
    });
  }

  // Mobil menyu açılıb-bağlanması
  var openMobileBtn = H.el('sidebarOpenMobile');
  var closeMobileBtn = H.el('sidebarCloseMobile');
  var backdrop = H.el('sidebarBackdrop');

  function openMobileSidebar() {
    if (sidebar) sidebar.classList.remove('-translate-x-full');
    if (backdrop) {
      backdrop.classList.remove('opacity-0', 'pointer-events-none');
      backdrop.classList.add('opacity-100', 'pointer-events-auto');
    }
  }

  function closeMobileSidebar() {
    if (sidebar) sidebar.classList.add('-translate-x-full');
    if (backdrop) {
      backdrop.classList.add('opacity-0', 'pointer-events-none');
      backdrop.classList.remove('opacity-100', 'pointer-events-auto');
    }
  }

  if (openMobileBtn) openMobileBtn.addEventListener('click', openMobileSidebar);
  if (closeMobileBtn) closeMobileBtn.addEventListener('click', closeMobileSidebar);
  if (backdrop) backdrop.addEventListener('click', closeMobileSidebar);

  applySidebarState();

  /* ---------- Naviqasiya & Marşrutlar ---------------------------------------- */

  function showView(name) {
    VIEWS.forEach(function (v) { H.show(H.el('view-' + v), v === name); });
    
    // Bütün aktiv düymələri sinxronlaşdır
    document.querySelectorAll('[data-go]').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.dataset.go === name);
    });

    var heading = H.el('pageHeading');
    if (heading) heading.textContent = PAGE_TITLES[name] || 'Hive';

    closeMobileSidebar();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function go(name, username) {
    var hash = '#' + name + (username ? '/' + encodeURIComponent(username) : '');
    if (location.hash === hash) route();
    else location.hash = hash;
  }

  document.querySelectorAll('[data-go]').forEach(function (btn) {
    btn.addEventListener('click', function () { go(btn.dataset.go); });
  });

  function route() {
    var hash = (location.hash || '#home').replace(/^#/, '');
    var parts = hash.split('/');
    var name = VIEWS.indexOf(parts[0]) !== -1 ? parts[0] : 'home';

    showView(name);

    if (name === 'home') { loadPosts(); loadNotifications(); loadAiAccounts(); }
    if (name === 'direct') {
      loadConversations();
      if (parts[1]) openThread(decodeURIComponent(parts.slice(1).join('/')));
    }
    if (name === 'store') {
      loadTransactions();
      updateWalletUI();
    }
    if (name === 'profile') { renderOwnProfile(); loadAiAccounts(); }
  }

  window.addEventListener('hashchange', route);

  /* ---------- Köməkçilər ---------------------------------------------------- */

  function avatarNode(text, isAi, size, avatarUrl) {
    var span = document.createElement('span');
    span.className = (size || 'h-10 w-10 text-sm') +
      ' relative grid shrink-0 place-items-center overflow-hidden rounded-xl font-bold ' +
      (isAi ? 'bg-[var(--c-ai-soft)] text-[var(--c-ai)]' : 'bg-[var(--c-accent-soft)] text-[var(--c-accent)]');

    var letter = document.createElement('span');
    letter.textContent = (text || '?').charAt(0).toUpperCase();
    span.append(letter);

    var src = H.avatarSrc(avatarUrl);
    if (src) {
      var img = document.createElement('img');
      img.src = src;
      img.alt = '';
      img.className = 'absolute inset-0 h-full w-full object-cover';
      img.onerror = function () {
        img.style.display = 'none';
        letter.style.display = '';
      };
      letter.style.display = 'none';
      span.append(img);
    }

    return span;
  }

  function aiBadgeNode() {
    var span = document.createElement('span');
    span.className = 'badge badge-ai';
    span.textContent = 'AI Bot';
    return span;
  }

  function isAi(username) { return Boolean(state.aiNames[username]); }

  /* ---------- Home: Paylaşım axını ------------------------------------------ */

  function renderPosts(posts) {
    var list = H.el('feedList');
    list.textContent = '';

    H.show(H.el('feedEmpty'), posts.length === 0);
    H.show(list, posts.length > 0);

    posts.forEach(function (post, index) {
      var li = document.createElement('li');
      li.className = 'surface border border-line rounded-2xl p-5 shadow-sm transition hover:shadow-md bubble-in';
      li.style.animationDelay = Math.min(index * 35, 200) + 'ms';

      var header = document.createElement('div');
      header.className = 'flex items-center justify-between gap-3';

      var authorWrap = document.createElement('div');
      authorWrap.className = 'flex items-center gap-3 min-w-0';

      var av = avatarNode(post.authorFullName || post.authorUsername, post.isAuthorAi, 'h-10 w-10 text-sm', post.authorAvatarUrl);
      authorWrap.append(av);

      var authorMeta = document.createElement('div');
      authorMeta.className = 'min-w-0';

      var nameLine = document.createElement('p');
      nameLine.className = 'flex items-center gap-2 truncate text-sm font-bold';
      nameLine.append(document.createTextNode(post.authorFullName || '@' + post.authorUsername));
      if (post.isAuthorAi) nameLine.append(aiBadgeNode());

      authorMeta.append(nameLine);

      var subLine = document.createElement('p');
      subLine.className = 'truncate text-xs text-muted';
      
      var details = '@' + post.authorUsername;
      if (post.authorUniversity) details += ' · ' + post.authorUniversity;
      if (post.authorCourseYear) details += ' · ' + H.courseLabel(post.authorCourseYear);
      subLine.textContent = details;
      authorMeta.append(subLine);

      authorWrap.append(authorMeta);
      header.append(authorWrap);

      var timeSpan = document.createElement('span');
      timeSpan.className = 'text-xs text-muted tabular-nums shrink-0';
      timeSpan.textContent = H.relativeTime(post.createdAt);
      header.append(timeSpan);

      var body = document.createElement('p');
      body.className = 'mt-3 text-sm leading-relaxed whitespace-pre-wrap break-words text-[var(--c-text)]';
      body.textContent = post.content;

      var footer = document.createElement('div');
      footer.className = 'mt-4 flex items-center justify-between border-t border-line/60 pt-3 text-xs';

      var replyBtn = document.createElement('button');
      replyBtn.type = 'button';
      replyBtn.className = 'btn btn-outline !px-3 !py-1 text-xs font-semibold flex items-center gap-1.5';
      replyBtn.innerHTML = '<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/></svg> Mesaj yaz';
      replyBtn.addEventListener('click', function () { go('direct', post.authorUsername); });

      footer.append(replyBtn);

      if (state.user && state.user.id === post.authorId) {
        var delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'btn btn-ghost !px-2.5 !py-1 text-rose-500 hover:bg-rose-500/10 text-xs font-semibold';
        delBtn.textContent = 'Sil';
        delBtn.addEventListener('click', function () {
          delBtn.disabled = true;
          H.api.deletePost(post.id)
            .then(function () { li.remove(); H.toast('Paylaşım silindi.', 'info'); })
            .catch(function (err) { delBtn.disabled = false; H.toast(err.message, 'error'); });
        });
        footer.append(delBtn);
      }

      li.append(header, body, footer);
      list.append(li);
    });
  }

  function loadPosts() {
    H.show(H.el('feedLoading'), true);
    H.show(H.el('feedError'), false);

    H.api.posts(30)
      .then(function (res) { renderPosts(Array.isArray(res) ? res : []); })
      .catch(function (err) {
        var errBox = H.el('feedError');
        H.setText(errBox, err.message);
        H.show(errBox, true);
      })
      .then(function () { H.show(H.el('feedLoading'), false); });
  }

  if (H.el('feedRefresh')) H.el('feedRefresh').addEventListener('click', loadPosts);

  var postForm = H.el('postComposer');
  if (postForm) {
    var postInput = H.el('postInput');
    var postCount = H.el('postCount');

    if (postInput && postCount) {
      postInput.addEventListener('input', function () {
        var len = postInput.value.length;
        postCount.textContent = len + '/1000';
      });
    }

    postForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var content = postInput.value.trim();
      if (!content) return;

      var subBtn = H.el('postSubmit');
      H.setLoading(subBtn, true, 'Paylaşılır...');

      H.api.createPost(content)
        .then(function () {
          postInput.value = '';
          if (postCount) postCount.textContent = '0/1000';
          loadPosts();
          H.toast('Paylaşımınız əlavə edildi.', 'success');
        })
        .catch(function (err) { H.toast(err.message, 'error'); })
        .then(function () { H.setLoading(subBtn, false); });
    });
  }

  /* ---------- Bildirişlər (Anonim Mesajlar) --------------------------------- */

  function renderNotifications(items) {
    var list = H.el('notifList');
    var empty = H.el('notifEmpty');
    var countBadge = H.el('notifCount');

    list.textContent = '';
    var len = items.length;
    if (countBadge) countBadge.textContent = len;

    if (len === 0) {
      H.show(empty, true);
      H.show(list, false);
      return;
    }

    H.show(empty, false);
    H.show(list, true);

    items.forEach(function (m) {
      var li = document.createElement('li');
      li.className = 'rounded-xl border border-line bg-[var(--c-surface)] p-3.5 shadow-sm space-y-2';

      var top = document.createElement('div');
      top.className = 'flex items-center justify-between text-xs text-muted';
      top.innerHTML = '<span class="font-bold text-accent">Anonim Sual</span><span>' + H.relativeTime(m.createdAt) + '</span>';

      var body = document.createElement('p');
      body.className = 'text-xs font-semibold leading-relaxed text-[var(--c-text)]';
      body.textContent = m.content;

      // İpucu status sətirləri
      var clueBox = document.createElement('div');
      clueBox.className = 'mt-2 space-y-1 text-[11px]';

      if (m.clueLevelRevealed >= 1 && m.deviceHint) {
        clueBox.innerHTML += '<div class="flex items-center gap-1.5 text-indigo-500 font-medium"><svg class="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/></svg><span>' + m.deviceHint + '</span></div>';
      }
      if (m.clueLevelRevealed >= 2 && m.locationHint) {
        clueBox.innerHTML += '<div class="flex items-center gap-1.5 text-rose-500 font-medium"><svg class="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg><span>' + m.locationHint + '</span></div>';
      }
      if (m.clueLevelRevealed >= 3 && m.universityHint) {
        clueBox.innerHTML += '<div class="flex items-center gap-1.5 text-emerald-500 font-medium"><svg class="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/></svg><span>' + m.universityHint + ' (' + (m.senderInitialHint || 'A') + ')</span></div>';
      }

      var bot = document.createElement('div');
      bot.className = 'pt-2 flex items-center justify-between border-t border-line/60';

      var clueBtn = document.createElement('button');
      clueBtn.type = 'button';
      clueBtn.className = 'btn btn-outline !py-1 !px-2.5 text-[11px] font-bold text-amber-500 border-amber-500/40 hover:bg-amber-500/10 flex items-center gap-1';
      clueBtn.innerHTML = '<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41M12 7a5 5 0 0 0-3 9h6a5 5 0 0 0-3-9z"/></svg> Kim yazıb?';
      clueBtn.addEventListener('click', function () { openClueModal(m); });

      var delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'btn btn-ghost !py-1 !px-2 text-[11px] text-muted hover:text-rose-500';
      delBtn.textContent = 'Sil';
      delBtn.addEventListener('click', function () {
        H.api.deleteMessage(m.id)
          .then(function () { li.remove(); H.toast('Mesaj silindi.', 'info'); })
          .catch(function (err) { H.toast(err.message, 'error'); });
      });

      bot.append(clueBtn, delBtn);
      li.append(top, body, clueBox, bot);
      list.append(li);
    });
  }

  function loadNotifications() {
    if (!state.user) return;
    H.api.inbox(state.user.username)
      .then(function (res) { renderNotifications(Array.isArray(res) ? res : []); })
      .catch(function () {});
  }

  /* ---------- AI Köməkçilər Siyahısı ---------------------------------------- */

  function renderAiAccounts() {
    var ul = H.el('aiList');
    var empty = H.el('aiEmpty');
    if (!ul) return;
    ul.textContent = '';

    if (!state.aiAccounts.length) {
      H.show(empty, true);
      return;
    }
    H.show(empty, false);

    state.aiAccounts.forEach(function (ai) {
      var li = document.createElement('li');
      li.className = 'flex items-center justify-between gap-2 rounded-xl p-2 hover:bg-[var(--c-surface-2)] transition';

      var left = document.createElement('div');
      left.className = 'flex items-center gap-2.5 min-w-0';

      var av = avatarNode(ai.fullName || ai.username, true, 'h-8 w-8 text-xs', ai.avatarUrl);
      left.append(av);

      var meta = document.createElement('div');
      meta.className = 'min-w-0';
      meta.innerHTML = '<p class="truncate text-xs font-bold text-[var(--c-text)]">' + (ai.fullName || ai.username) + '</p>' +
                       '<p class="truncate text-[10px] text-muted">' + ai.university + '</p>';
      left.append(meta);

      var chatBtn = document.createElement('button');
      chatBtn.type = 'button';
      chatBtn.className = 'btn btn-outline !py-1 !px-2 text-[11px] font-semibold shrink-0';
      chatBtn.textContent = 'Yazış';
      chatBtn.addEventListener('click', function () { go('direct', ai.username); });

      li.append(left, chatBtn);
      ul.append(li);
    });
  }

  function loadAiAccounts() {
    H.api.aiAccounts()
      .then(function (list) {
        state.aiAccounts = Array.isArray(list) ? list : [];
        state.aiNames = {};
        state.aiAccounts.forEach(function (a) { state.aiNames[a.username] = true; });
        renderAiAccounts();
      })
      .catch(function () {});
  }

  /* ---------- Direct (Söhbətlər & Thread) ----------------------------------- */

  function renderConversations(convs) {
    var ul = H.el('convList');
    var empty = H.el('convEmpty');
    ul.textContent = '';

    if (!convs.length) {
      H.show(empty, true);
      H.show(ul, false);
      return;
    }

    H.show(empty, false);
    H.show(ul, true);

    convs.forEach(function (c) {
      var li = document.createElement('li');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'flex w-full items-center gap-3 rounded-xl border border-line p-3 text-left transition hover:bg-[var(--c-surface-2)]' +
        (state.activeThread === c.partnerUsername ? ' bg-[var(--c-surface-2)] border-accent' : ' surface');

      var av = avatarNode(c.partnerFullName || c.partnerUsername, c.isPartnerAi, 'h-10 w-10 text-sm', c.partnerAvatarUrl);
      btn.append(av);

      var meta = document.createElement('div');
      meta.className = 'min-w-0 flex-1';

      var top = document.createElement('div');
      top.className = 'flex items-center justify-between gap-1';

      var nameP = document.createElement('p');
      nameP.className = 'truncate text-xs font-bold text-[var(--c-text)]';
      nameP.textContent = c.partnerFullName || ('@' + c.partnerUsername);
      top.append(nameP);

      var timeP = document.createElement('span');
      timeP.className = 'text-[10px] text-muted shrink-0';
      timeP.textContent = H.relativeTime(c.lastMessageAt);
      top.append(timeP);

      var snippet = document.createElement('p');
      snippet.className = 'truncate text-[11px] text-muted mt-0.5';
      snippet.textContent = c.lastMessageContent;

      meta.append(top, snippet);
      btn.append(meta);

      btn.addEventListener('click', function () { go('direct', c.partnerUsername); });
      li.append(btn);
      ul.append(li);
    });
  }

  function loadConversations() {
    H.show(H.el('convLoading'), true);
    H.api.conversations()
      .then(function (res) {
        state.conversations = Array.isArray(res) ? res : [];
        renderConversations(state.conversations);
      })
      .catch(function () {})
      .then(function () { H.show(H.el('convLoading'), false); });
  }

  function renderThread(messages) {
    var box = H.el('threadMessages');
    box.textContent = '';

    messages.forEach(function (m) {
      var isMine = Boolean(state.user && m.senderUsername === state.user.username);
      var wrap = document.createElement('div');
      wrap.className = 'flex flex-col ' + (isMine ? 'items-end' : 'items-start');

      var b = document.createElement('div');
      b.className = 'bubble ' + (isMine ? 'bubble-mine' : 'bubble-theirs');
      b.textContent = m.content;

      var ts = document.createElement('span');
      ts.className = 'text-[10px] text-muted mt-1 px-1';
      ts.textContent = H.relativeTime(m.createdAt);

      wrap.append(b, ts);
      box.append(wrap);
    });

    box.scrollTop = box.scrollHeight;
  }

  function openThread(username) {
    state.activeThread = username;
    H.show(H.el('threadPane'), true);
    H.show(H.el('threadPlaceholder'), false);

    H.setText(H.el('threadName'), '@' + username);
    H.setText(H.el('threadUsername'), '@' + username);

    H.api.thread(username)
      .then(function (res) { renderThread(Array.isArray(res) ? res : []); })
      .catch(function (err) { H.toast(err.message, 'error'); });
  }

  if (H.el('threadBack')) {
    H.el('threadBack').addEventListener('click', function () {
      H.show(H.el('threadPane'), false);
      H.show(H.el('threadPlaceholder'), true);
      go('direct');
    });
  }

  var threadForm = H.el('threadForm');
  if (threadForm) {
    threadForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = H.el('threadInput');
      var val = input.value.trim();
      if (!val || !state.activeThread) return;

      var subBtn = H.el('threadSubmit');
      H.setLoading(subBtn, true, '...');

      H.api.sendDirect(state.activeThread, val)
        .then(function () {
          input.value = '';
          return H.api.thread(state.activeThread);
        })
        .then(function (res) {
          renderThread(Array.isArray(res) ? res : []);
          loadConversations();
        })
        .catch(function (err) { H.toast(err.message, 'error'); })
        .then(function () { H.setLoading(subBtn, false); });
    });
  }

  /* ---------- Search (Axtarış) ----------------------------------------------- */

  var searchTimer = null;

  function renderSearchResults(list) {
    var ul = H.el('searchResults');
    ul.textContent = '';

    H.show(H.el('searchEmpty'), list.length === 0);
    H.show(ul, list.length > 0);

    list.forEach(function (u, index) {
      var li = document.createElement('li');
      var row = document.createElement('div');
      row.className = 'surface border border-line rounded-2xl flex items-center justify-between gap-3 p-3.5 bubble-in shadow-sm hover:border-accent transition';
      row.style.animationDelay = Math.min(index * 40, 200) + 'ms';

      var left = document.createElement('div');
      left.className = 'flex items-center gap-3 min-w-0';

      var av = avatarNode(u.fullName || u.username, u.isAi, 'h-10 w-10 text-sm', u.avatarUrl);
      left.append(av);

      var meta = document.createElement('div');
      meta.className = 'min-w-0';

      var nameLine = document.createElement('div');
      nameLine.className = 'flex items-center gap-2';

      var nameSpan = document.createElement('span');
      nameSpan.className = 'truncate text-xs font-bold text-[var(--c-text)]';
      nameSpan.textContent = u.fullName || ('@' + u.username);
      nameLine.append(nameSpan);

      if (u.isAi) nameLine.append(aiBadgeNode());
      if (u.isAbituriyent) {
        var abitBadge = document.createElement('span');
        abitBadge.className = 'badge badge-accent text-[10px]';
        abitBadge.textContent = 'Abituriyent • ' + (u.targetGroup || 'I Qrup');
        nameLine.append(abitBadge);
      }

      var subP = document.createElement('p');
      subP.className = 'truncate text-[11px] text-muted mt-0.5';
      subP.textContent = '@' + u.username + ' · ' + u.university + (u.isAbituriyent ? '' : (' · ' + H.courseLabel(u.courseYear)));

      meta.append(nameLine, subP);
      left.append(meta);

      var act = document.createElement('div');
      act.className = 'flex items-center gap-2 shrink-0';

      var msgBtn = document.createElement('button');
      msgBtn.type = 'button';
      msgBtn.className = 'btn btn-accent !py-1.5 !px-3 text-xs font-bold';
      msgBtn.textContent = 'Mesaj';
      msgBtn.addEventListener('click', function () { go('direct', u.username); });

      var viewBtn = document.createElement('a');
      viewBtn.className = 'btn btn-outline !py-1.5 !px-3 text-xs font-semibold';
      viewBtn.href = 'profile.html?u=' + encodeURIComponent(u.username);
      viewBtn.target = '_blank';
      viewBtn.textContent = 'Profil';

      act.append(msgBtn, viewBtn);
      row.append(left, act);
      li.append(row);
      ul.append(li);
    });
  }

  function runSearch() {
    var q = H.el('searchInput').value.trim();
    if (q.length < 2) {
      H.show(H.el('searchResults'), false);
      H.show(H.el('searchEmpty'), false);
      H.show(H.el('searchLoading'), false);
      return;
    }

    H.show(H.el('searchLoading'), true);
    H.show(H.el('searchEmpty'), false);

    H.api.searchUsers(q)
      .then(function (list) { renderSearchResults(Array.isArray(list) ? list : []); })
      .catch(function (err) { H.toast(err.message, 'error'); })
      .then(function () { H.show(H.el('searchLoading'), false); });
  }

  if (H.el('searchInput')) {
    H.el('searchInput').addEventListener('input', function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(runSearch, 300);
    });
  }

  /* ---------- Profile & Redaktə --------------------------------------------- */

  var pendingAvatarFile = null;

  function renderAvatar(user) {
    var img = H.el('profileAvatarImg');
    var letter = H.el('profileAvatar');
    var sideImg = H.el('sidebarAvatarImg');
    var sideLetter = H.el('sidebarAvatar');
    var topImg = H.el('topAvatarImg');
    var topLetter = H.el('topAvatar');

    var ch = ((user.firstName || user.username || '?').charAt(0)).toUpperCase();
    if (letter) letter.textContent = ch;
    if (sideLetter) sideLetter.textContent = ch;
    if (topLetter) topLetter.textContent = ch;

    var src = H.avatarSrc(user.avatarUrl);
    [ [img, letter], [sideImg, sideLetter], [topImg, topLetter] ].forEach(function (pair) {
      if (!pair[0]) return;
      if (src) {
        pair[0].src = src;
        pair[0].classList.remove('hidden');
        if (pair[1]) pair[1].style.display = 'none';
      } else {
        pair[0].classList.add('hidden');
        if (pair[1]) pair[1].style.display = '';
      }
    });

    H.show(H.el('avatarRemove'), Boolean(user && user.avatarUrl));
  }

  function fillProfile(user) {
    var fullName = ((user.firstName || '') + ' ' + (user.lastName || '')).trim();

    renderAvatar(user);
    H.setText(H.el('profileFullName'), fullName || ('@' + user.username));
    H.setText(H.el('profileUsername'), '@' + user.username);
    H.setText(H.el('profileEmail'), user.email || '—');

    var isAbit = Boolean(user.isAbituriyent);
    var profBadge = H.el('profileRoleBadge');
    var homeBadge = H.el('homeRoleBadge');
    if (profBadge) {
      profBadge.textContent = isAbit ? ('Abituriyent • ' + (user.targetGroup || 'I Qrup')) : 'Tələbə';
      profBadge.classList.toggle('hidden', false);
    }
    if (homeBadge) {
      homeBadge.textContent = isAbit ? ('Abituriyent • ' + (user.targetGroup || 'I Qrup')) : '';
      homeBadge.classList.toggle('hidden', !isAbit);
    }

    var uniLabel = H.el('profileUniLabel');
    var specLabel = H.el('profileSpecLabel');
    var groupLabel = H.el('profileGroupLabel');
    var rowFaculty = H.el('rowProfileFaculty');
    var rowCourse = H.el('rowProfileCourse');

    if (isAbit) {
      if (uniLabel) uniLabel.textContent = 'Hədəf Universitet';
      if (specLabel) specLabel.textContent = 'Hədəf İxtisas';
      if (groupLabel) groupLabel.textContent = 'İxtisas Qrupu & Sinif';
      if (rowFaculty) rowFaculty.classList.add('hidden');
      if (rowCourse) rowCourse.classList.add('hidden');
      H.setText(H.el('profileGroup'), (user.targetGroup || 'I Qrup') + ' (' + (user.groupName || '11-ci Sinif') + ')');
    } else {
      if (uniLabel) uniLabel.textContent = 'Universitet';
      if (specLabel) specLabel.textContent = 'İxtisas';
      if (groupLabel) groupLabel.textContent = 'Akademik Qrup';
      if (rowFaculty) rowFaculty.classList.remove('hidden');
      if (rowCourse) rowCourse.classList.remove('hidden');
      H.setText(H.el('profileGroup'), user.groupName || '—');
    }

    H.setText(H.el('profileUniversity'), user.university || '—');
    H.setText(H.el('profileFaculty'), user.faculty || '—');
    H.setText(H.el('profileSpecialty'), user.specialty || '—');
    H.setText(H.el('profileCourse'), H.courseLabel(user.courseYear));
    H.setText(H.el('profileAge'), user.age || '—');

    H.el('shareLink').value = H.shareLinkFor(user.username);
    H.el('viewPublicLink').href = 'profile.html?u=' + encodeURIComponent(user.username);

    H.setText(H.el('homeUsername'), '@' + user.username);

    // Sidebar kartı
    H.setText(H.el('sidebarFullName'), fullName || user.username);
    H.setText(H.el('sidebarUsername'), '@' + user.username);

    renderUsernameNotice(user);
  }

  function renderUsernameNotice(user) {
    var notice = H.el('usernameNotice');
    if (!notice) return;
    var cd = H.usernameCooldown(user);
    if (cd.locked && cd.date) {
      var dateText = cd.date.toLocaleDateString(I.current(), { day: '2-digit', month: '2-digit', year: 'numeric' });
      notice.textContent = I.t('profile.usernameLocked').replace('{date}', dateText).replace('{days}', cd.days);
      notice.classList.toggle('text-accent', false);
    } else {
      notice.textContent = I.t('profile.usernameFree');
      notice.classList.add('text-accent');
    }
  }

  function renderOwnProfile() {
    if (!state.user) return;
    fillProfile(state.user);

    H.el('editFirstName').value = state.user.firstName || '';
    H.el('editLastName').value = state.user.lastName || '';
    H.el('editUsername').value = state.user.username || '';

    H.api.me()
      .then(function (user) {
        state.user = user;
        H.saveUser(user);
        fillProfile(user);
        H.el('editFirstName').value = user.firstName || '';
        H.el('editLastName').value = user.lastName || '';
        H.el('editUsername').value = user.username || '';
      })
      .catch(function (error) {
        if (error.status === 401) { H.clearSession(); location.replace('loginpage.html'); }
      });
  }

  if (H.el('editUsername')) {
    H.el('editUsername').addEventListener('input', function () {
      var lower = H.el('editUsername').value.toLowerCase();
      if (lower !== H.el('editUsername').value) H.el('editUsername').value = lower;
    });
  }

  var profileForm = H.el('profileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var msgBox = H.el('profileMessage');
      H.show(msgBox, false);

      var payload = {
        firstName: H.el('editFirstName').value.trim(),
        lastName: H.el('editLastName').value.trim(),
        username: H.el('editUsername').value.trim().toLowerCase()
      };

      var checks = [
        ['editFirstName', H.validate.name(payload.firstName, 'Ad')],
        ['editLastName', H.validate.name(payload.lastName, 'Soyad')],
        ['editUsername', H.validate.username(payload.username)]
      ];

      var firstInvalid = null;
      checks.forEach(function (r) {
        var errEl = H.el(r[0] + 'Error');
        H.setFieldError(H.el(r[0]), errEl, r[1] || '');
        if (r[1] && !firstInvalid) firstInvalid = H.el(r[0]);
      });
      if (firstInvalid) { firstInvalid.focus(); return; }

      H.setLoading(H.el('profileSubmit'), true, 'Saxlanılır...');

      H.api.updateProfile(payload)
        .then(function (user) {
          state.user = user;
          H.saveUser(user);
          fillProfile(user);
          msgBox.className = 'alert alert-info mt-4';
          H.setText(msgBox, 'Profil məlumatları uğurla yeniləndi.');
          H.show(msgBox, true);
        })
        .catch(function (err) {
          msgBox.className = 'alert alert-error mt-4';
          H.setText(msgBox, err.message);
          H.show(msgBox, true);
        })
        .then(function () { H.setLoading(H.el('profileSubmit'), false); });
    });
  }

  // Profil şəkli seçmə & yükləmə
  function setAvatarMessage(text, isError) {
    var errorBox = H.el('avatarError');
    var successBox = H.el('avatarSuccess');
    if (isError) {
      H.setText(errorBox, text);
      H.show(errorBox, true);
      H.show(successBox, false);
    } else {
      H.setText(successBox, text);
      H.show(successBox, Boolean(text));
      H.show(errorBox, false);
    }
  }

  if (H.el('avatarPick')) H.el('avatarPick').addEventListener('click', function () { H.el('avatarInput').click(); });

  if (H.el('avatarInput')) {
    H.el('avatarInput').addEventListener('change', function () {
      setAvatarMessage('', false);
      var file = H.el('avatarInput').files && H.el('avatarInput').files[0];
      if (!file) return;

      if (H.AVATAR.types.indexOf(file.type) === -1) {
        setAvatarMessage('Yalnız JPEG, PNG və ya WEBP şəkilləri qəbul edilir.', true);
        return;
      }
      if (file.size > H.AVATAR.maxBytes) {
        setAvatarMessage('Şəkil 2 MB-dan böyük ola bilməz.', true);
        return;
      }

      pendingAvatarFile = file;
      H.show(H.el('avatarUpload'), true);

      var reader = new FileReader();
      reader.onload = function () {
        var prev = H.el('avatarPreview');
        prev.src = reader.result;
        H.show(prev, true);
        H.el('avatarLetter').style.display = 'none';
      };
      reader.readAsDataURL(file);
    });
  }

  if (H.el('avatarUpload')) {
    H.el('avatarUpload').addEventListener('click', function () {
      if (!pendingAvatarFile) return;
      var btn = H.el('avatarUpload');
      H.setLoading(btn, true, 'Yüklənir...');

      H.api.uploadAvatar(pendingAvatarFile)
        .then(function (user) {
          state.user = user;
          H.saveUser(user);
          fillProfile(user);
          pendingAvatarFile = null;
          H.show(btn, false);
          setAvatarMessage('Profil şəkli yeniləndi.', false);
        })
        .catch(function (err) { setAvatarMessage(err.message, true); })
        .then(function () { H.setLoading(btn, false); });
    });
  }

  if (H.el('avatarRemove')) {
    H.el('avatarRemove').addEventListener('click', function () {
      H.api.deleteAvatar()
        .then(function (user) {
          state.user = user;
          H.saveUser(user);
          fillProfile(user);
          setAvatarMessage('Profil şəkli silindi.', false);
        })
        .catch(function (err) { setAvatarMessage(err.message, true); });
    });
  }

  // Paylaşım linki kopyalama
  if (H.el('copyShare')) {
    H.el('copyShare').addEventListener('click', function () {
      if (!state.user) return;
      H.copyToClipboard(H.shareLinkFor(state.user.username)).then(function (ok) {
        H.toast(ok ? 'Profil linki kopyalandı!' : 'Kopyalamaq mümkün olmadı.', ok ? 'success' : 'error');
      });
    });
  }

  /* ---------- Çıxış Təsdiq Modalı ------------------------------------------- */

  var logoutModal = H.el('logoutConfirmModal');
  var logoutConfirmBtn = H.el('logoutConfirmBtn');
  var logoutCancelBtn = H.el('logoutCancelBtn');

  function openLogoutModal() { if (logoutModal) logoutModal.classList.add('is-open'); }
  function closeLogoutModal() { if (logoutModal) logoutModal.classList.remove('is-open'); }

  if (H.el('sidebarLogoutTrigger')) H.el('sidebarLogoutTrigger').addEventListener('click', openLogoutModal);
  if (H.el('logoutBtn')) H.el('logoutBtn').addEventListener('click', openLogoutModal);
  if (logoutCancelBtn) logoutCancelBtn.addEventListener('click', closeLogoutModal);

  if (logoutConfirmBtn) {
    logoutConfirmBtn.addEventListener('click', function () {
      H.setLoading(logoutConfirmBtn, true, '...');
      H.api.logout()
        .catch(function () {})
        .then(function () {
          H.clearSession();
          location.replace('landingpage.html');
        });
    });
  }

  /* ---------- Monetizasiya, Balans & Realist Kart Checkout ------------------ */

  function updateWalletUI() {
    if (!state.user) return;
    var count = typeof state.user.coins === 'number' ? state.user.coins : 50;
    H.setText(H.el('topCoinsCount'), count);
    H.setText(H.el('sidebarCoinCount'), count);
    H.setText(H.el('sidebarBottomCoins'), count);
    H.setText(H.el('storeSectionCoins'), count);
    H.setText(H.el('clueModalCoins'), count + ' Sikkə');

    var proBadge = H.el('topProBadge');
    if (proBadge) proBadge.classList.toggle('hidden', !state.user.isPro);
  }

  function refreshUser() {
    H.api.me().then(function (user) {
      state.user = user;
      H.saveUser(user);
      updateWalletUI();
    }).catch(function () {});
  }

  /* İpucu Modalı */
  function openClueModal(m) {
    state.activeClueMessage = m;
    var modal = H.el('clueModal');
    if (!modal) return;

    H.setText(H.el('clueMessagePreview'), '«' + (m.content || '') + '»');
    updateWalletUI();

    var lvl = m.clueLevelRevealed || 0;
    var isPro = Boolean(state.user && state.user.isPro);

    // Səviyyə 1
    var dText = H.el('clueDeviceText');
    var b1 = H.el('btnUnlockLevel1');
    if (lvl >= 1 && m.deviceHint) {
      dText.textContent = m.deviceHint;
      dText.className = 'mt-0.5 text-xs font-bold text-emerald-500';
      b1.disabled = true;
      b1.textContent = 'Açılıb';
      b1.className = 'btn btn-ghost shrink-0 text-xs text-muted !py-1.5 !px-3';
    } else {
      dText.textContent = 'Kilidlidir (10 Sikkə)';
      dText.className = 'mt-0.5 text-xs font-semibold text-muted';
      b1.disabled = false;
      b1.textContent = isPro ? 'Pulsuz Aç (VIP PRO)' : 'Aç (10 Sikkə)';
      b1.className = 'btn btn-accent shrink-0 text-xs !py-1.5 !px-3 font-bold';
    }

    // Səviyyə 2
    var lText = H.el('clueLocationText');
    var b2 = H.el('btnUnlockLevel2');
    if (lvl >= 2 && m.locationHint) {
      lText.textContent = m.locationHint;
      lText.className = 'mt-0.5 text-xs font-bold text-emerald-500';
      b2.disabled = true;
      b2.textContent = 'Açılıb';
      b2.className = 'btn btn-ghost shrink-0 text-xs text-muted !py-1.5 !px-3';
    } else {
      lText.textContent = 'Kilidlidir (20 Sikkə)';
      lText.className = 'mt-0.5 text-xs font-semibold text-muted';
      b2.disabled = false;
      b2.textContent = isPro ? 'Pulsuz Aç (VIP PRO)' : 'Aç (20 Sikkə)';
      b2.className = 'btn btn-accent shrink-0 text-xs !py-1.5 !px-3 font-bold';
    }

    // Səviyyə 3
    var sText = H.el('clueSenderText');
    var b3 = H.el('btnUnlockLevel3');
    if (lvl >= 3 && m.universityHint) {
      sText.textContent = m.universityHint + ' (' + (m.senderInitialHint || 'Anonim') + ')';
      sText.className = 'mt-0.5 text-xs font-bold text-emerald-500';
      b3.disabled = true;
      b3.textContent = 'Açılıb';
      b3.className = 'btn btn-ghost shrink-0 text-xs text-muted !py-1.5 !px-3';
    } else {
      sText.textContent = 'Kilidlidir (30 Sikkə)';
      sText.className = 'mt-0.5 text-xs font-semibold text-muted';
      b3.disabled = false;
      b3.textContent = isPro ? 'Pulsuz Aç (VIP PRO)' : 'Aç (30 Sikkə)';
      b3.className = 'btn btn-accent shrink-0 text-xs !py-1.5 !px-3 font-bold';
    }

    modal.classList.add('is-open');
  }

  function closeClueModal() {
    var modal = H.el('clueModal');
    if (modal) modal.classList.remove('is-open');
  }

  function handleUnlock(lvl) {
    if (!state.activeClueMessage) return;
    H.api.unlockClue(state.activeClueMessage.id, lvl)
      .then(function (res) {
        state.activeClueMessage.clueLevelRevealed = res.clueLevel;
        state.activeClueMessage.deviceHint = res.deviceHint;
        state.activeClueMessage.locationHint = res.locationHint;
        state.activeClueMessage.universityHint = res.universityHint;
        state.activeClueMessage.senderInitialHint = res.senderInitialHint;

        if (state.user) {
          state.user.coins = res.remainingCoins;
          state.user.isPro = res.isPro;
          H.saveUser(state.user);
        }

        updateWalletUI();
        openClueModal(state.activeClueMessage);
        loadNotifications();
        H.toast('İpucu uğurla açıldı!', 'success');
      })
      .catch(function (err) { H.toast(err.message, 'error'); });
  }

  if (H.el('clueModalClose')) H.el('clueModalClose').addEventListener('click', closeClueModal);
  if (H.el('btnUnlockLevel1')) H.el('btnUnlockLevel1').addEventListener('click', function () { handleUnlock(1); });
  if (H.el('btnUnlockLevel2')) H.el('btnUnlockLevel2').addEventListener('click', function () { handleUnlock(2); });
  if (H.el('btnUnlockLevel3')) H.el('btnUnlockLevel3').addEventListener('click', function () { handleUnlock(3); });
  if (H.el('clueToStoreBtn')) H.el('clueToStoreBtn').addEventListener('click', function () { closeClueModal(); go('store'); });

  /* ---------- Bank Kartı Checkout Modalı ---------- */

  var PACKAGES = {
    starter: { title: '100 Sikkə Paketi', amount: '1.99 ₼', benefit: '+100 Sikkə Balansınıza əlavə olunacaq' },
    popular: { title: '300 Sikkə Standart Paketi', amount: '4.99 ₼', benefit: '+300 Sikkə Balansınıza əlavə olunacaq' },
    pro:     { title: 'Hive VIP PRO Abunəlik', amount: '9.99 ₼', benefit: '+500 Bonus Sikkə + VIP Nişanı + Limitsiz İpucları' }
  };

  function openCheckoutModal(pkgId) {
    var pkg = PACKAGES[pkgId] || PACKAGES.starter;
    H.el('checkoutPackageId').value = pkgId;
    H.setText(H.el('checkoutPackageTitle'), pkg.title);
    H.setText(H.el('checkoutPackageBenefit'), pkg.benefit);
    H.setText(H.el('checkoutPackageAmount'), pkg.amount);
    H.setText(H.el('checkoutSubmitLabel'), pkg.amount + ' Ödənişi Tamamla');

    var modal = H.el('checkoutModal');
    if (modal) modal.classList.add('is-open');
  }

  function closeCheckoutModal() {
    var modal = H.el('checkoutModal');
    if (modal) modal.classList.remove('is-open');
  }

  if (H.el('checkoutModalClose')) H.el('checkoutModalClose').addEventListener('click', closeCheckoutModal);

  document.querySelectorAll('[data-open-checkout]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var pkg = btn.getAttribute('data-open-checkout');
      openCheckoutModal(pkg);
    });
  });

  if (H.el('coinStoreBtn')) {
    H.el('coinStoreBtn').addEventListener('click', function () { go('store'); });
  }

  // 3D Kart interaktiv sinxronizasiyası
  var cardNum = H.el('cardInputNumber');
  var cardExp = H.el('cardInputExpiry');
  var cardHold = H.el('cardInputHolder');

  if (cardNum) {
    cardNum.addEventListener('input', function () {
      var val = cardNum.value.replace(/\D/g, '').slice(0, 16);
      var formatted = val.replace(/(\d{4})(?=\d)/g, '$1 ');
      cardNum.value = formatted;
      H.setText(H.el('cardPreviewNumber'), formatted || '•••• •••• •••• ••••');
    });
  }

  if (cardExp) {
    cardExp.addEventListener('input', function () {
      var val = cardExp.value.replace(/\D/g, '').slice(0, 4);
      if (val.length >= 3) val = val.slice(0, 2) + '/' + val.slice(2);
      cardExp.value = val;
      H.setText(H.el('cardPreviewExpiry'), val || 'MM/YY');
    });
  }

  if (cardHold) {
    cardHold.addEventListener('input', function () {
      H.setText(H.el('cardPreviewHolder'), cardHold.value.trim() || 'Ad Soyad');
    });
  }

  // Checkout formunun submit edilməsi
  var checkoutForm = H.el('checkoutForm');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var pkgId = H.el('checkoutPackageId').value;
      var num = cardNum ? cardNum.value : '';
      var exp = cardExp ? cardExp.value : '';
      var cvv = H.el('cardInputCvv') ? H.el('cardInputCvv').value : '';
      var holder = cardHold ? cardHold.value : '';

      var subBtn = H.el('checkoutSubmitBtn');
      H.setLoading(subBtn, true, 'İcra olunur...');

      H.api.checkout({
        packageId: pkgId,
        cardNumber: num,
        cardExpiry: exp,
        cardCvv: cvv,
        cardHolder: holder
      })
      .then(function (res) {
        if (state.user) {
          state.user.coins = res.coins;
          state.user.isPro = res.isPro;
          H.saveUser(state.user);
        }
        updateWalletUI();
        closeCheckoutModal();

        // Qəbz modalını aç
        H.setText(H.el('receiptOrderId'), res.orderId);
        H.setText(H.el('receiptAmount'), Number(res.transaction.amount).toFixed(2) + ' AZN');
        H.setText(H.el('receiptCard'), res.transaction.maskedCardNumber);
        H.setText(H.el('receiptNewCoins'), res.coins + ' Sikkə');
        H.setText(H.el('receiptMessage'), res.message);

        var rModal = H.el('receiptModal');
        if (rModal) rModal.classList.add('is-open');

        loadTransactions();
      })
      .catch(function (err) { H.toast(err.message, 'error'); })
      .then(function () { H.setLoading(subBtn, false); });
    });
  }

  if (H.el('receiptCloseBtn')) {
    H.el('receiptCloseBtn').addEventListener('click', function () {
      var rModal = H.el('receiptModal');
      if (rModal) rModal.classList.remove('is-open');
    });
  }

  /* ---------- Faktura & Əməliyyat Tarixçəsi ---------------------------------- */

  function loadTransactions() {
    var tbody = H.el('transactionTableBody');
    if (!tbody) return;

    H.api.transactions()
      .then(function (txs) {
        if (!txs || !txs.length) {
          tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-6 text-center text-muted">Hələ heç bir ödəniş həyata keçirilməyib.</td></tr>';
          return;
        }

        tbody.innerHTML = '';
        txs.forEach(function (t) {
          var tr = document.createElement('tr');
          tr.className = 'hover:bg-[var(--c-surface-2)] transition';

          var dateStr = new Date(t.createdAt).toLocaleDateString('az-AZ', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
          });

          var pkgLabel = t.packageId === 'pro' ? 'VIP PRO' : (t.packageId === 'popular' ? '300 Sikkə' : '100 Sikkə');

          tr.innerHTML =
            '<td class="px-4 py-3 font-mono font-bold text-accent">' + t.orderId + '</td>' +
            '<td class="px-4 py-3 font-semibold">' + pkgLabel + '</td>' +
            '<td class="px-4 py-3 font-bold tabular-nums">' + Number(t.amount).toFixed(2) + ' ' + (t.currency || 'AZN') + '</td>' +
            '<td class="px-4 py-3 font-mono text-muted">' + (t.maskedCardNumber || '•••• 8842') + '</td>' +
            '<td class="px-4 py-3 text-muted">' + dateStr + '</td>' +
            '<td class="px-4 py-3"><span class="badge badge-accent bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">' + t.status + '</span></td>';

          tbody.appendChild(tr);
        });
      })
      .catch(function () {
        tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-4 text-center text-rose-500">Tarixçəni yükləmək mümkün olmadı.</td></tr>';
      });
  }

  /* ---------- Dil Dəyişəndə -------------------------------------------------- */

  document.addEventListener('hive:language', function () {
    if (state.user) {
      fillProfile(state.user);
      renderUsernameNotice(state.user);
    }
    renderAiAccounts();
    if (state.conversations.length) renderConversations(state.conversations);
    if (state.activeThread) openThread(state.activeThread);
    runSearch();
  });

  /* ---------- Başlanğıc Yükləməsi ------------------------------------------- */

  if (state.user) {
    fillProfile(state.user);
    updateWalletUI();
  }
  refreshUser();
  loadAiAccounts();

  if (!location.hash) location.replace('#home');
  route();
})();
