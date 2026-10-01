/* =============================================================================
 * Hive — açıq (paylaşılan) profil səhifəsi + anonim mesaj forması
 * Ünvan: profile.html?u=<username>
 * ========================================================================== */

(function () {
  'use strict';

  var H = window.Hive;
  var username = (H.queryParam('u') || '').trim().toLowerCase();

  function showError(message) {
    H.show(H.el('profileLoading'), false);
    H.show(H.el('profileContent'), false);
    H.show(H.el('profileError'), true);
    H.setText(H.el('profileErrorText'), message);
  }

  if (!username) {
    showError('Link yanlışdır — istifadəçi adı göstərilməyib.');
    return;
  }

  H.api.publicProfile(username)
    .then(function (profile) {
      H.show(H.el('profileLoading'), false);
      H.show(H.el('profileContent'), true);

      var fullName = ((profile.firstName || '') + ' ' + (profile.lastName || '')).trim();

      H.setText(H.el('pubAvatar'), (profile.firstName || profile.username || '?').charAt(0).toUpperCase());

      // Profil şəkli varsa hərfin yerinə göstərilir
      var avatarUrl = H.avatarSrc(profile.avatarUrl);
      var avatarImg = H.el('pubAvatarImg');
      if (avatarUrl && avatarImg) {
        avatarImg.src = avatarUrl;
        avatarImg.alt = (profile.firstName || profile.username) + ' — profil şəkli';
        H.show(avatarImg, true);
        H.el('pubAvatar').style.display = 'none';
      }

      H.setText(H.el('pubFullName'), fullName || '@' + profile.username);
      H.setText(H.el('pubUsername'), '@' + profile.username);

      if (profile.isAbituriyent) {
        if (H.el('pubAbituriyentBadge')) H.show(H.el('pubAbituriyentBadge'), true);
        H.setText(H.el('pubUniversity'), profile.university ? ('Hədəf Universitet: ' + profile.university) : 'Abituriyent');

        var targetGrp = H.el('pubTargetGroup');
        if (targetGrp) {
          H.setText(targetGrp, profile.targetGroup ? ('Qrup: ' + profile.targetGroup) : 'Abituriyent');
          H.show(targetGrp, true);
        }

        if (profile.specialty) {
          H.setText(H.el('pubSpecialty'), 'Hədəf İxtisas: ' + profile.specialty);
          H.show(H.el('pubSpecialty'), true);
        } else {
          H.show(H.el('pubSpecialty'), false);
        }

        H.show(H.el('pubFaculty'), false);
        H.show(H.el('pubCourse'), false);
        H.setText(H.el('pubGroup'), profile.groupName ? ('Məktəb / Sinif: ' + profile.groupName) : 'Məktəbli');
      } else {
        if (H.el('pubAbituriyentBadge')) H.show(H.el('pubAbituriyentBadge'), false);
        var targetGrpOld = H.el('pubTargetGroup');
        if (targetGrpOld) H.show(targetGrpOld, false);

        H.setText(H.el('pubUniversity'), profile.university || '—');
        H.setText(H.el('pubSpecialty'), profile.specialty || '—');
        H.show(H.el('pubSpecialty'), true);
        H.setText(H.el('pubFaculty'), profile.faculty || '—');
        H.show(H.el('pubFaculty'), true);
        H.setText(H.el('pubCourse'), H.courseLabel(profile.courseYear));
        H.show(H.el('pubCourse'), true);
        H.setText(H.el('pubGroup'), '№ ' + (profile.groupName || '—'));
      }

      document.title = (fullName || '@' + profile.username) + ' — Hive';
    })
    .catch(function (error) {
      showError(error.status === 404
        ? 'Bu istifadəçi tapılmadı. Link yanlış ola bilər.'
        : error.message);
    });

  /* ---------- Anonim mesaj -------------------------------------------------- */

  var form = H.el('anonForm');
  var input = H.el('anonMessage');
  var errorBox = H.el('anonError');
  var counter = H.el('anonCount');

  function updateCount() {
    var len = input.value.length;
    H.setText(counter, len + '/' + H.MAX_ANON_MESSAGE);
  }

  if (input) {
    input.addEventListener('input', function () {
      updateCount();
      H.setFieldError(input, errorBox, '');
    });
  }

  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var content = input.value.trim();
      var message = '';
      if (!content) message = 'Mesaj boş ola bilməz.';
      else if (content.length > H.MAX_ANON_MESSAGE) message = 'Mesaj ' + H.MAX_ANON_MESSAGE + ' simvoldan uzun ola bilməz.';

      if (message) {
        H.setFieldError(input, errorBox, message);
        input.focus();
        return;
      }

      H.setFieldError(input, errorBox, '');
      var submit = H.el('anonSubmit');
      H.setLoading(submit, true, '...');

      H.api.sendAnonymous(username, content)
        .then(function () {
          if (window.HiveAudio) window.HiveAudio.playPop();
          if (window.HiveConfetti) window.HiveConfetti.fire(75);
          input.value = '';
          updateCount();
          H.show(form, false);
          H.show(H.el('anonSuccess'), true);
          H.toast('Mesaj anonim olaraq göndərildi.', 'success');
        })
        .catch(function (error) {
          H.setFieldError(input, errorBox, error.message);
          H.toast(error.message, 'error');
        })
        .then(function () { H.setLoading(submit, false); });
    });
  }

  if (H.el('anonAgain')) {
    H.el('anonAgain').addEventListener('click', function () {
      H.show(H.el('anonSuccess'), false);
      H.show(form, true);
      input.value = '';
      updateCount();
      H.setFieldError(input, errorBox, '');
      input.focus();
    });
  }

  updateCount();
})();
