# Facultyware

A Node.js/Express application for managing equipment loans and manager dashboards. The app uses EJS for views, MySQL for persistence, and session storage backed by `express-mysql-session`.

## Features

- User login/logout flow
- Equipment loan tracking and management
- Manager dashboard for ongoing and historical loans
- CSV and PDF export features
- API endpoints for manager statistics and loan tracking

## Prerequisites

- Node.js 18+ installed
- MySQL server accessible
- `npm` available

## Installation

```bash
npm install
```

## Environment

Create a `.env` file in the project root with the following values:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=facultyware
SESSION_SECRET=your_secret_key
```

## Run the app

Start the server:

```bash
npm start
```

During development, use:

```bash
npm run dev
```

The app entrypoint is `bin/www`, and Express is configured in `app.js`.

## Test

Run the unit test suite:

```bash
npm test
```

## Project structure

- `app.js` - Express application setup
- `bin/www` - server startup script
- `controllers/` - route handler logic
- `routes/` - Express routers
- `middlewares/` - auth, error, and ACL middleware
- `views/` - EJS templates
- `public/` - static assets
- `lib/db.js` - database helper
- `test/` - unit tests
- `tests/e2e/` - end-to-end test specs

## Available routes

### Web routes

- `/` - landing page
- `/login` - login page
- `/logout` - logout
- `/users` - user listing
- `/equipment-loans/...` - equipment loan pages
- `/manager/...` - manager dashboard pages

### API routes

- `GET /api/manager/loans/total`
- `GET /api/manager/loans/requested`
- `GET /api/manager/loans/unreturned`
- `GET /api/equipment-loans/track/:id`

All API routes require authentication.

## Notes

- Sessions are stored in MySQL using `express-mysql-session`.
- The app expects the database and session tables to be available.
- Adjust the `.env` values to match your local or hosted database configuration.
