# Hive — Tələbələr üçün sosial platforma

.NET 8 · ASP.NET Core Web API · EF Core + SQLite · JWT autentifikasiya
Frontend: təmiz HTML + Tailwind CSS (CDN) + Vanilla JS — build prosesi yoxdur.

## 🎯 Demo hesabı

| Sahə | Dəyər |
|---|---|
| İstifadəçi adı | `tahirquliyev01` |
| Parol | `TahiR_2006!` |
| Ad soyad / yaş | Tahir Quliyev / 20 |
| Universitet / kurs / qrup | Milli Aviasiya Akademiyası / 4-cü kurs / 2453A |

İşə salınmada avtomatik yaradılır (`Services/DemoAccountSeeder.cs`).

## Səhifələr

| Fayl | Rol |
|---|---|
| **`landingpage.html`** | **Giriş nöqtəsi** (`/` bu faylı verir) — naviqasiya, hero, universitet karuseli, Haqqımızda, Əlaqə, geniş footer |
| `loginpage.html` / `registerpage.html` | `Sign In` / `Sign Up` |
| `app.html` | Sosial interfeys: `Home`, `Direct`, `Search`, `Profile` |
| `profile.html?u=<username>` | Paylaşılan açıq profil + anonim mesaj |
| `legal.html` | Hüquqi mətnlər (şablon) |
| `index.html` | Köhnə linklər üçün yönləndirmə (əsas giriş DEYİL) |

`assets/`: `i18n.js` (4 dil), `theme.js` (gündüz/gecə), `api.js`, `landing.js`, `auth.js`, `app.js`,
`profile.js`, `styles.css`, `universities.js` (şəkil manifesti), `universities/` (şəkil faylları)

## Əsas funksiyalar

### Profil idarəetməsi və şəkil yükləmə
- Profildən **ad, soyad və istifadəçi adı** dəyişdirilir (`PUT /api/auth/profile`).
- **İstifadəçi adı 14 gündə bir dəfə** dəyişdirilə bilər. Limit bitməmişsə server `400` qaytarır və
  növbəti dəyişiklik tarixini + qalan günü bildirir; interfeys bunu həm əvvəlcədən, həm də cəhd zamanı göstərir.
- Eyni adı yadda saxlamaq limiti sərf etmir. Tutulmuş ad → `409`.
- Ad/soyad üçün tam validasiya (2-50 simvol) və uğur/xəta mesajları.
- **Profil şəkli yükləmə və dəyişmə (`POST /api/auth/avatar`)**:
  - Formatlar: **JPEG, PNG, WEBP**. Həm müştəri tərəfində, həm də serverdə faylın ilk baytları (magic bytes) yoxlanılır — fayl uzantısını dəyişməklə aldatmaq mümkün deyil.
  - Ölçü: **maksimum 2 MB** (`appsettings.json` → `Avatar:MaxBytes`).
  - Fayllar serverdə `wwwroot/uploads/avatars/<guid>.<ext>` olaraq saxlanılır (orijinal ad heç vaxt işlədilmir).
  - Köhnə şəkil avtomatik silinir (path-traversal hücumlarına qarşı qorunur).
  - Şəkil seçildikdə dərhal **önizləmə** görünür, "Yüklə" düyməsi ilə serverə göndərilir, "Şəkli sil" ilə ləğv edilir (`DELETE /api/auth/avatar`).
  - Şəkil olmayan istifadəçilərdə adın ilk hərfi göstərilir.
  - Səhifə yeniləndikdə (F5) şəkil bazadan oxunaraq qalır.
  - İstifadəçi şəkilləri repoya düşməsin deyə `wwwroot/uploads/` `.gitignore`-a daxil edilib.

### Təhlükəsiz çıxış (Logout)
- Profil bölməsindəki "Çıxış" düyməsi ilə icra olunur (`POST /api/auth/logout`).
- Yalnız `localStorage`-i təmizləməklə kifayətlənmir: hər istifadəçinin bazada bir **`SecurityStamp`**-i var.
- Çıxış zamanı bu möhür serverdə yenidən generasiya edilir (`Guid.NewGuid()`).
- Server hər JWT sorğusunda (`OnTokenValidated`) tokenin daxilindəki möhürlə bazadakı möhürü müqayisə edir.
- Nəticə: çıxış edildikdən sonra köhnə JWT tokeni server tərəfində **dərhal ləğv olunur** və autentifikasiya tələb edən səhifələrə/endpoint-lərə (`/api/auth/me`, `/api/posts`, `/app.html` və s.) giriş tamamilə bağlanır (HTTP `401 Unauthorized`).
- Brauzerin "Geri" (Back) düyməsi ilə keşlənmiş səhifənin görünməməsi üçün `pageshow` hadisəsi ilə sessiya yoxlanılır.

### AI inteqrasiyası (arxitektura hazırdır)
- AI hesabları adi `User` sətirləridir: `IsAi = true` + `AiPersona`.
- Cavab mühərriki interfeyslə ayrılıb: **`IAiResponder`**. Hazırda şablon əsaslı
  **`SimulatedAiResponder`** işləyir (real model DEYİL).
- Real modelə keçid: yeni sinif yazıb `Program.cs`-də tək sətri dəyişmək kifayətdir —
  controller-lər və frontend dəyişmir.
- İstifadəçi AI-a Direct mesaj yazır → AI avtomatik cavab verir və cavab yadda saxlanılır.
- AI hesabları post paylaşır (seed zamanı) və axında `AI` nişanı ilə görünür.
- **Hesab sayı konfiqurasiya ilə idarə olunur:** `appsettings.json` → `Ai:Count` (0-10).
  10 test AI hesabı üçün sadəcə `"Count": 10` yazın — hesablar və postları avtomatik yaradılır.
- AI hesablarının parolu təsadüfi hash-dir → onlara giriş mümkün deyil.

### Axın (feed) və postlar
- `Home` bölməsində paylaşım yazma sahəsi + axın (AI və istifadəçi postları qarışıq).
- Sağ paneldə **AI köməkçilər** siyahısı və **bildirişlər** (anonim mesajlar).

### Dizayn sistemi
- Rənglər CSS dəyişənləri ilə: yumşaq sarı vurğu, isti krem fon, yumşaq qrafit;
  AI üçün ayrı ton. **Tam ağ və tam qara istifadə edilmir.**
- Animasiyalar yalnız `transform`/`opacity` üzərindədir (GPU dostu): scroll reveal,
  bubble açılışı, üzən fon dairələri, kart/düymə hover, karusel keçidləri.
- `prefers-reduced-motion` hörmətlə qarşılanır; animasiyalı elementlərin sayı məhduddur.

### Universitet karuseli və şəkillər
- Landing-də 10 universitet kart formatında göstərilir; 4.5 saniyədən bir yumşaq keçidlə dəyişir.
- Növbəti/əvvəlki düymələri, nöqtələr, irəliləyiş zolağı; hover/fokus zamanı dayanır.
- Hər kartda **tədris binasının real fotosu** və **rəsmi loqo** (şəkil üzərində nişan kimi) göstərilir.
- Şəkillər **Vikimedia Commons / Wikipedia**-dan götürülüb; yalnız sərbəst lisenziyalı fayllar
  (CC0, Public domain, CC BY, CC BY-SA) istifadə edilib. Mənbə və müəllif məlumatları:
  **[CREDITS.md](CREDITS.md)**.
- Fayllar: `wwwroot/assets/universities/<slug>-building.<ext>` və `<slug>-logo.<ext>`
  → manifest `wwwroot/assets/universities.js` (avtomatik yaradılır, frontend onu oxuyur).
- **Əhatə:** 9/10 universitetdə bina fotosu, 7/10-da rəsmi loqo.
  - Rəsmi loqolar sərbəst lisenziya ilə mövcud olmadığı üçün **ADNSU, MAA, Xəzər** kartlarında
    loqo yerinə qısaltma nişanı göstərilir.
  - **BDU** üçün müasir loqo əvəzinə universitetin **1919-cu il gerbi** (Public domain) istifadə edilib.
  - **AzTU** üçün Commons-da bina fotosu olmadığından kartda loqo göstərilir.
- Şəkilləri yeniləmək üçün: yeni faylı `assets/universities/` qovluğuna qoyub `assets/universities.js`
  faylındaki `building` / `logo` yolunu dəyişmək kifayətdir.

## API

| Metod | Yol | Auth | Sorğu | Cavab |
|---|---|---|---|---|
| POST | `/api/auth/register` | — | `{firstName, lastName, username, email, password, age, university, faculty, specialty, courseYear, groupName}` | `200 {token, expiresAt, user}` · `400` · `409` |
| POST | `/api/auth/login` | — | `{username, password}` | `200` · `401` |
| GET | `/api/auth/me` | JWT | — | `200 user` |
| **PUT** | **`/api/auth/profile`** | JWT | `{firstName, lastName, username}` | `200 user` · `400` (14 gün limiti / validasiya) · `409` |
| **POST** | **`/api/auth/logout`** | JWT | — | `204` (server tərəfində token dərhal ləğv olunur) |
| **POST** | **`/api/auth/avatar`** | JWT | `multipart/form-data` (`file`) | `200 user` · `400` (format / ölçü) · `413` |
| **DELETE** | **`/api/auth/avatar`** | JWT | — | `200 user` (profil şəkli silinir) |
| GET | `/api/users/{username}` | — | — | `200` açıq profil (email/yaş yoxdur, `avatarUrl` var) |
| GET | `/api/users/search?q=` | JWT | — | `200 [{username, fullName, university, courseYear, isAi}]` |
| GET | `/api/users/ai` | JWT | — | `200` AI hesabları |
| GET | `/api/posts?take=` | JWT | — | `200 [{id, content, createdAt, authorUsername, authorName, authorIsAi}]` |
| POST | `/api/posts` | JWT | `{content}` | `200 post` |
| GET | `/api/posts/user/{username}` | JWT | — | `200 [...]` |
| POST | `/api/messages` | — | `{username, content}` | `200` — anonim |
| GET | `/api/messages/{username}` | JWT | — | `200 [...]` — yalnız öz qutusu |
| POST | `/api/dm` | JWT | `{username, content}` | `200` (AI-dırsa cavab da yaradılır) |
| GET | `/api/dm/conversations` | JWT | — | `200 [{..., partnerIsAi}]` |
| GET | `/api/dm/{username}` | JWT | — | `200 [...]` |

- `courseYear`: **1-4** = bakalavr, **5** = Magistr. `age`: **14-100**. `faculty`: boş ola bilər.
- Parollar `PBKDF2-HMAC-SHA256` (210 000 iterasiya) ilə hash olunur.

## Başlatma

```bash
cd NglApi
dotnet restore
dotnet run            # http://localhost:5000 → landingpage.html
```

Baza, demo hesabı və AI hesabları avtomatik yaradılır.
Köhnə bazanız varsa bir dəfə silin: `del ngl.db ngl.db-shm ngl.db-wal`

## Konfiqurasiya (`appsettings.json`)

| Açar | İzah |
|---|---|
| `Jwt:Key` | İstehsalda `Jwt__Key` env dəyişəni ilə dəyişdirin (ən azı 32 simvol) |
| `Cors:AllowedOrigins` | İcazəli frontend domenləri (vergüllə) |
| `Demo:SeedAccount` | Demo hesabı yaradılsın? İstehsalda `false` |
| `Ai:SeedAccounts` / `Ai:Count` | AI hesabları və onların sayı (0-10) |

## Təhlükəsizlik qeydləri

- `Jwt:Key` istehsalda mütləq dəyişdirilməlidir.
- CORS yalnız `Cors:AllowedOrigins` siyahısındakı domenlərə icazə verir (`AllowAnyOrigin` yoxdur).
- `Demo:SeedAccount` və `Ai:SeedAccounts` istehsalda `false` olmalıdır.
- Açıq profildə email və yaş göstərilmir; anonim mesajlarda göndərənin IP-si heç vaxt qaytarılmır.
- `legal.html` mətnləri **şablondur**; footer sosial linkləri **placeholder**-dir.

Deploy üçün: [DEPLOYMENT.md](DEPLOYMENT.md)
