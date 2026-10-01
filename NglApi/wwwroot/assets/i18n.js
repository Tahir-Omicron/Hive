/* =============================================================================
 * Hive — çoxdillilik (Azərbaycan, Rus, Türk, İngilis)
 *
 * İstifadə:
 *   <h1 data-i18n="hero.title"></h1>
 *   <input data-i18n-placeholder="auth.email" />
 *   <span data-i18n-aria="auth.showPassword"></span>
 *   JS: window.HiveI18n.t('app.feed.title')
 *
 * Dil seçimi localStorage-da saxlanılır; <html lang> da yenilənir.
 * ========================================================================== */

(function () {
  'use strict';

  var STORAGE_KEY = 'hive.lang';
  var SUPPORTED = ['az', 'ru', 'tr', 'en'];

  var DICT = {
    az: {
      'nav.home': 'Ana səhifə',
      'nav.about': 'Haqqımızda',
      'nav.contact': 'Əlaqə',
      'nav.signin': 'Daxil ol',
      'nav.signup': 'Qeydiyyat',
      'nav.menu': 'Menyunu aç',
      'nav.theme': 'Gündüz / gecə rejimi',
      'nav.lang': 'Dil',

      'hero.badge': 'Azərbaycan universitetləri üçün',
      'hero.title': 'Tələbə həyatını bir yerdə idarə et',
      'hero.text': 'Hive — universitetlərdə oxuyan tələbələr üçün platforma. Akademik profilini yarat, qrup yoldaşlarını tap və sənə anonim mesajlar göndərilsin.',
      'hero.cta1': 'Qeydiyyatdan keç',
      'hero.cta2': 'Xidmətlərə bax',

      'services.title': 'Nə təqdim edirik',
      'services.subtitle': 'Tələbələr üçün dörd əsas imkan.',
      'services.1.t': 'Akademik profil',
      'services.1.d': 'Universitet, fakültə, ixtisas, kurs və qrup məlumatların bir profildə.',
      'services.2.t': 'Anonim mesajlar',
      'services.2.d': 'Paylaşdığın linkə daxil olan hər kəs sənə anonim yaza bilər.',
      'services.3.t': 'Direct mesajlaşma',
      'services.3.d': 'Digər tələbələrlə birbaşa yazışma apar.',
      'services.4.t': 'Axtarış',
      'services.4.d': 'Ad, soyad və ya istifadəçi adı ilə tələbələri tap.',

      'about.title': 'Haqqımızda',
      'about.text': 'Hive müxtəlif universitetlərdə oxuyan tələbələri bir araya gətirir. Məqsədimiz sadədir: təhlükəsiz, aydın və istifadəsi rahat bir mühit yaratmaq.',
      'about.p1.t': 'Təhlükəsiz hesab',
      'about.p1.d': 'Parollar PBKDF2 ilə hash olunur, sessiya JWT ilə qorunur.',
      'about.p2.t': '30-dan çox universitet',
      'about.p2.d': 'Universiteti axtarış edərək seçirsən.',
      'about.p3.t': 'Bütün cihazlarda',
      'about.p3.d': 'Telefon, planşet və kompüterdə rahat işləyir.',

      'contact.badge': 'Tələbə Dəstək Mərkəzi',
      'contact.title': 'Bizimlə əlaqə saxla',
      'contact.text': 'Universitetinin əlavə olunması, təkliflərin və ya hər hansı sualın üçün komandamız kömək etməyə hazırdır.',
      'contact.email': 'Rəsmi dəstək e-poçtu',
      'contact.location': 'Mərkəz və icma',
      'contact.location.value': 'Bakı, Azərbaycan · Tələbə İcma Şəbəkəsi',
      'contact.hours': 'İş günləri · Adətən 2–4 saat ərzində cavab',
      'contact.status': 'Onlayn Dəstək',
      'contact.copy': 'Kopyala',
      'contact.copied': 'E-poçt kopyalandı!',
      'contact.write': 'Yaz',
      'contact.faq.title': 'Tələbə təşkilatları və klublar',
      'contact.faq.desc': 'Tərəfdaşlıq, kampus tədbirləri və universitet səhifəsi təklifləri üçün birbaşa müraciət edə bilərsiniz.',
      'contact.topic.label': 'Müraciətin mövzusu',
      'contact.topic.general': 'Ümumi sual',
      'contact.topic.uni': 'Universitet əlavə et',
      'contact.topic.tech': 'Texniki dəstək',
      'contact.topic.partner': 'Tələbə klubu / Əməkdaşlıq',
      'contact.form.name': 'Ad və soyadınız',
      'contact.form.email': 'Tələbə və ya şəxsi e-poçtunuz',
      'contact.form.message': 'Mesajınız və ya təklifiniz',
      'contact.form.send': 'Mesajı göndər',
      'contact.form.note': 'Mesaj birbaşa e-poçt proqramınızda formalaşdırılıb açılacaq.',
      'contact.security': 'Təhlükəsiz ötürmə · Anonimliyiniz qorunur',

      'footer.tagline': 'Tələbələr üçün peşəkar şəbəkə.',
      'footer.links': 'Keçidlər',
      'footer.legal': 'Hüquqi məlumat',
      'footer.language': 'Dil',
      'footer.follow': 'Bizi izləyin',
      'footer.contact': 'Əlaqə məlumatları',
      'footer.legal.privacy': 'Məxfilik siyasəti',
      'footer.legal.terms': 'İstifadə şərtləri',
      'footer.legal.cookies': 'Cookie siyasəti',
      'footer.rights': 'Bütün hüquqlar qorunur.',

      'auth.login.title': 'Hesabına daxil ol',
      'auth.login.submit': 'Daxil ol',
      'auth.login.noAccount': 'Hesabın yoxdur?',
      'auth.register.title': 'Hesab yarat',
      'auth.register.submit': 'Qeydiyyatdan keç',
      'auth.register.hasAccount': 'Artıq hesabın var?',
      'auth.back': 'Ana səhifəyə qayıt',
      'auth.firstName': 'Ad',
      'auth.lastName': 'Soyad',
      'auth.username': 'İstifadəçi adı',
      'auth.email': 'E-poçt',
      'auth.password': 'Parol',
      'auth.age': 'Yaş',
      'auth.university': 'Universitet',
      'auth.faculty': 'Fakültə (istəyə bağlı)',
      'auth.specialty': 'İxtisas',
      'auth.course': 'Kurs',
      'auth.group': 'Qrup nömrəsi',
      'auth.showPassword': 'Parolu göstər',
      'auth.hidePassword': 'Parolu gizlət',
      'auth.course.placeholder': 'Kurs seçin',
      'auth.course.1': '1-ci kurs',
      'auth.course.2': '2-ci kurs',
      'auth.course.3': '3-cü kurs',
      'auth.course.4': '4-cü kurs',
      'auth.course.5': 'Magistr',

      'app.home': 'Ana səhifə',
      'app.direct': 'Direct',
      'app.search': 'Axtarış',
      'app.profile': 'Profil',
      'app.feed.title': 'Anonim axın',
      'app.feed.empty': 'Hələ mesaj yoxdur. Linkini paylaş ki, ilk mesajlar gəlsin.',
      'app.notif.title': 'Bildirişlər',
      'app.notif.empty': 'Yeni bildiriş yoxdur.',
      'app.notif.new': 'Yeni anonim mesaj',
      'app.direct.empty': 'Hələ söhbət yoxdur. Axtarışdan tələbə tap və yaz.',
      'app.direct.placeholder': 'Mesaj yaz...',
      'app.direct.send': 'Göndər',
      'app.search.placeholder': 'Ad, soyad və ya istifadəçi adı',
      'app.search.empty': 'Nəticə tapılmadı.',
      'app.search.hint': 'Ən azı 2 simvol yaz.',
      'app.profile.share': 'Paylaşım linki',
      'app.profile.copy': 'Kopyala',
      'app.profile.logout': 'Hesabdan çıx',
      'app.welcome': 'Xoş gəldin',

      'time.now': 'indi',
      'time.min': 'dəqiqə əvvəl',
      'time.hour': 'saat əvvəl',
      'time.day': 'gün əvvəl',

      'profile.edit': 'Profili redaktə et',
      'profile.save': 'Yadda saxla',
      'profile.saving': 'Yadda saxlanılır...',
      'profile.saved': 'Profil yeniləndi.',
      'profile.usernameFree': 'İstifadəçi adını indi dəyişə bilərsən.',
      'profile.usernameLocked': 'İstifadəçi adı {date} tarixindən sonra dəyişdirilə bilər ({days} gün sonra).',
      'profile.usernameOnce': 'İstifadəçi adı 14 gündə bir dəfə dəyişdirilə bilər.',

      'ai.title': 'AI köməkçilər',
      'ai.badge': 'AI',
      'ai.note': 'Simulyasiya hesabı — cavablar şablon əsaslıdır.',
      'ai.chat': 'Yaz',

      'feed.composer': 'Nə paylaşmaq istəyirsən?',
      'feed.post': 'Paylaş',
      'feed.new': 'Yeni paylaşım',
      'feed.posted': 'Paylaşımın əlavə olundu.',

      'avatar.title': 'Profil şəkli',
      'avatar.choose': 'Şəkil seç',
      'avatar.upload': 'Yüklə',
      'avatar.uploading': 'Yüklənir...',
      'avatar.remove': 'Şəkli sil',
      'avatar.hint': 'JPEG, PNG və ya WEBP · maksimum 2 MB',
      'avatar.saved': 'Profil şəkli yeniləndi.',
      'avatar.removed': 'Profil şəkli silindi.',
      'avatar.invalidType': 'Yalnız JPEG, PNG və ya WEBP formatı seçilə bilər.',
      'avatar.tooLarge': 'Şəkil ölçüsü 2 MB-dan çox ola bilməz.',

      'logout.done': 'Hesabdan çıxdın.',

      'landing.uni.title': 'Universitetlər',
      'landing.uni.text': 'Platforma Azərbaycanın 30-dan çox universitetini dəstəkləyir.'
    },

    ru: {
      'nav.home': 'Главная',
      'nav.about': 'О нас',
      'nav.contact': 'Контакты',
      'nav.signin': 'Войти',
      'nav.signup': 'Регистрация',
      'nav.menu': 'Открыть меню',
      'nav.theme': 'Дневной / ночной режим',
      'nav.lang': 'Язык',

      'hero.badge': 'Для университетов Азербайджана',
      'hero.title': 'Управляй студенческой жизнью в одном месте',
      'hero.text': 'Hive — платформа для студентов университетов. Создай академический профиль, находи однокурсников и получай анонимные сообщения.',
      'hero.cta1': 'Зарегистрироваться',
      'hero.cta2': 'Посмотреть возможности',

      'services.title': 'Что мы предлагаем',
      'services.subtitle': 'Четыре основные возможности для студентов.',
      'services.1.t': 'Академический профиль',
      'services.1.d': 'Университет, факультет, специальность, курс и группа в одном профиле.',
      'services.2.t': 'Анонимные сообщения',
      'services.2.d': 'Любой, кто откроет вашу ссылку, может написать анонимно.',
      'services.3.t': 'Личные сообщения',
      'services.3.d': 'Общайтесь с другими студентами напрямую.',
      'services.4.t': 'Поиск',
      'services.4.d': 'Находите студентов по имени, фамилии или нику.',

      'about.title': 'О нас',
      'about.text': 'Hive объединяет студентов разных университетов. Наша цель проста: создать безопасную, понятную и удобную среду.',
      'about.p1.t': 'Безопасный аккаунт',
      'about.p1.d': 'Пароли хешируются через PBKDF2, сессия защищена JWT.',
      'about.p2.t': 'Более 30 университетов',
      'about.p2.d': 'Выбор университета с поиском.',
      'about.p3.t': 'На всех устройствах',
      'about.p3.d': 'Удобно на телефоне, планшете и компьютере.',

      'contact.badge': 'Студенческий центр поддержки',
      'contact.title': 'Свяжитесь с нами',
      'contact.text': 'Добавление университета, предложения или любые вопросы — наша команда всегда готова помочь.',
      'contact.email': 'Официальная почта поддержки',
      'contact.location': 'Центр и сообщество',
      'contact.location.value': 'Баку, Азербайджан · Студенческая сеть',
      'contact.hours': 'Будни · Обычно ответ в течение 2–4 часов',
      'contact.status': 'Онлайн-поддержка',
      'contact.copy': 'Копировать',
      'contact.copied': 'Email скопирован!',
      'contact.write': 'Написать',
      'contact.faq.title': 'Студенческие организации и клубы',
      'contact.faq.desc': 'Для партнерства, мероприятий и интеграции университета пишите напрямую.',
      'contact.topic.label': 'Тема обращения',
      'contact.topic.general': 'Общий вопрос',
      'contact.topic.uni': 'Добавить вуз',
      'contact.topic.tech': 'Техническая ошибка',
      'contact.topic.partner': 'Клуб / Партнерство',
      'contact.form.name': 'Ваше имя и фамилия',
      'contact.form.email': 'Студенческий или личный email',
      'contact.form.message': 'Ваше сообщение или предложение',
      'contact.form.send': 'Отправить сообщение',
      'contact.form.note': 'Сообщение сформируется и откроется в вашей почтовой программе.',
      'contact.security': 'Безопасная передача данных',

      'footer.tagline': 'Профессиональная сеть для студентов.',
      'footer.links': 'Ссылки',
      'footer.legal': 'Правовая информация',
      'footer.language': 'Язык',
      'footer.follow': 'Мы в соцсетях',
      'footer.contact': 'Контактная информация',
      'footer.legal.privacy': 'Политика конфиденциальности',
      'footer.legal.terms': 'Условия использования',
      'footer.legal.cookies': 'Политика cookie',
      'footer.rights': 'Все права защищены.',

      'auth.login.title': 'Войти в аккаунт',
      'auth.login.submit': 'Войти',
      'auth.login.noAccount': 'Нет аккаунта?',
      'auth.register.title': 'Создать аккаунт',
      'auth.register.submit': 'Зарегистрироваться',
      'auth.register.hasAccount': 'Уже есть аккаунт?',
      'auth.back': 'Вернуться на главную',
      'auth.firstName': 'Имя',
      'auth.lastName': 'Фамилия',
      'auth.username': 'Имя пользователя',
      'auth.email': 'Email',
      'auth.password': 'Пароль',
      'auth.age': 'Возраст',
      'auth.university': 'Университет',
      'auth.faculty': 'Факультет (необязательно)',
      'auth.specialty': 'Специальность',
      'auth.course': 'Курс',
      'auth.group': 'Номер группы',
      'auth.showPassword': 'Показать пароль',
      'auth.hidePassword': 'Скрыть пароль',
      'auth.course.placeholder': 'Выберите курс',
      'auth.course.1': '1 курс',
      'auth.course.2': '2 курс',
      'auth.course.3': '3 курс',
      'auth.course.4': '4 курс',
      'auth.course.5': 'Магистратура',

      'app.home': 'Главная',
      'app.direct': 'Direct',
      'app.search': 'Поиск',
      'app.profile': 'Профиль',
      'app.feed.title': 'Анонимная лента',
      'app.feed.empty': 'Сообщений пока нет. Поделитесь ссылкой, чтобы получить первые.',
      'app.notif.title': 'Уведомления',
      'app.notif.empty': 'Новых уведомлений нет.',
      'app.notif.new': 'Новое анонимное сообщение',
      'app.direct.empty': 'Пока нет переписки. Найдите студента через поиск и напишите.',
      'app.direct.placeholder': 'Написать сообщение...',
      'app.direct.send': 'Отправить',
      'app.search.placeholder': 'Имя, фамилия или ник',
      'app.search.empty': 'Ничего не найдено.',
      'app.search.hint': 'Введите минимум 2 символа.',
      'app.profile.share': 'Ссылка профиля',
      'app.profile.copy': 'Копировать',
      'app.profile.logout': 'Выйти',
      'app.welcome': 'Добро пожаловать',

      'time.now': 'только что',
      'time.min': 'мин назад',
      'time.hour': 'ч назад',
      'time.day': 'дн назад',

      'profile.edit': 'Редактировать профиль',
      'profile.save': 'Сохранить',
      'profile.saving': 'Сохранение...',
      'profile.saved': 'Профиль обновлён.',
      'profile.usernameFree': 'Имя пользователя можно изменить сейчас.',
      'profile.usernameLocked': 'Имя пользователя можно изменить после {date} (через {days} дн.).',
      'profile.usernameOnce': 'Имя пользователя можно менять раз в 14 дней.',

      'ai.title': 'AI-помощники',
      'ai.badge': 'AI',
      'ai.note': 'Симуляция — ответы формируются по шаблонам.',
      'ai.chat': 'Написать',

      'feed.composer': 'Чем поделишься?',
      'feed.post': 'Опубликовать',
      'feed.new': 'Новая публикация',
      'feed.posted': 'Публикация добавлена.',

      'avatar.title': 'Фото профиля',
      'avatar.choose': 'Выбрать фото',
      'avatar.upload': 'Загрузить',
      'avatar.uploading': 'Загрузка...',
      'avatar.remove': 'Удалить фото',
      'avatar.hint': 'JPEG, PNG или WEBP · максимум 2 МБ',
      'avatar.saved': 'Фото профиля обновлено.',
      'avatar.removed': 'Фото профиля удалено.',
      'avatar.invalidType': 'Можно выбрать только JPEG, PNG или WEBP.',
      'avatar.tooLarge': 'Размер фото не должен превышать 2 МБ.',

      'logout.done': 'Вы вышли из аккаунта.',

      'landing.uni.title': 'Университеты',
      'landing.uni.text': 'Платформа поддерживает более 30 университетов Азербайджана.'
    },

    tr: {
      'nav.home': 'Ana Sayfa',
      'nav.about': 'Hakkımızda',
      'nav.contact': 'İletişim',
      'nav.signin': 'Giriş Yap',
      'nav.signup': 'Kayıt Ol',
      'nav.menu': 'Menüyü aç',
      'nav.theme': 'Gündüz / gece modu',
      'nav.lang': 'Dil',

      'hero.badge': 'Azerbaycan üniversiteleri için',
      'hero.title': 'Öğrenci hayatını tek yerden yönet',
      'hero.text': 'Hive — üniversite öğrencileri için bir platform. Akademik profilini oluştur, sınıf arkadaşlarını bul ve anonim mesajlar al.',
      'hero.cta1': 'Kayıt Ol',
      'hero.cta2': 'Hizmetleri gör',

      'services.title': 'Neler sunuyoruz',
      'services.subtitle': 'Öğrenciler için dört temel özellik.',
      'services.1.t': 'Akademik profil',
      'services.1.d': 'Üniversite, fakülte, bölüm, sınıf ve grup bilgileri tek profilde.',
      'services.2.t': 'Anonim mesajlar',
      'services.2.d': 'Linkini açan herkes sana anonim yazabilir.',
      'services.3.t': 'Direct mesajlaşma',
      'services.3.d': 'Diğer öğrencilerle doğrudan yazış.',
      'services.4.t': 'Arama',
      'services.4.d': 'Öğrencileri ad, soyad veya kullanıcı adıyla bul.',

      'about.title': 'Hakkımızda',
      'about.text': 'Hive farklı üniversitelerdeki öğrencileri bir araya getirir. Amacımız basit: güvenli, anlaşılır ve kullanımı kolay bir ortam yaratmak.',
      'about.p1.t': 'Güvenli hesap',
      'about.p1.d': 'Şifreler PBKDF2 ile hashlenir, oturum JWT ile korunur.',
      'about.p2.t': '30+ üniversite',
      'about.p2.d': 'Üniversiteni arama yaparak seçersin.',
      'about.p3.t': 'Tüm cihazlarda',
      'about.p3.d': 'Telefon, tablet ve bilgisayarda rahat çalışır.',

      'contact.badge': 'Öğrenci Destek Merkezi',
      'contact.title': 'Bizimle İletişime Geçin',
      'contact.text': 'Üniversitenin eklenmesi, öneriler veya her türlü soru için ekibimiz yardımcı olmaya hazır.',
      'contact.email': 'Resmi Destek E-postası',
      'contact.location': 'Merkez ve Topluluk',
      'contact.location.value': 'Bakü, Azerbaycan · Öğrenci Topluluk Ağı',
      'contact.hours': 'Hafta içi · Genellikle 2–4 saat içinde yanıt',
      'contact.status': 'Çevrim İçi Destek',
      'contact.copy': 'Kopyala',
      'contact.copied': 'E-posta kopyalandı!',
      'contact.write': 'Yaz',
      'contact.faq.title': 'Öğrenci kulüpleri ve topluluklar',
      'contact.faq.desc': 'Ortaklık, kampüs etkinlikleri ve üniversite iş birliği için doğrudan yazabilirsiniz.',
      'contact.topic.label': 'Başvuru Konusu',
      'contact.topic.general': 'Genel soru',
      'contact.topic.uni': 'Üniversite ekle',
      'contact.topic.tech': 'Teknik sorun',
      'contact.topic.partner': 'Kulüp / Ortaklık',
      'contact.form.name': 'Adınız ve soyadınız',
      'contact.form.email': 'Öğrenci veya kişisel e-postanız',
      'contact.form.message': 'Mesajınız veya öneriniz',
      'contact.form.send': 'Mesajı Gönder',
      'contact.form.note': 'Mesaj doğrudan e-posta uygulamanızda hazırlanıp açılacaktır.',
      'contact.security': 'Güvenli iletim · Gizliliğiniz korunur',

      'footer.tagline': 'Öğrenciler için profesyonel ağ.',
      'footer.links': 'Bağlantılar',
      'footer.legal': 'Yasal bilgiler',
      'footer.language': 'Dil',
      'footer.follow': 'Bizi takip edin',
      'footer.contact': 'İletişim bilgileri',
      'footer.legal.privacy': 'Gizlilik Politikası',
      'footer.legal.terms': 'Kullanım Şartları',
      'footer.legal.cookies': 'Çerez Politikası',
      'footer.rights': 'Tüm hakları saklıdır.',

      'auth.login.title': 'Hesabına giriş yap',
      'auth.login.submit': 'Giriş Yap',
      'auth.login.noAccount': 'Hesabın yok mu?',
      'auth.register.title': 'Hesap oluştur',
      'auth.register.submit': 'Kayıt Ol',
      'auth.register.hasAccount': 'Zaten hesabın var mı?',
      'auth.back': 'Ana sayfaya dön',
      'auth.firstName': 'Ad',
      'auth.lastName': 'Soyad',
      'auth.username': 'Kullanıcı adı',
      'auth.email': 'E-posta',
      'auth.password': 'Şifre',
      'auth.age': 'Yaş',
      'auth.university': 'Üniversite',
      'auth.faculty': 'Fakülte (isteğe bağlı)',
      'auth.specialty': 'Bölüm',
      'auth.course': 'Sınıf',
      'auth.group': 'Grup numarası',
      'auth.showPassword': 'Şifreyi göster',
      'auth.hidePassword': 'Şifreyi gizle',
      'auth.course.placeholder': 'Sınıf seçin',
      'auth.course.1': '1. sınıf',
      'auth.course.2': '2. sınıf',
      'auth.course.3': '3. sınıf',
      'auth.course.4': '4. sınıf',
      'auth.course.5': 'Yüksek Lisans',

      'app.home': 'Ana Sayfa',
      'app.direct': 'Direct',
      'app.search': 'Arama',
      'app.profile': 'Profil',
      'app.feed.title': 'Anonim akış',
      'app.feed.empty': 'Henüz mesaj yok. Linkini paylaş, ilk mesajlar gelsin.',
      'app.notif.title': 'Bildirimler',
      'app.notif.empty': 'Yeni bildirim yok.',
      'app.notif.new': 'Yeni anonim mesaj',
      'app.direct.empty': 'Henüz sohbet yok. Aramadan bir öğrenci bul ve yaz.',
      'app.direct.placeholder': 'Mesaj yaz...',
      'app.direct.send': 'Gönder',
      'app.search.placeholder': 'Ad, soyad veya kullanıcı adı',
      'app.search.empty': 'Sonuç bulunamadı.',
      'app.search.hint': 'En az 2 karakter yaz.',
      'app.profile.share': 'Paylaşım linki',
      'app.profile.copy': 'Kopyala',
      'app.profile.logout': 'Çıkış yap',
      'app.welcome': 'Hoş geldin',

      'time.now': 'şimdi',
      'time.min': 'dk önce',
      'time.hour': 'saat önce',
      'time.day': 'gün önce',

      'profile.edit': 'Profili düzenle',
      'profile.save': 'Kaydet',
      'profile.saving': 'Kaydediliyor...',
      'profile.saved': 'Profil güncellendi.',
      'profile.usernameFree': 'Kullanıcı adını şimdi değiştirebilirsin.',
      'profile.usernameLocked': 'Kullanıcı adı {date} tarihinden sonra değiştirilebilir ({days} gün sonra).',
      'profile.usernameOnce': 'Kullanıcı adı 14 günde bir değiştirilebilir.',

      'ai.title': 'AI yardımcılar',
      'ai.badge': 'AI',
      'ai.note': 'Simülasyon hesabı — yanıtlar şablon tabanlıdır.',
      'ai.chat': 'Yaz',

      'feed.composer': 'Ne paylaşmak istersin?',
      'feed.post': 'Paylaş',
      'feed.new': 'Yeni paylaşım',
      'feed.posted': 'Paylaşımın eklendi.',

      'avatar.title': 'Profil fotoğrafı',
      'avatar.choose': 'Fotoğraf seç',
      'avatar.upload': 'Yükle',
      'avatar.uploading': 'Yükleniyor...',
      'avatar.remove': 'Fotoğrafı sil',
      'avatar.hint': 'JPEG, PNG veya WEBP · en fazla 2 MB',
      'avatar.saved': 'Profil fotoğrafı güncellendi.',
      'avatar.removed': 'Profil fotoğrafı silindi.',
      'avatar.invalidType': 'Yalnızca JPEG, PNG veya WEBP seçilebilir.',
      'avatar.tooLarge': 'Fotoğraf boyutu 2 MB sərhədini aşamaz.',

      'logout.done': 'Hesaptan çıktın.',

      'landing.uni.title': 'Üniversiteler',
      'landing.uni.text': "Platform Azerbaycan'ın 30'dan fazla üniversitesini destekliyor."
    },

    en: {
      'nav.home': 'Home',
      'nav.about': 'About Us',
      'nav.contact': 'Contact',
      'nav.signin': 'Sign In',
      'nav.signup': 'Sign Up',
      'nav.menu': 'Open menu',
      'nav.theme': 'Light / dark mode',
      'nav.lang': 'Language',

      'hero.badge': 'For universities across Azerbaijan',
      'hero.title': 'Manage your student life in one place',
      'hero.text': 'Hive is a platform for university students. Build your academic profile, find classmates and receive anonymous messages.',
      'hero.cta1': 'Sign Up',
      'hero.cta2': 'See features',

      'services.title': 'What we offer',
      'services.subtitle': 'Four core features for students.',
      'services.1.t': 'Academic profile',
      'services.1.d': 'University, faculty, specialty, year and group in one profile.',
      'services.2.t': 'Anonymous messages',
      'services.2.d': 'Anyone with your link can write to you anonymously.',
      'services.3.t': 'Direct messaging',
      'services.3.d': 'Chat directly with other students.',
      'services.4.t': 'Search',
      'services.4.d': 'Find students by name or username.',

      'about.title': 'About Us',
      'about.text': 'Hive brings together students from different universities. Our goal is simple: a safe, clear and comfortable environment.',
      'about.p1.t': 'Secure account',
      'about.p1.d': 'Passwords are hashed with PBKDF2, sessions are protected with JWT.',
      'about.p2.t': '30+ universities',
      'about.p2.d': 'Choose your university with a searchable list.',
      'about.p3.t': 'On every device',
      'about.p3.d': 'Works comfortably on phone, tablet and desktop.',

      'contact.badge': 'Student Support Hub',
      'contact.title': 'Get in touch with us',
      'contact.text': 'Whether requesting your university to be listed, sharing feedback, or asking questions — our team is here to help.',
      'contact.email': 'Official Support Email',
      'contact.location': 'Hub & Community',
      'contact.location.value': 'Baku, Azerbaijan · Student Community Network',
      'contact.hours': 'Weekdays · Typically responds in 2–4 hours',
      'contact.status': 'Online Support',
      'contact.copy': 'Copy',
      'contact.copied': 'Email copied!',
      'contact.write': 'Write',
      'contact.faq.title': 'Student clubs & organizations',
      'contact.faq.desc': 'Direct channel for campus events, student union partnerships, and page suggestions.',
      'contact.topic.label': 'Select Topic',
      'contact.topic.general': 'General inquiry',
      'contact.topic.uni': 'Add university',
      'contact.topic.tech': 'Technical issue',
      'contact.topic.partner': 'Club / Partnership',
      'contact.form.name': 'Your full name',
      'contact.form.email': 'Student or personal email',
      'contact.form.message': 'Your message or suggestion',
      'contact.form.send': 'Send Message',
      'contact.form.note': 'Your message will open directly in your mail application.',
      'contact.security': 'Secure transfer · Your privacy is protected',

      'footer.tagline': 'A professional network for students.',
      'footer.links': 'Links',
      'footer.legal': 'Legal',
      'footer.language': 'Language',
      'footer.follow': 'Follow us',
      'footer.contact': 'Contact details',
      'footer.legal.privacy': 'Privacy Policy',
      'footer.legal.terms': 'Terms of Use',
      'footer.legal.cookies': 'Cookie Policy',
      'footer.rights': 'All rights reserved.',

      'auth.login.title': 'Sign in to your account',
      'auth.login.submit': 'Sign In',
      'auth.login.noAccount': "Don't have an account?",
      'auth.register.title': 'Create your account',
      'auth.register.submit': 'Sign Up',
      'auth.register.hasAccount': 'Already have an account?',
      'auth.back': 'Back to home',
      'auth.firstName': 'First name',
      'auth.lastName': 'Last name',
      'auth.username': 'Username',
      'auth.email': 'Email',
      'auth.password': 'Password',
      'auth.age': 'Age',
      'auth.university': 'University',
      'auth.faculty': 'Faculty (optional)',
      'auth.specialty': 'Specialty',
      'auth.course': 'Year',
      'auth.group': 'Group number',
      'auth.showPassword': 'Show password',
      'auth.hidePassword': 'Hide password',
      'auth.course.placeholder': 'Select year',
      'auth.course.1': '1st year',
      'auth.course.2': '2nd year',
      'auth.course.3': '3rd year',
      'auth.course.4': '4th year',
      'auth.course.5': "Master's",

      'app.home': 'Home',
      'app.direct': 'Direct',
      'app.search': 'Search',
      'app.profile': 'Profile',
      'app.feed.title': 'Anonymous feed',
      'app.feed.empty': 'No messages yet. Share your link to receive the first ones.',
      'app.notif.title': 'Notifications',
      'app.notif.empty': 'No new notifications.',
      'app.notif.new': 'New anonymous message',
      'app.direct.empty': 'No conversations yet. Find a student in Search and write.',
      'app.direct.placeholder': 'Write a message...',
      'app.direct.send': 'Send',
      'app.search.placeholder': 'Name, surname or username',
      'app.search.empty': 'No results found.',
      'app.search.hint': 'Type at least 2 characters.',
      'app.profile.share': 'Share link',
      'app.profile.copy': 'Copy',
      'app.profile.logout': 'Log out',
      'app.welcome': 'Welcome',

      'time.now': 'now',
      'time.min': 'min ago',
      'time.hour': 'h ago',
      'time.day': 'd ago',

      'profile.edit': 'Edit profile',
      'profile.save': 'Save',
      'profile.saving': 'Saving...',
      'profile.saved': 'Profile updated.',
      'profile.usernameFree': 'You can change your username now.',
      'profile.usernameLocked': 'Username can be changed after {date} (in {days} days).',
      'profile.usernameOnce': 'Username can be changed once every 14 days.',

      'ai.title': 'AI assistants',
      'ai.badge': 'AI',
      'ai.note': 'Simulated account — replies are template-based.',
      'ai.chat': 'Message',

      'feed.composer': 'What do you want to share?',
      'feed.post': 'Post',
      'feed.new': 'New post',
      'feed.posted': 'Your post was added.',

      'avatar.title': 'Profile photo',
      'avatar.choose': 'Choose photo',
      'avatar.upload': 'Upload',
      'avatar.uploading': 'Uploading...',
      'avatar.remove': 'Remove photo',
      'avatar.hint': 'JPEG, PNG or WEBP · maximum 2 MB',
      'avatar.saved': 'Profile photo updated.',
      'avatar.removed': 'Profile photo removed.',
      'avatar.invalidType': 'Only JPEG, PNG or WEBP can be selected.',
      'avatar.tooLarge': 'The photo must not exceed 2 MB.',

      'logout.done': 'You have signed out.',

      'landing.uni.title': 'Universities',
      'landing.uni.text': 'The platform supports more than 30 universities across Azerbaijan.'
    }
  };

  function current() {
    var saved;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) { saved = null; }
    if (saved && SUPPORTED.indexOf(saved) !== -1) return saved;

    // Standart dil Azərbaycan dilidir — digər dillər yalnız seçimlə aktivləşir.
    // (Brauzer dilinə görə avtomatik keçid saytın əsas auditoriyasını
    //  gözlənilməz şəkildə başqa dilə keçirirdi.)
    return 'az';
  }

  function t(key, lang) {
    var dict = DICT[lang || current()] || DICT.az;
    return dict[key] || (DICT.az[key] || key);
  }

  function apply() {
    var lang = current();
    document.documentElement.setAttribute('lang', lang);

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'), lang);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder'), lang));
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria'), lang));
    });

    document.querySelectorAll('[data-lang-select]').forEach(function (sel) {
      sel.value = lang;
    });

    document.querySelectorAll('[data-lang-option]').forEach(function (btn) {
      var active = btn.getAttribute('data-lang-option') === lang;
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      btn.classList.toggle('is-active', active);
    });

    document.dispatchEvent(new CustomEvent('hive:language', { detail: { lang: lang } }));
  }

  function set(lang) {
    if (SUPPORTED.indexOf(lang) === -1) return;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* private mode */ }
    apply();
  }

  // Dil seçiciləri (select və ya düymələr)
  document.addEventListener('change', function (event) {
    var sel = event.target.closest('[data-lang-select]');
    if (sel) set(sel.value);
  });

  document.addEventListener('click', function (event) {
    var btn = event.target.closest('[data-lang-option]');
    if (btn) set(btn.getAttribute('data-lang-option'));
  });

  window.HiveI18n = { t: t, set: set, apply: apply, current: current, supported: SUPPORTED, dict: DICT };

  // Səhifə hazır olan kimi tətbiq et
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }
})();
