# 📚 Empire Ebook

> Plateforme de vente et distribution d'ebooks premium avec animations neural network

![Empire Ebook](https://img.shields.io/badge/React-18-61dafb?logo=react)
![Laravel](https://img.shields.io/badge/Laravel-13-ff2d20?logo=laravel)
![PHP](https://img.shields.io/badge/PHP-8.3-777bb4?logo=php)
![Stripe](https://img.shields.io/badge/Stripe-Payments-635bff?logo=stripe)

## ✨ Fonctionnalités

- 🎨 **Background animé** — Réseau neural avec particules cyan/violet (type Empire du Web)
- 📖 **Lecteur PDF 5 minutes** — Aperçu gratuit avec minuteur + protection screenshot
- 💳 **Paiement Stripe** — Intégration complète avec livraison email + licence
- 🎁 **Livres gratuits** — Téléchargement via email
- 📊 **Admin Dashboard** — Stats, charts, gestion, téléchargements, achats
- 📩 **Emails HTML** — Templates premium pour achats et téléchargements

## 🏗️ Architecture

```
empire-ebook/              ← React Frontend (Vite)
empire-ebook-api/          ← Laravel 13 Backend (PHP 8.3)
```

## 🚀 Démarrage rapide

### Backend Laravel

```bash
cd C:\xampp\htdocs\empire-ebook-api

# Configurer .env
# Ajouter vos clés Stripe et SMTP

# Démarrer
C:\xampp\htdocs\php-8.3.30-Win32-vs16-x64\php.exe artisan serve
# → http://localhost:8000
```

### Frontend React

```bash
cd "empire-ebook"

# Configurer .env
# VITE_STRIPE_PUBLIC_KEY=pk_test_...

npm install
npm run dev
# → http://localhost:5173
```

## 🔐 Admin

- URL: http://localhost:5173/admin
- Login: `admin`
- Mot de passe: `empire2025`

## ⚙️ Configuration

### .env React
```env
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

### .env Laravel
```env
STRIPE_KEY=pk_test_...
STRIPE_SECRET=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=votre@gmail.com
MAIL_PASSWORD=votre_mot_de_passe_app
```

## 📂 Structure React

```
src/
├── components/
│   ├── Background/ParticleBackground.jsx  ← Animation neural réseau
│   ├── Books/BookCard.jsx                 ← Carte livre glassmorphism
│   ├── Reader/PDFReader.jsx               ← Lecteur 5min + watermark
│   └── Modals/                            ← Email, Paiement, Succès
└── pages/
    ├── HomePage.jsx                       ← Boutique principale
    └── AdminPage.jsx                      ← Dashboard admin complet
```

## 📂 Structure Laravel

```
app/Http/Controllers/
├── BookController.php    ← CRUD + preview + paiement + webhook
└── AdminController.php   ← Stats + upload + gestion

routes/api.php            ← Toutes les routes API
database/migrations/      ← books, downloads, purchases, admins
```
