const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const config = require('./config');
const db = require('./db');
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');
const publicApiRoutes = require('./routes/api/publicApi');
const adminApiRoutes = require('./routes/api/adminApi');
const {
  formatEventDate, formatShortDate, formatDateTime, formatTime,
  formatEventDateGu, formatShortDateGu, formatDateTimeGu, formatTimeGu,
  formatEventDateISO, formatEventTimeGu,
} = require('./utils/datetime');

const app = express();
app.get('/healthz', function(req, res) {
  res.status(200).send('OK');
});
// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Make IST-aware date/time formatters available in every EJS template
// (e.g. <%= formatDateTime(person.checked_in_at) %>) without each route
// having to pass them through res.render() individually.
app.locals.formatEventDate = formatEventDate;
app.locals.formatShortDate = formatShortDate;
app.locals.formatDateTime = formatDateTime;
app.locals.formatTime = formatTime;
app.locals.formatEventDateGu = formatEventDateGu;
app.locals.formatShortDateGu = formatShortDateGu;
app.locals.formatDateTimeGu = formatDateTimeGu;
app.locals.formatTimeGu = formatTimeGu;
app.locals.formatEventDateISO = formatEventDateISO;
app.locals.formatEventTimeGu = formatEventTimeGu;

// Body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static files (css, client-side assets - photos & QR codes are now served
// dynamically from the database via routes, not from this static folder)
app.use(express.static(path.join(__dirname, 'public')));

// Built React app (client/ -> public-react/), served alongside the existing
// public/ assets above without colliding with any of its filenames.
const REACT_BUILD_DIR = path.join(__dirname, 'public-react');
const reactBuildExists = fs.existsSync(path.join(REACT_BUILD_DIR, 'index.html'));
if (reactBuildExists) {
  app.use(express.static(REACT_BUILD_DIR));
}

// Sessions (used for admin login only)
app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 8, // 8 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
  })
);

// Trust the first proxy (required on Render/Heroku for secure cookies & correct IP)
app.set('trust proxy', 1);

// New JSON API (used by the React frontend) — mounted before the legacy
// EJS-rendering routers so these take priority for their own paths.
app.use('/api/admin', adminApiRoutes);
app.use('/api', publicApiRoutes);

// Legacy routes (still fully functional — see routes/public.js and
// routes/admin.js for exactly which page-render handlers have been removed
// now that the React app owns those URLs)
app.use('/', publicRoutes);
app.use('/admin', adminRoutes);

// SPA fallback — any remaining GET request that isn't an API call or a
// legacy route falls through to the React app's own router (e.g. a
// client-side-only path like /admin/settings that has no Express route).
if (reactBuildExists) {
  app.get('*', (req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(REACT_BUILD_DIR, 'index.html'));
  });
}

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { message: 'Page not found.' });
});

// Generic error handler (catches errors passed via next(err) from async routes)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).render('404', { message: 'Something went wrong. Please try again.' });
});

async function start() {
  try {
    await db.init();
  } catch (err) {
    console.error('Failed to connect to the database. Check DATABASE_URL in your .env file.');
    console.error(err);
    process.exit(1);
  }

  app.listen(config.port, () => {
    console.log('==================================================');
    console.log(`  QR Registration App running!`);
    console.log(`  Local:      http://localhost:${config.port}`);
    console.log(`  Register:   http://localhost:${config.port}/register`);
    console.log(`  Admin:      http://localhost:${config.port}/admin/login`);
    console.log('==================================================');
  });
}

start();
