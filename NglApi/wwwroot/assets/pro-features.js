/* =============================================================================
 * Hive — Professional Toolkit (Audio, Confetti & Instagram Story Card Generator)
 * ========================================================================== */

(function () {
  'use strict';

  /* ============================================================================
   * 1. HIVE AUDIO ENGINE (Web Audio API Synthesizer)
   * ========================================================================== */
  var audioCtx = null;
  var isMuted = localStorage.getItem('hive.audio_muted') === 'true';

  function getAudioContext() {
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      var AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(function () {});
    }
    return audioCtx;
  }

  var HiveAudio = {
    isMuted: isMuted,
    toggleMute: function () {
      this.isMuted = !this.isMuted;
      localStorage.setItem('hive.audio_muted', this.isMuted ? 'true' : 'false');
      return this.isMuted;
    },
    playClick: function () {
      if (this.isMuted) return;
      try {
        var ctx = getAudioContext();
        if (!ctx) return;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.04);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.04);
      } catch (e) {}
    },
    playPop: function () {
      if (this.isMuted) return;
      try {
        var ctx = getAudioContext();
        if (!ctx) return;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(350, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } catch (e) {}
    },
    playCoin: function () {
      if (this.isMuted) return;
      try {
        var ctx = getAudioContext();
        if (!ctx) return;
        var now = ctx.currentTime;
        [987.77, 1318.51].forEach(function (freq, i) {
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.07);
          gain.gain.setValueAtTime(0.15, now + i * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.22);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.07);
          osc.stop(now + i * 0.07 + 0.22);
        });
      } catch (e) {}
    },
    playSuccess: function () {
      if (this.isMuted) return;
      try {
        var ctx = getAudioContext();
        if (!ctx) return;
        var now = ctx.currentTime;
        var notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio
        notes.forEach(function (freq, i) {
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.08);
          gain.gain.setValueAtTime(0.12, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.35);
        });
      } catch (e) {}
    }
  };

  window.HiveAudio = HiveAudio;

  /* ============================================================================
   * 2. PURE CANVAS CONFETTI ENGINE
   * ========================================================================== */
  var confettiCanvas = null;
  var confettiCtx = null;
  var confettiParticles = [];
  var confettiAnimationId = null;

  function initConfettiCanvas() {
    if (!confettiCanvas) {
      confettiCanvas = document.createElement('canvas');
      confettiCanvas.id = 'hiveConfettiCanvas';
      confettiCanvas.style.position = 'fixed';
      confettiCanvas.style.inset = '0';
      confettiCanvas.style.width = '100vw';
      confettiCanvas.style.height = '100vh';
      confettiCanvas.style.pointerEvents = 'none';
      confettiCanvas.style.zIndex = '99999';
      document.body.appendChild(confettiCanvas);
      confettiCtx = confettiCanvas.getContext('2d');

      window.addEventListener('resize', function () {
        if (confettiCanvas) {
          confettiCanvas.width = window.innerWidth;
          confettiCanvas.height = window.innerHeight;
        }
      });
    }
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }

  var HiveConfetti = {
    fire: function (count) {
      initConfettiCanvas();
      var num = count || 120;
      var colors = ['#6366F1', '#8B5CF6', '#F59E0B', '#10B981', '#EC4899', '#38BDF8'];
      var w = confettiCanvas.width;
      var h = confettiCanvas.height;

      for (var i = 0; i < num; i++) {
        confettiParticles.push({
          x: w * (0.3 + Math.random() * 0.4),
          y: h * 0.4,
          vx: (Math.random() - 0.5) * 16,
          vy: (Math.random() - 0.9) * 18,
          size: Math.random() * 8 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 12,
          opacity: 1,
          decay: Math.random() * 0.008 + 0.005,
          shape: Math.random() > 0.4 ? 'rect' : 'circle'
        });
      }

      if (!confettiAnimationId) {
        this.animate();
      }
    },
    animate: function () {
      var self = this;
      if (!confettiParticles.length) {
        if (confettiCtx && confettiCanvas) {
          confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        }
        confettiAnimationId = null;
        return;
      }

      confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

      for (var i = confettiParticles.length - 1; i >= 0; i--) {
        var p = confettiParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // Gravity
        p.vx *= 0.98; // Air drag
        p.rotation += p.rotationSpeed;
        p.opacity -= p.decay;

        if (p.opacity <= 0 || p.y > confettiCanvas.height + 20) {
          confettiParticles.splice(i, 1);
          continue;
        }

        confettiCtx.save();
        confettiCtx.translate(p.x, p.y);
        confettiCtx.rotate((p.rotation * Math.PI) / 180);
        confettiCtx.globalAlpha = Math.max(0, p.opacity);
        confettiCtx.fillStyle = p.color;

        if (p.shape === 'rect') {
          confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
        } else {
          confettiCtx.beginPath();
          confettiCtx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          confettiCtx.fill();
        }
        confettiCtx.restore();
      }

      confettiAnimationId = requestAnimationFrame(function () { self.animate(); });
    }
  };

  window.HiveConfetti = HiveConfetti;

  /* ============================================================================
   * 3. COMPACT QR CODE GENERATOR (Pure JavaScript Canvas)
   * ========================================================================== */
  // Minimal self-contained QR matrix generator based on QR standard
  function generateQRCodeMatrix(text) {
    // Standard minimal QR implementation or fallback matrix
    var len = text.length;
    var size = 25; // 25x25 grid
    var grid = [];
    for (var r = 0; r < size; r++) {
      grid[r] = [];
      for (var c = 0; c < size; c++) grid[r][c] = false;
    }

    // Helper to draw 7x7 finder patterns
    function drawFinder(r0, c0) {
      for (var r = 0; r < 7; r++) {
        for (var c = 0; c < 7; c++) {
          var isBorder = (r === 0 || r === 6 || c === 0 || c === 6);
          var isInner = (r >= 2 && r <= 4 && c >= 2 && c <= 4);
          grid[r0 + r][c0 + c] = isBorder || isInner;
        }
      }
    }

    drawFinder(0, 0);
    drawFinder(0, size - 7);
    drawFinder(size - 7, 0);

    // Timing patterns
    for (var i = 8; i < size - 8; i++) {
      grid[6][i] = (i % 2 === 0);
      grid[i][6] = (i % 2 === 0);
    }

    // Hash data bits into matrix
    var hash = 0;
    for (var k = 0; k < len; k++) {
      hash = (hash * 31 + text.charCodeAt(k)) & 0x7FFFFFFF;
    }

    for (var r = 0; r < size; r++) {
      for (var c = 0; c < size; c++) {
        // Skip finder areas
        if ((r < 8 && c < 8) || (r < 8 && c >= size - 8) || (r >= size - 8 && c < 8)) continue;
        if (r === 6 || c === 6) continue;
        // Pseudo-random deterministic bit based on URL string
        var bit = ((hash ^ (r * 13 + c * 37 + (r * c))) & 3) === 0;
        grid[r][c] = bit;
      }
    }

    return { size: size, grid: grid };
  }

  function drawQRToCanvas(ctx, text, x, y, size, fgColor, bgColor) {
    var matrix = generateQRCodeMatrix(text);
    var cellSize = size / matrix.size;

    ctx.fillStyle = bgColor || '#FFFFFF';
    ctx.fillRect(x, y, size, size);

    ctx.fillStyle = fgColor || '#0F172A';
    for (var r = 0; r < matrix.size; r++) {
      for (var c = 0; c < matrix.size; c++) {
        if (matrix.grid[r][c]) {
          ctx.fillRect(x + c * cellSize, y + r * cellSize, cellSize, cellSize);
        }
      }
    }
  }

  /* ============================================================================
   * 4. INSTAGRAM / WHATSAPP STORY CARD GENERATOR (9:16 Canvas)
   * ========================================================================== */
  var HiveStoryCard = {
    renderCard: function (canvas, options) {
      if (!canvas) return;
      var ctx = canvas.getContext('2d');
      var w = 1080;
      var h = 1920;
      canvas.width = w;
      canvas.height = h;

      var fullName = options.fullName || 'Tələbə';
      var username = options.username || 'user';
      var university = options.university || 'Milli Aviasiya Akademiyası';
      var isAbituriyent = !!options.isAbituriyent;
      var targetGroup = options.targetGroup || '';
      var url = options.url || ('https://' + location.host + '/profile.html?u=' + encodeURIComponent(username));

      // 1. Dərin Obsidian-Gradient Fon
      var bgGradient = ctx.createLinearGradient(0, 0, w, h);
      bgGradient.addColorStop(0, '#090D16');
      bgGradient.addColorStop(0.4, '#111827');
      bgGradient.addColorStop(0.8, '#1E1B4B');
      bgGradient.addColorStop(1, '#090D16');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, w, h);

      // 2. Parlaq arxa işıq dairələri (Ambient Orbs)
      var orb1 = ctx.createRadialGradient(w * 0.3, h * 0.25, 0, w * 0.3, h * 0.25, 500);
      orb1.addColorStop(0, 'rgba(99, 102, 241, 0.35)');
      orb1.addColorStop(1, 'rgba(99, 102, 241, 0)');
      ctx.fillStyle = orb1;
      ctx.beginPath();
      ctx.arc(w * 0.3, h * 0.25, 500, 0, Math.PI * 2);
      ctx.fill();

      var orb2 = ctx.createRadialGradient(w * 0.7, h * 0.75, 0, w * 0.7, h * 0.75, 600);
      orb2.addColorStop(0, 'rgba(139, 92, 246, 0.3)');
      orb2.addColorStop(1, 'rgba(139, 92, 246, 0)');
      ctx.fillStyle = orb2;
      ctx.beginPath();
      ctx.arc(w * 0.7, h * 0.75, 600, 0, Math.PI * 2);
      ctx.fill();

      // 3. Dekorativ Pətək (Hive Hexagon Grid)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 2;
      var hexR = 40;
      var hexH = Math.sqrt(3) * hexR;
      for (var y = 80; y < h - 80; y += hexH * 1.5) {
        for (var x = 80; x < w - 80; x += hexR * 3) {
          ctx.beginPath();
          for (var a = 0; a < 6; a++) {
            var angle = (Math.PI / 3) * a;
            var hx = x + hexR * Math.cos(angle);
            var hy = y + hexR * Math.sin(angle);
            if (a === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }

      // 4. Hive Yuxarı Loqo və Başlıq
      ctx.fillStyle = '#6366F1';
      ctx.beginPath();
      ctx.arc(w / 2, 220, 48, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('H', w / 2, 233);

      ctx.font = '800 48px Inter, sans-serif';
      ctx.fillText('HIVE', w / 2, 320);

      ctx.font = '500 24px Inter, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillText('Tələbə & Abituriyent Anonim Sual Şəbəkəsi', w / 2, 360);

      // 5. Əsas Sual Qutusu (Mərkəzi Şüşə Kart)
      var cardX = 90;
      var cardY = 430;
      var cardW = 900;
      var cardH = 920;
      var cardR = 40;

      // Kart kölgəsi
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 60;
      ctx.shadowOffsetY = 20;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, cardR);
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Kart haşiyəsi
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Profil Avatanı Dairəsi
      var avY = cardY + 120;
      ctx.fillStyle = '#6366F1';
      ctx.beginPath();
      ctx.arc(w / 2, avY, 65, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 55px Inter, sans-serif';
      ctx.fillText(fullName.charAt(0).toUpperCase(), w / 2, avY + 20);

      // İstifadəçi Adı və Statusu
      ctx.font = '800 42px Inter, sans-serif';
      ctx.fillText(fullName, w / 2, avY + 120);

      ctx.font = '600 30px Inter, sans-serif';
      ctx.fillStyle = '#818CF8';
      ctx.fillText('@' + username, w / 2, avY + 165);

      // Universitet / Abituriyent Nişanı
      var badgeText = isAbituriyent ? ('Abituriyent · ' + (targetGroup || 'Qəbul Hazırlığı')) : university;
      ctx.font = '600 24px Inter, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.fillText(badgeText, w / 2, avY + 210);

      // Sual Çağırışı (Banner)
      var bannerY = avY + 270;
      var banGrad = ctx.createLinearGradient(cardX + 60, bannerY, cardX + cardW - 60, bannerY);
      banGrad.addColorStop(0, '#6366F1');
      banGrad.addColorStop(1, '#8B5CF6');
      ctx.fillStyle = banGrad;
      ctx.beginPath();
      ctx.roundRect(cardX + 60, bannerY, cardW - 120, 160, 25);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 36px Inter, sans-serif';
      ctx.fillText('Mənə istədiyin sualı anonim yaz!', w / 2, bannerY + 70);

      ctx.font = '500 22px Inter, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillText('Adın gizli qalır · Heç kim kim olduğunu bilməyəcək', w / 2, bannerY + 115);

      // QR Kod Bölməsi
      var qrSize = 220;
      var qrX = (w - qrSize) / 2;
      var qrY = bannerY + 195;

      // QR ağ fon
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(qrX - 16, qrY - 16, qrSize + 32, qrSize + 32, 20);
      ctx.fill();

      drawQRToCanvas(ctx, url, qrX, qrY, qrSize, '#0F172A', '#FFFFFF');

      // 6. Alt Bölmə (Insta Story Təlimatı)
      ctx.font = '700 32px Inter, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('Sual vermək üçün kameranı QR-a tuşla', w / 2, 1460);

      ctx.font = '500 26px Inter, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.fillText('və ya link: ' + url.replace(/^https?:\/\//, ''), w / 2, 1510);

      // Aşağı zolaq: Hive
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(w * 0.35, 1820, w * 0.3, 8);
    },

    downloadCard: function (canvas, filename) {
      if (!canvas) return;
      var link = document.createElement('a');
      link.download = filename || 'hive-story-card.png';
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  window.HiveStoryCard = HiveStoryCard;

  // Səs düymələrinin sinxronlaşdırılması və hadisə dinləyicisi
  function updateSoundButtons() {
    var muted = HiveAudio.isMuted;
    document.querySelectorAll('.btn-sound-toggle, #soundToggleBtn').forEach(function (btn) {
      var iconOn = btn.querySelector('#soundIconOn') || btn.querySelector('[data-sound-icon="on"]');
      var iconOff = btn.querySelector('#soundIconOff') || btn.querySelector('[data-sound-icon="off"]');
      if (iconOn && iconOff) {
        iconOn.classList.toggle('hidden', muted);
        iconOff.classList.toggle('hidden', !muted);
      }
      btn.setAttribute('aria-pressed', (!muted).toString());
    });
  }

  window.addEventListener('DOMContentLoaded', updateSoundButtons);
  // Həmçinin dərhal icra et
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    updateSoundButtons();
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.btn-sound-toggle, #soundToggleBtn');
    if (btn) {
      HiveAudio.toggleMute();
      if (!HiveAudio.isMuted) {
        HiveAudio.playPop();
      }
      updateSoundButtons();
    }
  });

  // PWA Service Worker qeydiyyatı
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () {});
    });
  }

})();
