# Hive — Deployment & Cloud Architecture Guide

Bu sənəd Hive layihəsinin **GitHub**, **Vercel** (Frontend), **Render** (Backend Docker) və **Supabase** (PostgreSQL) üzərində tam quraşdırılması və deploy edilməsi təlimatıdır.

---

## 1. GitHub Repository Hazırlığı və Push

Layihədə bütün konfiqurasiya faylları (`vercel.json`, `Dockerfile`, `render.yaml`) artıq hazırdır.

```bash
git add .
git commit -m "feat: complete Hive overhaul with Abituriyent, wallet checkout, collapsible sidebar, multi-cloud deploy"
git branch -M main
git remote add origin https://github.com/<your-username>/hive.git
git push -u origin main
```

---

## 2. Vercel Deploy (Frontend)

Vercel vasitəsilə statik frontend-i pulsuz və ultra-sürətli CDN üzərində yayımlamaq:

1. [Vercel](https://vercel.com) saytına daxil olun və **Add New... -> Project** seçin.
2. GitHub-dakı **hive** reposunu import edin.
3. **Root Directory**:
   - Əgər repo kökündən deploy edirsinizsə: `Root Directory` olduğu kimi (`./`) saxlayın (köşkdəki `vercel.json` avtomatik olaraq `NglApi/wwwroot` səhifələrini yönləndirir).
   - Və ya `Root Directory` olaraq `NglApi/wwwroot` seçin (`NglApi/wwwroot/vercel.json` daxili yönləndirmə edəcək).
4. **Environment Variables**:
   - `HIVE_API_BASE`: `https://hive-api.onrender.com/api` (Render-dəki backend ünvanınız)
5. **Deploy** düyməsini sıxın. Saytınız `https://<layihe-adi>.vercel.app` ünvanında canlı olacaq.

---

## 3. Render Deploy (ASP.NET Core 8 Backend)

Render platformasında tətbiqi Docker container kimi deploy etmək:

1. [Render Dashboard](https://dashboard.render.com) daxil olun.
2. **New +** -> **Web Service** seçin.
3. GitHub-dakı **hive** reposunu seçin.
4. Parametrlər:
   - **Name**: `hive-api`
   - **Region**: Frankfurt (EU Central) və ya ən yaxın region
   - **Branch**: `main`
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `./Dockerfile` (və ya `./NglApi/Dockerfile` əgər Root Directory `NglApi` seçilsə)
   - **Instance Type**: `Free`
5. **Environment Variables** (Əlavə edin):
   - `ASPNETCORE_ENVIRONMENT`: `Production`
   - `ASPNETCORE_HTTP_PORTS`: `8080`
   - `Jwt__Key`: Ən azı 32 simvolluq gizli açar (məsələn: `7b36f1c4e892d41a5b882903e1a8cf29b40e7912a83cfd58a1`)
   - `Jwt__Issuer`: `HiveApi`
   - `Jwt__Audience`: `HiveClient`
   - `Cors__AllowedOrigins`: `https://<sizin-vercel-domeniniz>.vercel.app,http://localhost:3000,http://localhost:5000`
   - `ConnectionStrings__Postgres`: *(Aşağıdakı Supabase bölməsindən əldə etdiyiniz URI)*
6. **Health Check Path**: `/healthz`
7. **Create Web Service** düyməsini sıxın.

---

## 4. Supabase (Managed PostgreSQL) Qurulması

Supabase layihədə bütün tələbə və abituriyent məlumatlarını, anonim mesajları, coin balanslarını və tranzaksiya tarixçəsini saxlayır:

1. [Supabase](https://supabase.com) saytına daxil olun və **New Project** yaradın.
   - Layihə adı: `hive-db`
   - Verilənlər bazası parolu (Database Password) təyin edin və yadda saxlayın.
   - Region: Frankfurt (EU Central)
2. **Project Settings -> Database** bölməsinə keçin:
   - **Connection string** tabını açın.
   - **URI** və ya **Connection pooling** seçin (Transaction və ya Session rejimində port 5432 və ya 6543).
   - Nümunə format:
     `postgres://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`
     və ya standart ADO.NET formatı:
     `Host=aws-0-eu-central-1.pooler.supabase.com;Port=6543;Database=postgres;Username=postgres.[PROJECT-REF];Password=[YOUR-PASSWORD];SSL Mode=Require;Trust Server Certificate=true;`
3. Bu dəyəri Render mühitində `ConnectionStrings__Postgres` dəyişəninə yapışdırın.
4. **Avtomatik Miqrasiya**:
   - Backend `Npgsql` dəstəyi ilə təchiz olunub.
   - PostgreSQL bağlantısı təyin edildikdə, ASP.NET Core serveri işə düşərkən `db.Database.EnsureCreated()` vasitəsilə bütün cədvəlləri (`Users`, `AnonymousMessages`, `DirectMessages`, `Transactions`, `StoreHints`) birbaşa Supabase PostgreSQL-də avtomatik yaradır və demo hesabları daxil edir.

---

## 5. Canlı Test və Yoxlama

- **Health Check**: `https://<render-app>.onrender.com/healthz` -> `{"status":"healthy","service":"Hive API"}`
- **Frontend**: `https://<vercel-app>.vercel.app`
- **Tam axın**:
  1. Abituriyent və ya Universitet tələbəsi kimi qeydiyyatdan keçin.
  2. Profil linkini (`profile.html?u=...`) paylaşın.
  3. Anonim mesaj göndərin.
  4. Sol menyudan Mağaza / Balans bölməsinə keçib kartla coin paketi alın.
  5. Tranzaksiya qəbzini və balans yenilənməsini yoxlayın.
