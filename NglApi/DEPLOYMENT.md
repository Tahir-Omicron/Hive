# Hive — Deploy təlimatı (GitHub → Render + Vercel)

## Fayllar

```
NglApi/
├── Dockerfile        # backend konteyneri
├── .dockerignore
├── .gitignore
└── wwwroot/          # frontend (landingpage.html giriş nöqtəsidir)
```

---

## 1. GitHub-a yükləmə

`NglApi` qovluğu repo-nun kökü olacaq:

```bash
cd NglApi
git init
git add .
git commit -m "Hive: .NET 8 backend + çoxdilli frontend"
git branch -M main
git remote add origin https://github.com/USERNAME/hive.git
git push -u origin main
```

`git status --short` yoxlayın — `ngl.db` və `bin/` görünməməlidir.

---

## 2. Backend → Render

1. [dashboard.render.com](https://dashboard.render.com/) → **New** → **Web Service**
2. GitHub repo-nu seç.
3. Ayarlar:

   | Sahə | Dəyər |
   |---|---|
   | Language | **Docker** |
   | Dockerfile Path | `./Dockerfile` |
   | Root Directory | boş (repo kökü = `NglApi`) |
   | Instance Type | **Free** |

4. **Environment variables**:

   | Açar | Dəyər |
   |---|---|
   | `Jwt__Key` | ən azı 32 simvolluq təsadüfi açar (**mütləq dəyişin**) |
   | `Cors__AllowedOrigins` | `https://senin-frontend.vercel.app` |
   | `Demo__SeedAccount` | istehsalda `false` |
   | `ConnectionStrings__Default` | yalnız disk bağladıqdan sonra: `Data Source=/data/ngl.db` |

5. **Create Web Service** → build ~2-5 dəqiqə.
6. Yoxlama: `https://hive-xxxx.onrender.com/api/auth/me` → `401` (server işləyir).

> Render portu `PORT` dəyişəni ilə verir, Dockerfile onu oxuyur
> (`--urls http://0.0.0.0:${PORT:-8080}`).

---

## 3. Frontend → Vercel

1. [vercel.com/new](https://vercel.com/new) → eyni repo-nu import et.
2. Ayarlar:

   | Sahə | Dəyər |
   |---|---|
   | Framework Preset | **Other** |
   | Root Directory | `wwwroot` |
   | Build Command | boş |
   | Output Directory | boş |

3. **Deploy** → `https://hive-xxxx.vercel.app`

---

## 4. Backend URL-ni frontend-də göstərmək

Frontend ayrı domendədirsə `api.js` backend-i tapa bilmir. Hər HTML səhifəsində
(`landingpage.html`, `loginpage.html`, `registerpage.html`, `app.html`, `profile.html`)
`assets/api.js`-dən **əvvəl** aşağıdaki sətri əlavə edin:

```html
<script>window.HIVE_API_BASE = 'https://hive-xxxx.onrender.com/api';</script>
```

Sonra Vercel-də yenidən deploy edin (`git push` kifayətdir).

---

## 5. CORS

`Program.cs`-dəki placeholder-i öz Vercel domeninlə dəyiş, və ya env dəyişəni ilə ver:

```
Cors__AllowedOrigins = https://hive.vercel.app,https://hive-git-main-sen.vercel.app
```

`AllowAnyOrigin` istifadə olunmur — yalnız siyahıdakı domenlərə icazə verilir.

---

## 6. SQLite xəbərdarlığı (vacib)

SQLite fayl əsaslıdır və konteynerin lokal fayl sistemində saxlanılır. Pulsuz hostinqdə
bu fayl sistemi **ephemeral**-dır:

> "any changes to your web service's filesystem (uploaded images, **local SQLite
> databases**, etc.) are lost every time the service **redeploys, restarts, or spins
> down**" — [render.com/docs/free](https://render.com/docs/free)

Render-də pulsuz web servislər **persistent disk dəstəkləmir**; servis 15 dəqiqə trafik
olmadıqda söndürülür — [render.com/docs/disks](https://render.com/docs/disks).

**Nəticə:** pulsuz planda istifadəçi və mesajlar itir. Variantlar:

| Variant | Nə etmək |
|---|---|
| Ödənişli instansiya + disk | Disk → mount path `/data`, `ConnectionStrings__Default = Data Source=/data/ngl.db` |
| Railway volume | Volume bağla (Free planda 1 volume / 0.5 GB), eyni env dəyişəni |
| PostgreSQL (tövsiyə) | Npgsql paketi + `UseNpgsql(...)` |

---

## 7. Yekun yoxlama siyahısı

- [ ] `https://render-adin.onrender.com/api/auth/me` → `401`
- [ ] `POST /api/auth/register` → `200 {token, expiresAt, user}`
- [ ] Vercel ünvanı açılır və **landingpage.html** göstərilir
- [ ] Naviqasiya: Ana səhifə / Haqqımızda / Əlaqə — smooth scroll işləyir
- [ ] Dil seçimi (AZ/RU/TR/EN) və gündüz/gecə düyməsi işləyir
- [ ] **Sign Up** → qeydiyyat səhifəsi → hesab yaradılır → `app.html`-ə keçir
- [ ] **Sign In** → `tahirquliyev01` / `TahiR_2006!` → `app.html`
- [ ] `app.html`: Home (axın), Direct, Search, Profile bölmələri işləyir
- [ ] `profile.html?u=<username>` açılır, anonim mesaj göndərilir
- [ ] Brauzer konsolunda CORS xətası yoxdur
