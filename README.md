# Each One Teach One (EOTO) - Public Website & Admin System

A responsive, high-performance, single-page website for **Each One Teach One (EOTO)** to showcase college student cases requiring financial assistance in Kerala. 

Hosted on **Cloudflare Pages** and powered by **Google Apps Script + Google Sheets** as a free serverless backend.

---

## 🚀 Key Features

- **Dynamic Case Showcase**: Interactive table and mobile-friendly view with search & status filters (`All`, `Open`, `In Progress`, `Sponsored`).
- **Direct WhatsApp Sponsorship Action**: Pre-filled WhatsApp message link for every open case (`https://wa.me/...`).
- **100% Direct Google Sheet Integration**: Updates made in Google Sheets instantly reflect on the website.
- **Admin Portal**: Embedded PIN-protected portal (`eoto2026`) allowing team members to submit new cases directly to the Google Sheet.
- **Zero Cost Architecture**: Hosted free forever on **Cloudflare Pages** with unlimited bandwidth and zero server maintenance.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, Vanilla JavaScript (ES6+), Custom CSS Design System with Google Fonts (`Outfit` & `Plus Jakarta Sans`).
- **Backend API**: Google Apps Script Web App (JS/V8 API engine inside Google Drive).
- **Database**: Google Sheet (`Cases` tab).
- **Hosting**: Cloudflare Pages (`eoto.pages.dev`).

---

## 📊 Google Sheet Setup Instructions

1. Open your Google Sheet in `eoto.kerala@gmail.com`:
   `https://docs.google.com/spreadsheets/d/1xzZLvBHTfH9vyw88hZzedW7m_IDCHGTayGu3JAd2EDM/edit#gid=334340971`
2. Ensure the tab is named **`Cases`**.
3. Create the following Column Headers in **Row 1**:
   - Column A (`A1`): `Case ID`
   - Column B (`B1`): `Course`
   - Column C (`C1`): `Institution`
   - Column D (`D1`): `District`
   - Column E (`E1`): `Amount`
   - Column F (`F1`): `Status`
   - Column G (`G1`): `Description`
   - Column H (`H1`): `Date Added`

---

## ⚙️ Google Apps Script Backend Setup

1. Go to [https://script.google.com/](https://script.google.com/) signed in as **`eoto.kerala@gmail.com`**.
2. Click **New Project** and name it **`EOTO Web API`**.
3. Replace all content in `Code.gs` with the code in [`google-apps-script.js`](google-apps-script.js).
4. Click **Save** 💾.
5. Click **Deploy** > **New deployment**:
   - Select type: **Web app**
   - Description: `EOTO API v1`
   - Execute as: **Me (`eoto.kerala@gmail.com`)**
   - Who has access: **Anyone**
6. Click **Deploy** and authorize the permissions.
7. Copy the generated **Web App URL** (starts with `https://script.google.com/macros/s/.../exec`).
8. Open [`app.js`](app.js) in this project and paste the URL into `const APPS_SCRIPT_URL = "YOUR_URL_HERE";`.

---

## 🌐 Cloudflare Pages Deployment Guide

### Option 1: Automatic Deployment via GitHub (Recommended)
1. Push this project folder to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial EOTO website commit"
   git remote add origin https://github.com/YOUR_USERNAME/eoto-website.git
   git push -u origin main
   ```
2. Go to the [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Select your `eoto-website` repository.
4. Set **Build command**: (leave blank, static HTML)
5. Set **Build output directory**: `/` (root directory).
6. Click **Save and Deploy**. Your site will be live at `https://eoto.pages.dev`!

### Option 2: Direct Upload via Cloudflare Dashboard
1. Go to Cloudflare Dashboard > **Workers & Pages** > **Create application** > **Pages** > **Upload assets**.
2. Drag and drop this `eoto` folder directly.
3. Click **Deploy site**.

---

## 🔐 Security & Maintenance

- Default Admin PIN: `eoto2026` (Can be updated in `google-apps-script.js` and `app.js`).
- Google Sheet remains securely inside `eoto.kerala@gmail.com` without needing public edit access.
