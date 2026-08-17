# Peshraft Library — Backend

Firebase-backed REST API for Peshraft Library — a library/membership management system (books, borrowing, members, notifications).

Companion to the [peshraft-mobile](https://github.com/BahromPython/peshraft-mobile) app.

## Stack

Node.js + Express, Firebase Admin SDK (Firestore), JWT auth, bcrypt.

## Structure

```
index.js                     App entry, route mounting
seed.js                       Database seed script
src/
  db.js                        Firebase Admin init
  middleware/auth.js            JWT auth middleware
  routes/
    auth.js                      Register / login
    books.js                     Book catalog
    borrowing.js                 Borrow/return flow
    dashboard.js                  Admin dashboard endpoints
    members.js                    Member management
    notificationsAndProfile.js    Notifications + profile
```

## Getting started

```bash
npm install
```

Set `GOOGLE_CREDENTIALS` (the Firebase service account JSON, as a single-line string) and `PORT` in your environment — never commit a `.env` file or the raw service account JSON.

```bash
npm run dev     # nodemon
npm start       # production
```

Health check: `GET /health`

## License

All rights reserved. Built and maintained by [Bahrom Ashurov](https://instagram.com/_.bahrrrom._).
