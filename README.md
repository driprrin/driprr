# DRIPRR — Hyperlocal Streetwear Platform

## Prerequisites
- Node.js 18+
- npm

---

## 1. Start the Backend (NestJS API)

```bash
cd Backend
npm install
npm run start:dev
```
Runs at: **http://localhost:4000/api**

---

## 2. Start the Customer App (driprr.com)

```bash
cd driprr-next
npm install
npm run dev
```
Runs at: **http://localhost:3000**

---

## 3. Start the Store Dashboard (store.driprr.com)

```bash
cd store-dashboard
npm install
npm run dev
```
Runs at: **http://localhost:3001**

- Apply to sell: http://localhost:3001/apply

---

## 4. Start the Admin Panel (admin.driprr.com)

```bash
cd admin-dashboard
npm install
npm run dev
```
Runs at: **http://localhost:3002**

- Login: `adminpratham@driprr.com` / `Pratham@2000`

---

## 5. Start the Rider App (rider.driprr.com)

```bash
cd rider-app
npm install
npm run dev
```
Runs at: **http://localhost:3003**

- Apply as rider: http://localhost:3003/register

---

## Quick Start (run all at once)

Open 5 terminals and run each command above, OR use:

```powershell
# Terminal 1 — Backend
cd "f:\Driprr\My web\Backend"; npm run start:dev

# Terminal 2 — Customer
cd "f:\Driprr\My web\driprr-next"; npm run dev

# Terminal 3 — Store Dashboard
cd "f:\Driprr\My web\store-dashboard"; npm run dev

# Terminal 4 — Admin Panel
cd "f:\Driprr\My web\admin-dashboard"; npm run dev

# Terminal 5 — Rider App
cd "f:\Driprr\My web\rider-app"; npm run dev
```

---

## Environment Files

Each app has a `.env.local` file already configured. Do not commit these.

| App | File |
|---|---|
| Backend | `Backend/.env` |
| Customer | `driprr-next/.env.local` |
| Store Dashboard | `store-dashboard/.env.local` |
| Admin Panel | `admin-dashboard/.env.local` |
| Rider App | `rider-app/.env.local` |

---

## App Overview

| App | URL | Who Uses It |
|---|---|---|
| Customer App | localhost:3000 | Customers browse & buy |
| Store Dashboard | localhost:3001 | Store owners manage products & orders |
| Admin Panel | localhost:3002 | DRIPRR admins approve sellers & riders |
| Rider App | localhost:3003 | Delivery riders accept & track orders |
| Backend API | localhost:4000/api | All apps connect to this |
