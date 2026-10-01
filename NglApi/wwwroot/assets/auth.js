/* =============================================================================
 * Hive — giriş və qeydiyyat səhifələrinin məntiqi
 * Hər iki səhifə bu faylı işlədir; hansı formanın olduğuna görə davranır.
 * ========================================================================== */

(function () {
  'use strict';

  var H = window.Hive;
  var I = window.HiveI18n;

  /* ---------- Uğurlu girişdən sonra yönləndirmə ----------------------------- */

  function redirectAfterAuth() {
    var next = H.queryParam('next');

    // Təhlükəsizlik: yalnız bu sayt daxilindəki .html səhifələrinə icazə verilir
    // (xarici ünvana açıq yönləndirmənin — open redirect — qarşısını alır).
    if (next && /^\/?[A-Za-z0-9_.-]+\.html(\?[^\s#]*)?$/.test(next)) {
      location.href = next.replace(/^\//, '');
      return;
    }

    location.href = 'app.html';
  }

  /* ---------- Parol görünürlüyü --------------------------------------------- */

  function setupPasswordToggle(buttonId, inputId) {
    var btn = H.el(buttonId);
    var input = H.el(inputId);
    if (!btn || !input) return;

    btn.addEventListener('click', function () {
      var reveal = input.type === 'password';
      input.type = reveal ? 'text' : 'password';
      btn.setAttribute('aria-pressed', reveal ? 'true' : 'false');

      // data-i18n-aria yenilənir ki, dil dəyişəndə düzgün mətn qalsın
      var key = reveal ? 'auth.hidePassword' : 'auth.showPassword';
      btn.setAttribute('data-i18n-aria', key);
      btn.setAttribute('aria-label', I.t(key));

      var eyeShow = btn.querySelector('[data-eye-show]');
      var eyeHide = btn.querySelector('[data-eye-hide]');
      if (eyeShow) eyeShow.classList.toggle('hidden', reveal);
      if (eyeHide) eyeHide.classList.toggle('hidden', !reveal);
    });
  }

  setupPasswordToggle('toggleLoginPassword', 'loginPassword');
  setupPasswordToggle('toggleRegPassword', 'regPassword');

  /* ---------- Giriş --------------------------------------------------------- */

  var loginForm = H.el('loginForm');

  if (loginForm) {
    loginForm.addEventListener('submit', function (event) {
      event.preventDefault();

      var errorBox = H.el('loginError');
      H.show(errorBox, false);

      var username = H.el('loginUsername').value.trim().toLowerCase();
      var password = H.el('loginPassword').value;

      if (!username || !password) {
        H.setText(errorBox, 'İstifadəçi adı və parol doldurulmalıdır.');
        H.show(errorBox, true);
        (username ? H.el('loginPassword') : H.el('loginUsername')).focus();
        return;
      }

      var submit = H.el('loginSubmit');
      H.setLoading(submit, true, 'Giriş edilir...');

      H.api.login({ username: username, password: password })
        .then(function (auth) {
          H.saveSession(auth);
          if (window.HiveAudio) window.HiveAudio.playSuccess();
          if (window.HiveConfetti) window.HiveConfetti.fire(70);
          H.toast(I.t('app.welcome') + ', @' + auth.user.username + '!', 'success');
          setTimeout(redirectAfterAuth, 450);
        })
        .catch(function (error) {
          H.setText(errorBox, error.message);
          H.show(errorBox, true);
        })
        .then(function () { H.setLoading(submit, false); });
    });
  }

  /* ---------- Universitet axtarışlı seçim ----------------------------------- */

  var uniInput = H.el('regUniversity');

  if (uniInput) {
    var uniList = H.el('universityList');
    var uniError = H.el('regUniversityError');
    var selected = '';
    var optionEls = [];
    var activeIndex = -1;

    var normalize = function (s) { return (s || '').toLocaleLowerCase('az').trim(); };

    function openList() {
      H.show(uniList, true);
      uniInput.setAttribute('aria-expanded', 'true');
    }

    function closeList() {
      H.show(uniList, false);
      uniInput.setAttribute('aria-expanded', 'false');
      uniInput.removeAttribute('aria-activedescendant');
      optionEls.forEach(function (el) {
        el.setAttribute('aria-selected', 'false');
        el.classList.remove('is-active', 'bg-[var(--c-surface-2)]');
      });
      activeIndex = -1;
    }

    function choose(value) {
      selected = value;
      uniInput.value = value;
      uniInput.focus();
      closeList();
      H.setFieldError(uniInput, uniError, '');
    }

    function render(query) {
      var q = normalize(query);
      var matches = q ? H.UNIVERSITIES.filter(function (u) { return normalize(u).indexOf(q) !== -1; }) : H.UNIVERSITIES.slice();

      uniList.textContent = '';
      optionEls = [];
      activeIndex = -1;

      var add = function (text, value, extraClass) {
        var li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', 'false');
        li.id = 'uni-opt-' + optionEls.length;
        li.dataset.value = value;
        li.className = 'cursor-pointer px-3.5 py-2 text-sm ' + extraClass;
        li.textContent = text;
        li.addEventListener('mousedown', function (e) { e.preventDefault(); choose(li.dataset.value); });
        uniList.appendChild(li);
        optionEls.push(li);
      };

      matches.forEach(function (name) { add(name, name, 'hover:bg-[var(--c-surface-2)]'); });

      var typed = (query || '').trim();
      var isCustom = typed.length >= 4 && !matches.some(function (m) { return normalize(m) === normalize(typed); });
      if (isCustom) {
        add('«' + typed + '»', typed, 'border-t border-line font-medium text-accent hover:bg-[var(--c-surface-2)]');
      }

      if (!optionEls.length) {
        var empty = document.createElement('li');
        empty.className = 'px-3.5 py-2 text-sm text-muted';
        empty.textContent = I.t('app.search.empty');
        uniList.appendChild(empty);
      }

      openList();
    }

    function highlight(index) {
      optionEls.forEach(function (el, i) {
        var active = i === index;
        el.setAttribute('aria-selected', active ? 'true' : 'false');
        el.classList.toggle('bg-[var(--c-surface-2)]', active);
      });
      if (optionEls[index]) {
        uniInput.setAttribute('aria-activedescendant', optionEls[index].id);
        optionEls[index].scrollIntoView({ block: 'nearest' });
      }
    }

    uniInput.addEventListener('input', function () { selected = ''; render(uniInput.value); });
    uniInput.addEventListener('click', function () { render(uniInput.value); });
    uniInput.addEventListener('focus', function () {
      if (selected && uniInput.value === selected) return;
      render(uniInput.value);
    });
    uniInput.addEventListener('blur', function () { setTimeout(closeList, 120); });

    uniInput.addEventListener('keydown', function (event) {
      var isOpen = !uniList.classList.contains('hidden');

      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (!isOpen) { render(uniInput.value); return; }
        if (!optionEls.length) return;
        activeIndex = event.key === 'ArrowDown'
          ? (activeIndex + 1) % optionEls.length
          : (activeIndex - 1 + optionEls.length) % optionEls.length;
        highlight(activeIndex);
      } else if (event.key === 'Enter') {
        if (isOpen && activeIndex >= 0 && optionEls[activeIndex]) {
          event.preventDefault();
          choose(optionEls[activeIndex].dataset.value);
        }
      } else if (event.key === 'Escape' && isOpen) {
        closeList();
      }
    });

    window.__hiveSelectedUniversity = function () { return selected; };
  }

  /* ---------- Qeydiyyat ------------------------------------------------------ */

  var registerForm = H.el('registerForm');
  var regUsername = H.el('regUsername');

  // İstifadəçi adı həmişə kiçik hərflərlə saxlanılır
  if (regUsername) {
    regUsername.addEventListener('input', function () {
      var lower = regUsername.value.toLowerCase();
      if (lower !== regUsername.value) regUsername.value = lower;
    });
  }

  if (registerForm) {
    var isAbituriyent = false;
    var btnStudent = H.el('roleBtnStudent');
    var btnAbituriyent = H.el('roleBtnAbituriyent');
    var roleBadge = H.el('roleBadge');
    var labelUniversity = H.el('labelUniversity');
    var labelSpecialty = H.el('labelSpecialty');
    var rowStudentCourse = H.el('rowStudentCourse');
    var rowAbituriyentFields = H.el('rowAbituriyentFields');

    function setRole(abituriyent) {
      isAbituriyent = abituriyent;
      if (btnStudent && btnAbituriyent) {
        if (isAbituriyent) {
          btnAbituriyent.className = 'flex-1 rounded-xl py-2.5 text-center text-xs font-bold transition-all bg-[var(--c-surface)] text-[var(--c-text)] shadow-sm';
          btnStudent.className = 'flex-1 rounded-xl py-2.5 text-center text-xs font-bold text-muted transition-all hover:text-[var(--c-text)]';
          if (roleBadge) roleBadge.textContent = 'Abituriyent Qeydiyyatı';
          if (labelUniversity) labelUniversity.textContent = 'Hədəf Universitet və ya Orta Məktəb';
          if (labelSpecialty) labelSpecialty.textContent = 'Hədəf İxtisas';
          if (rowStudentCourse) rowStudentCourse.classList.add('hidden');
          if (rowAbituriyentFields) rowAbituriyentFields.classList.remove('hidden');
        } else {
          btnStudent.className = 'flex-1 rounded-xl py-2.5 text-center text-xs font-bold transition-all bg-[var(--c-surface)] text-[var(--c-text)] shadow-sm';
          btnAbituriyent.className = 'flex-1 rounded-xl py-2.5 text-center text-xs font-bold text-muted transition-all hover:text-[var(--c-text)]';
          if (roleBadge) roleBadge.textContent = 'Tələbə Qeydiyyatı';
          if (labelUniversity) labelUniversity.textContent = 'Universitet';
          if (labelSpecialty) labelSpecialty.textContent = 'İxtisas';
          if (rowStudentCourse) rowStudentCourse.classList.remove('hidden');
          if (rowAbituriyentFields) rowAbituriyentFields.classList.add('hidden');
        }
      }
    }

    if (btnStudent) btnStudent.addEventListener('click', function () { setRole(false); });
    if (btnAbituriyent) btnAbituriyent.addEventListener('click', function () { setRole(true); });

    var FIELDS = {
      FirstName: [H.el('regFirstName'), H.el('regFirstNameError')],
      LastName: [H.el('regLastName'), H.el('regLastNameError')],
      Username: [regUsername, H.el('regUsernameError')],
      Email: [H.el('regEmail'), H.el('regEmailError')],
      Password: [H.el('regPassword'), H.el('regPasswordError')],
      Age: [H.el('regAge'), H.el('regAgeError')],
      University: [H.el('regUniversity'), H.el('regUniversityError')],
      Faculty: [H.el('regFaculty'), H.el('regFacultyError')],
      Specialty: [H.el('regSpecialty'), H.el('regSpecialtyError')],
      CourseYear: [H.el('regCourse'), H.el('regCourseError')],
      GroupName: [H.el('regGroup'), H.el('regGroupError')]
    };

    registerForm.addEventListener('submit', function (event) {
      event.preventDefault();

      Object.keys(FIELDS).forEach(function (k) {
        H.setFieldError(FIELDS[k][0], FIELDS[k][1], '');
      });

      var selectedUniversity = window.__hiveSelectedUniversity ? window.__hiveSelectedUniversity() : '';
      var courseValue = H.el('regCourse') ? H.el('regCourse').value : '';

      var payload = {
        firstName: H.el('regFirstName').value.trim(),
        lastName: H.el('regLastName').value.trim(),
        username: (regUsername.value || '').trim().toLowerCase(),
        email: H.el('regEmail').value.trim(),
        password: H.el('regPassword').value,
        university: (selectedUniversity || H.el('regUniversity').value || '').trim(),
        faculty: isAbituriyent ? '' : (H.el('regFaculty') ? H.el('regFaculty').value.trim() : ''),
        specialty: H.el('regSpecialty').value.trim(),
        courseYear: isAbituriyent ? 0 : Number(courseValue),
        groupName: isAbituriyent ? (H.el('regSchoolGrade') ? H.el('regSchoolGrade').value : '11-ci Sinif') : H.el('regGroup').value.trim(),
        age: Number(H.el('regAge').value),
        isAbituriyent: isAbituriyent,
        targetGroup: isAbituriyent ? (H.el('regTargetGroup') ? H.el('regTargetGroup').value : 'I Qrup') : null
      };

      var checks = [
        ['FirstName', H.validate.name(payload.firstName, 'Ad')],
        ['LastName', H.validate.name(payload.lastName, 'Soyad')],
        ['Username', H.validate.username(payload.username)],
        ['Email', H.validate.email(payload.email)],
        ['Password', H.validate.password(payload.password)],
        ['Age', H.validate.age(H.el('regAge').value)],
        ['University', H.validate.university(payload.university)],
        ['Faculty', isAbituriyent ? '' : H.validate.faculty(payload.faculty)],
        ['Specialty', H.validate.specialty(payload.specialty)],
        ['CourseYear', isAbituriyent ? '' : H.validate.course(courseValue, false)],
        ['GroupName', isAbituriyent ? '' : H.validate.group(payload.groupName)]
      ];

      var firstInvalid = null;
      checks.forEach(function (row) {
        if (!row[1]) return;
        H.setFieldError(FIELDS[row[0]][0], FIELDS[row[0]][1], row[1]);
        if (!firstInvalid) firstInvalid = FIELDS[row[0]][0];
      });

      if (firstInvalid) { firstInvalid.focus(); return; }

      var submit = H.el('registerSubmit');
      H.setLoading(submit, true, 'Hesab yaradılır...');

      H.api.register(payload)
        .then(function (auth) {
          H.saveSession(auth);
          if (window.HiveAudio) window.HiveAudio.playSuccess();
          if (window.HiveConfetti) window.HiveConfetti.fire(120);
          H.toast(I.t('app.welcome') + ', @' + auth.user.username + '!', 'success');
          setTimeout(redirectAfterAuth, 500);
        })
        .catch(function (error) {
          if (error.fieldErrors) {
            Object.keys(error.fieldErrors).forEach(function (key) {
              var target = FIELDS[key];
              var messages = error.fieldErrors[key];
              if (target && messages && messages.length) H.setFieldError(target[0], target[1], messages[0]);
            });
          } else if (error.status === 409 && error.field === 'email') {
            H.setFieldError(FIELDS.Email[0], FIELDS.Email[1], 'Bu e-poçt ilə hesab artıq mövcuddur.');
          } else if (error.status === 409 && error.field === 'username') {
            H.setFieldError(FIELDS.Username[0], FIELDS.Username[1], 'Bu istifadəçi adı artıq mövcuddur.');
          } else if (error.status === 409) {
            H.setFieldError(FIELDS.Username[0], FIELDS.Username[1], 'Bu istifadəçi adı və ya e-poçt artıq mövcuddur.');
          } else {
            H.toast(error.message, 'error');
          }
        })
        .then(function () { H.setLoading(submit, false); });
    });
  }

  /* ---------- Artıq daxil olmuşsa ------------------------------------------- */

  if (H.isLoggedIn() && (loginForm || registerForm)) {
    // Token etibarlıdırsa birbaşa tətbiqə keç
    H.api.me()
      .then(function (user) {
        H.saveUser(user);
        redirectAfterAuth();
      })
      .catch(function () { H.clearSession(); });
  }
})();
