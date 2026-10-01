/* =============================================================================
 * Hive — ümumi frontend nüvəsi
 *   · API ünvanı və sorğu qatı
 *   · Sessiya (JWT + profil)
 *   · Validasiya qaydaları (backend ilə eyni)
 *   · Kiçik köməkçilər (toast, tarix, clipboard, universitet siyahısı)
 *
 * Bütün səhifələr bu faylı işlədir: <script src="assets/api.js"></script>
 * API müqaviləsi üçün README.md-yə bax.
 * ========================================================================== */

window.Hive = (function () {
  'use strict';

  /* ---------- API ünvanı ----------------------------------------------------
   * Frontend backend-in öz wwwroot-undan verilirsə → nisbi "/api" (CORS yoxdur).
   * Ayrı domendədirsə → window.HIVE_API_BASE və ya lokal ünvan. */
  var API_BASE = (function () {
    if (window.HIVE_API_BASE) return String(window.HIVE_API_BASE).replace(/\/+$/, '');
    try {
      var stored = localStorage.getItem('hive.api_base');
      if (stored) return String(stored).replace(/\/+$/, '');
    } catch (e) {}

    var isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (!isLocal) {
      // Əgər Vercel-də ayrıca yerləşdirilibsə və xüsusi backend verilməyibsə Render backend-ə bağlanır
      if (location.hostname.endsWith('vercel.app')) {
        return 'https://hive-api.onrender.com/api';
      }
      return '/api';
    }
    return location.port === '5000' ? '/api' : 'http://localhost:5000/api';
  })();

  var TOKEN_KEY = 'hive.token';
  var USER_KEY = 'hive.user';
  var MAX_ANON_MESSAGE = 500;
  var MAX_DIRECT_MESSAGE = 1000;

  var COURSE_LABELS = {
    az: { 0: 'Abituriyent', 1: '1-ci kurs', 2: '2-ci kurs', 3: '3-cü kurs', 4: '4-cü kurs', 5: 'Magistr' },
    ru: { 0: 'Абитуриент', 1: '1 курс', 2: '2 курс', 3: '3 курс', 4: '4 курс', 5: 'Магистратура' },
    tr: { 0: 'Aday Öğrenci', 1: '1. sınıf', 2: '2. sınıf', 3: '3. sınıf', 4: '4. sınıf', 5: 'Yüksek Lisans' },
    en: { 0: 'Applicant', 1: '1st year', 2: '2nd year', 3: '3rd year', 4: '4th year', 5: "Master's" }
  };

  /** Universitet siyahısı — yeni universitet əlavə etmək üçün buraya yaz. */
  var UNIVERSITIES = [
    'Milli Aviasiya Akademiyası',
    'ADA Universiteti',
    'Azərbaycan Dövlət İqtisad Universiteti (UNEC)',
    'Bakı Dövlət Universiteti (BDU)',
    'Azərbaycan Dövlət Neft və Sənaye Universiteti (ADNSU)',
    'Azərbaycan Dövlət Pedaqoji Universiteti (ADPU)',
    'Azərbaycan Texniki Universiteti (AzTU)',
    'Azərbaycan Memarlıq və İnşaat Universiteti (AzMİU)',
    'Azərbaycan Tibb Universiteti (ATU)',
    'Azərbaycan Dillər Universiteti (ADU)',
    'Bakı Ali Neft Məktəbi (BANM)',
    'Bakı Mühəndislik Universiteti (BMU)',
    'Bakı Slavyan Universiteti',
    'Xəzər Universiteti',
    'Qərbi Kaspi Universiteti',
    'Odlar Yurdu Universiteti',
    'Bakı Biznes Universiteti',
    'Azərbaycan Universiteti',
    'Azərbaycan Kooperasiya Universiteti',
    'Azərbaycan Dövlət Aqrar Universiteti',
    'Azərbaycan Dövlət Mədəniyyət və İncəsənət Universiteti',
    'Azərbaycan Dövlət Dəniz Akademiyası',
    'Azərbaycan Turizm və Menecment Universiteti',
    'Azərbaycan Texnologiya Universiteti',
    'Azərbaycan Milli Konservatoriyası',
    'Prezident yanında Dövlət İdarəçilik Akademiyası',
    'Gəncə Dövlət Universiteti',
    'Sumqayıt Dövlət Universiteti',
    'Naxçıvan Dövlət Universiteti',
    'Lənkəran Dövlət Universiteti',
    'Mingəçevir Dövlət Universiteti',
    'Bakı Qızlar Universiteti'
  ];

  /* ---------- Xəta sinfi ---------------------------------------------------- */

  function ApiError(message, status, payload) {
    var err = new Error(message);
    err.name = 'ApiError';
    err.status = status;
    err.payload = payload;
    err.fieldErrors = payload && payload.errors && typeof payload.errors === 'object' ? payload.errors : null;
    err.field = payload && typeof payload.field === 'string' ? payload.field : '';
    return err;
  }

  function errorMessageFrom(status, payload) {
    if (payload && typeof payload === 'object') {
      if (typeof payload.error === 'string' && payload.error.trim()) return payload.error;
      if (payload.errors && typeof payload.errors === 'object') {
        var all = [];
        Object.keys(payload.errors).forEach(function (k) {
          (payload.errors[k] || []).forEach(function (m) { if (m) all.push(m); });
        });
        if (all.length) return all.join(' ');
      }
    }
    if (status === 0) return 'Serverə qoşulmaq mümkün olmadı. Backend işləyir?';
    if (status === 400) return 'Göndərilən məlumat düzgün deyil.';
    if (status === 401) return 'Sessiyanın vaxtı bitib. Yenidən daxil ol.';
    if (status === 403) return 'Bu məlumatı görmək üçün icazən yoxdur.';
    if (status === 404) return 'Məlumat tapılmadı.';
    if (status === 409) return 'Bu məlumat artıq mövcuddur.';
    if (status >= 500) return 'Serverdə gözlənilməz xəta baş verdi. Bir az sonra yoxla.';
    return 'Sorğu uğursuz oldu (' + status + ').';
  }

  function request(path, options) {
    options = options || {};
    var headers = {};
    var init = { method: options.method || 'GET' };

    if (options.formData) {
      // Fayl yükləmə: Content-Type-ı brauzer özü (boundary ilə) təyin edir
      init.body = options.formData;
    } else if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(options.body);
    }

    if (options.auth) {
      var token = getToken();
      if (token) headers['Authorization'] = 'Bearer ' + token;
    }

    if (Object.keys(headers).length) init.headers = headers;

    return fetch(API_BASE + path, init)
      .catch(function () { throw ApiError(errorMessageFrom(0, null), 0, null); })
      .then(function (response) {
        return response.text().then(function (raw) {
          var payload = null;
          if (raw) { try { payload = JSON.parse(raw); } catch (e) { payload = null; } }
          if (!response.ok) throw ApiError(errorMessageFrom(response.status, payload), response.status, payload);
          return payload;
        });
      });
  }

  var api = {
    register: function (data) { return request('/auth/register', { method: 'POST', body: data }); },
    login: function (data) { return request('/auth/login', { method: 'POST', body: data }); },
    me: function () { return request('/auth/me', { auth: true }); },
    publicProfile: function (username) { return request('/users/' + encodeURIComponent(username)); },
    searchUsers: function (q) { return request('/users/search?q=' + encodeURIComponent(q), { auth: true }); },
    sendAnonymous: function (username, content) {
      return request('/messages', { method: 'POST', body: { username: username, content: content } });
    },
    inbox: function (username) { return request('/messages/' + encodeURIComponent(username), { auth: true }); },
    deleteMessage: function (id) { return request('/messages/' + id, { method: 'DELETE', auth: true }); },
    sendDirect: function (username, content) {
      return request('/dm', { method: 'POST', body: { username: username, content: content }, auth: true });
    },
    thread: function (username) { return request('/dm/' + encodeURIComponent(username), { auth: true }); },
    conversations: function () { return request('/dm/conversations', { auth: true }); },
    updateProfile: function (data) { return request('/auth/profile', { method: 'PUT', body: data, auth: true }); },
    posts: function (take) { return request('/posts?take=' + (take || 30), { auth: true }); },
    createPost: function (content) { return request('/posts', { method: 'POST', body: { content: content }, auth: true }); },
    deletePost: function (id) { return request('/posts/' + id, { method: 'DELETE', auth: true }); },
    aiAccounts: function () { return request('/users/ai', { auth: true }); },

    /** Çıxış — server tokeni də ləğv edir (security stamp yenilənir). */
    logout: function () { return request('/auth/logout', { method: 'POST', auth: true }); },

    uploadAvatar: function (file) {
      var data = new FormData();
      data.append('file', file);
      return request('/auth/avatar', { method: 'POST', formData: data, auth: true });
    },

    deleteAvatar: function () { return request('/auth/avatar', { method: 'DELETE', auth: true }); },
    unlockClue: function (messageId, level) {
      return request('/messages/' + messageId + '/unlock-clue', { method: 'POST', body: { level: level }, auth: true });
    },
    walletBalance: function () { return request('/wallet/balance', { auth: true }); },
    buyCoins: function (packageId) {
      return request('/wallet/buy-coins', { method: 'POST', body: { packageId: packageId }, auth: true });
    },
    checkout: function (data) {
      return request('/wallet/checkout', { method: 'POST', body: data, auth: true });
    },
    transactions: function () {
      return request('/wallet/transactions', { auth: true });
    }
  };

  /* ---------- Profil şəkli -------------------------------------------------- */

  var AVATAR = {
    maxBytes: 2 * 1024 * 1024,
    types: ['image/jpeg', 'image/png', 'image/webp'],
    hint: 'JPEG, PNG və ya WEBP · maksimum 2 MB'
  };

  /** Serverdən gələn nisbi yolu tam ünvana çevirir. */
  function avatarSrc(url) {
    if (!url) return '';
    if (/^https?:/i.test(url)) return url;
    if (API_BASE.charAt(0) === '/') return url;          // eyni origin
    return API_BASE.replace(/\/api\/?$/, '') + url;      // ayrı API domeni
  }

  /* ---------- İstifadəçi adı limiti (14 gün) -------------------------------- */

  var USERNAME_COOLDOWN_DAYS = 14;

  /**
   * İstifadəçi adının dəyişdirilə biləcəyi tarixi hesablayır.
   * Server eyni qaydanı tətbiq edir — bu, yalnız interfeys üçündür.
   */
  function usernameCooldown(user) {
    if (!user || !user.usernameChangeAllowedAt) return { locked: false, date: null, days: 0 };

    var allowed = new Date(user.usernameChangeAllowedAt);
    if (isNaN(allowed.getTime())) return { locked: false, date: null, days: 0 };

    var diff = allowed.getTime() - Date.now();
    if (diff <= 0) return { locked: false, date: allowed, days: 0 };

    return { locked: true, date: allowed, days: Math.ceil(diff / 86400000) };
  }

  /* ---------- Sessiya ------------------------------------------------------- */

  function getToken() {
    try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; }
  }

  function getStoredUser() {
    try {
      var raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function saveSession(authResponse) {
    try {
      localStorage.setItem(TOKEN_KEY, authResponse.token);
      localStorage.setItem(USER_KEY, JSON.stringify(authResponse.user));
    } catch (e) { /* private mode */ }
  }

  function saveUser(user) {
    try { localStorage.setItem(USER_KEY, JSON.stringify(user)); } catch (e) { /* ignore */ }
  }

  function clearSession() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) { /* ignore */ }
  }

  function isLoggedIn() { return Boolean(getToken() && getStoredUser()); }

  /* ---------- Validasiya (backend qaydaları ilə eyni) ----------------------- */

  var USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;
  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  var validate = {
    name: function (value, label) {
      var v = (value || '').trim();
      if (!v) return label + ' boş ola bilməz.';
      if (v.length < 2 || v.length > 50) return label + ' 2-50 simvol arasında olmalıdır.';
      return '';
    },
    username: function (value) {
      var v = (value || '').trim();
      if (!v) return 'İstifadəçi adı boş ola bilməz.';
      if (v.length < 3 || v.length > 30) return 'İstifadəçi adı 3-30 simvol arasında olmalıdır.';
      if (!USERNAME_PATTERN.test(v)) return 'Yalnız hərf, rəqəm və alt xətt (_) istifadə edə bilərsən.';
      return '';
    },
    email: function (value) {
      var v = (value || '').trim();
      if (!v) return 'E-poçt ünvanı boş ola bilməz.';
      if (v.length > 150) return 'E-poçt ünvanı 150 simvoldan uzun ola bilməz.';
      if (!EMAIL_PATTERN.test(v)) return 'Düzgün e-poçt ünvanı daxil edin.';
      return '';
    },
    password: function (value) {
      var v = value || '';
      if (!v) return 'Parol boş ola bilməz.';
      if (v.length < 8) return 'Parol ən azı 8 simvol olmalıdır.';
      if (v.length > 100) return 'Parol 100 simvoldan uzun ola bilməz.';
      return '';
    },
    university: function (value) {
      var v = (value || '').trim();
      if (!v) return 'Universitet seçilməlidir.';
      if (v.length < 2 || v.length > 150) return 'Universitet adı 2-150 simvol arasında olmalıdır.';
      return '';
    },
    faculty: function (value) {
      var v = (value || '').trim();
      if (v.length > 120) return 'Fakültə adı 120 simvoldan uzun ola bilməz.';
      return '';
    },
    specialty: function (value) {
      var v = (value || '').trim();
      if (!v) return 'İxtisas boş ola bilməz.';
      if (v.length < 2 || v.length > 120) return 'İxtisas 2-120 simvol arasında olmalıdır.';
      return '';
    },
    course: function (value, isAbituriyent) {
      if (isAbituriyent) return '';
      if (!value) return 'Kurs seçilməlidir.';
      var n = Number(value);
      if (!Number.isInteger(n) || n < 1 || n > 5) return 'Kurs 1-5 arasında olmalıdır (5 = Magistr).';
      return '';
    },
    group: function (value) {
      var v = (value || '').trim();
      if (!v) return 'Qrup nömrəsi boş ola bilməz.';
      if (v.length > 30) return 'Qrup nömrəsi 30 simvoldan uzun ola bilməz.';
      return '';
    },
    age: function (value) {
      if (value === '' || value === null || value === undefined) return 'Yaş boş ola bilməz.';
      var n = Number(value);
      if (!Number.isInteger(n)) return 'Yaş tam ədəd olmalıdır.';
      if (n < 14 || n > 100) return 'Yaş 14-100 arasında olmalıdır.';
      return '';
    }
  };

  /* ---------- Köməkçilər ---------------------------------------------------- */

  function el(id) { return document.getElementById(id); }

  function show(node, visible) { if (node) node.classList.toggle('hidden', !visible); }

  function setText(node, text) { if (node) node.textContent = text == null ? '' : String(text); }

  function setFieldError(input, errorNode, message) {
    if (errorNode) {
      setText(errorNode, message || '');
      show(errorNode, Boolean(message));
    }
    if (input) {
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
    }
  }

  function setLoading(button, isLoading, loadingText) {
    if (!button) return;
    var label = button.querySelector('[data-label]');
    var spinner = button.querySelector('[data-spinner]');
    if (label && button.dataset.idleText === undefined) button.dataset.idleText = label.textContent;
    if (label) label.textContent = isLoading ? (loadingText || 'Gözləyin...') : button.dataset.idleText;
    show(spinner, isLoading);
    button.disabled = isLoading;
    button.setAttribute('aria-busy', isLoading ? 'true' : 'false');
  }

  function toast(message, type) {
    var container = el('toasts');
    if (!container) return;
    var styles = {
      success: 'alert-success',
      error: 'alert-error',
      info: 'alert-info'
    };
    var node = document.createElement('div');
    node.className = 'toast pointer-events-auto w-full max-w-sm shadow-lg ' + (styles[type] || styles.info);
    node.textContent = message;
    container.appendChild(node);
    setTimeout(function () {
      node.style.opacity = '0';
      setTimeout(function () { node.remove(); }, 220);
    }, 4200);
  }

  function courseLabel(value, lang) {
    var dict = COURSE_LABELS[lang || window.HiveI18n.current()] || COURSE_LABELS.az;
    return dict[value] || ('#' + value);
  }

  function relativeTime(iso) {
    var then = new Date(iso);
    if (isNaN(then.getTime())) return '';
    var diff = Date.now() - then.getTime();
    if (diff < 0) return window.HiveI18n.t('time.now');

    var sec = Math.round(diff / 1000);
    if (sec < 45) return window.HiveI18n.t('time.now');
    var min = Math.round(sec / 60);
    if (min < 60) return min + ' ' + window.HiveI18n.t('time.min');
    var hours = Math.round(min / 60);
    if (hours < 24) return hours + ' ' + window.HiveI18n.t('time.hour');
    var days = Math.round(hours / 24);
    if (days < 30) return days + ' ' + window.HiveI18n.t('time.day');
    return then.toLocaleDateString(window.HiveI18n.current(), { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function absoluteTime(iso) {
    var d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleString(window.HiveI18n.current(), { dateStyle: 'medium', timeStyle: 'short' });
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }).catch(function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  }

  function legacyCopy(text) {
    try {
      var area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.top = '-1000px';
      document.body.appendChild(area);
      area.select();
      var ok = document.execCommand('copy');
      area.remove();
      return ok;
    } catch (e) { return false; }
  }

  function shareLinkFor(username) {
    var base = /^https?:$/.test(location.protocol)
      ? location.origin + location.pathname.replace(/[^/]*$/, '')
      : 'http://localhost:5000/';
    return base.replace(/\/+$/, '') + '/profile.html?u=' + encodeURIComponent(username);
  }

  function queryParam(name) {
    return new URLSearchParams(location.search).get(name) || '';
  }

  /** Giriş tələb edən səhifələr üçün qoruyucu. */
  function requireLogin() {
    if (isLoggedIn()) return true;
    location.replace('loginpage.html?next=' + encodeURIComponent(location.pathname + location.search));
    return false;
  }

  return {
    API_BASE: API_BASE,
    MAX_ANON_MESSAGE: MAX_ANON_MESSAGE,
    MAX_DIRECT_MESSAGE: MAX_DIRECT_MESSAGE,
    UNIVERSITIES: UNIVERSITIES,
    api: api,
    validate: validate,
    getToken: getToken,
    getStoredUser: getStoredUser,
    saveSession: saveSession,
    saveUser: saveUser,
    clearSession: clearSession,
    isLoggedIn: isLoggedIn,
    el: el,
    show: show,
    setText: setText,
    setFieldError: setFieldError,
    setLoading: setLoading,
    toast: toast,
    courseLabel: courseLabel,
    relativeTime: relativeTime,
    absoluteTime: absoluteTime,
    copyToClipboard: copyToClipboard,
    shareLinkFor: shareLinkFor,
    queryParam: queryParam,
    requireLogin: requireLogin,
    usernameCooldown: usernameCooldown,
    USERNAME_COOLDOWN_DAYS: USERNAME_COOLDOWN_DAYS,
    AVATAR: AVATAR,
    avatarSrc: avatarSrc
  };
})();
