require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express  = require('express');
const cors     = require('cors');
const http     = require('http');
const { WebSocketServer } = require('ws');
const cron     = require('node-cron');
const connectDB = require('./database/db');
const { refreshAllPredictions } = require('./services/mlPredictor'); // Python-primary, JS-fallback
const { seedIncidentsIfEmpty, injectRandomIncident } = require('./services/incidentSeeder');
// alertSeeder disabled — alerts come from real APIs (GBIF, GFW, NASA FIRMS) only
const { pollAndBroadcastLiveAlerts } = require('./services/realTimeAlertService');

/* ── Routes ── */
const authRouter      = require('./routes/auth');
const googleAuthRouter= require('./routes/googleAuth');
const alertsRouter    = require('./routes/alerts');
const analysisRouter  = require('./routes/analysis');
const adminRouter     = require('./routes/admin');
const reportsRouter   = require('./routes/reports');
const incidentsRouter = require('./routes/incidents');
const realDataRouter  = require('./routes/realData');
const mlRouter        = require('./routes/ml');
const locationsRouter = require('./routes/locations');
const testimonialsRouter = require('./routes/testimonials');

const app    = express();
const server = http.createServer(app);
const PORT   = process.env.PORT || 4000;

/* ════════════════════════════════════
   MIDDLEWARE
════════════════════════════════════ */
app.use(cors({
  origin: process.env.FRONTEND_URL || true, // Set FRONTEND_URL on Render for production
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* ════════════════════════════════════
   WEBSOCKET SERVER
════════════════════════════════════ */
const wss     = new WebSocketServer({ server });
const clients = new Set();

wss.on('connection', ws => {
  clients.add(ws);
  console.log(`[WS] Client connected. Total: ${clients.size}`);
  ws.send(JSON.stringify({ event: 'connected', data: { message: 'BioGuard real-time feed active', clients: clients.size } }));
  ws.on('close',  () => { clients.delete(ws); });
  ws.on('error', err => console.error('[WS]', err.message));
});

function broadcast(payload) {
  const msg = JSON.stringify(payload);
  clients.forEach(c => { if (c.readyState === 1) c.send(msg); });
}

/* Inject broadcast to routes */
alertsRouter.setBroadcast(broadcast);
reportsRouter.setBroadcast(broadcast);

/* ════════════════════════════════════
   ROUTES
════════════════════════════════════ */
app.use('/api/auth',      authRouter);
app.use('/api/auth',      googleAuthRouter);   // POST /api/auth/google
app.use('/api/alerts',    alertsRouter);
app.use('/api/analysis',  analysisRouter);
app.use('/api/reports',   reportsRouter);     // ← community reports
app.use('/api/incidents', incidentsRouter);   // ← conflict incidents
app.use('/api/real-data', realDataRouter);
app.use('/api/ml',        mlRouter);          // ← Python RF ML predictions
app.use('/api/admin',     adminRouter);       // ← admin-only
app.use('/api/locations', locationsRouter);   // ← location suggestions + states
app.use('/api/testimonials', testimonialsRouter); // ← user reviews

/* Health check */
app.get('/api/health', (req, res) => res.json({
  status: 'ok', service: 'BioGuard Backend v2',
  roles:  ['user', 'asha_worker', 'admin'],
  timestamp: new Date().toISOString(),
  ws_clients: clients.size,
}));

// No synthetic live event broadcasts — all real-time data comes from GBIF / GFW / NASA FIRMS
// via the 15-minute cron job below.


/* ════════════════════════════════════
   CRON — Real-time alert polling every 15 min
════════════════════════════════════ */
cron.schedule('*/15 * * * *', async () => {
  console.log('[CRON] Real-time alert poll starting...');
  await pollAndBroadcastLiveAlerts(broadcast);
  // Also refresh ML predictions after each live poll (data may have changed)
  await refreshAllPredictions();
  broadcast({ event: 'predictions_updated', data: { reason: 'realtime_poll', timestamp: new Date().toISOString() }});
});

/* ════════════════════════════════════
   CRON — ML refresh every 6h
════════════════════════════════════ */
cron.schedule('0 */6 * * *', async () => {
  console.log('[CRON] Refreshing ML predictions (Python primary, JS fallback)...');
  await refreshAllPredictions();
  broadcast({ event: 'predictions_updated', data: { timestamp: new Date().toISOString() }});
});

/* ════════════════════════════════════
   SEED first admin account
════════════════════════════════════ */
async function seedAdmin() {
  const User = require('./models/User');

  /* ── Default demo admin ── */
  const exists = await User.findOne({ role: 'admin' });
  if (!exists) {
    await User.create({
      name:     'BioGuard Admin',
      email:    'admin@bioguard.in',
      password: 'Admin@1234',
      role:     'admin',
      state:    'Assam',
    });
    console.log('[SEED] Admin account created — admin@bioguard.in / Admin@1234');
    const workerExists = await User.findOne({ role: 'asha_worker' });
    if (!workerExists) {
      await User.create({
        name:     'Priya Ranger',
        email:    'ranger@bioguard.in',
        password: 'Ranger@1234',
        role:     'asha_worker',
        state:    'Assam',
      });
      console.log('[SEED] Asha Worker account created — ranger@bioguard.in / Ranger@1234');
    }
  }

  /* ── Promote nitinghildiyal2007@gmail.com to admin ── */
  const OWNER_EMAIL = 'nitinghildiyal2007@gmail.com';
  const owner = await User.findOne({ email: OWNER_EMAIL });
  if (owner && owner.role !== 'admin') {
    owner.role = 'admin';
    await owner.save({ validateBeforeSave: false });
    console.log(`[SEED] Promoted ${OWNER_EMAIL} → admin (inherits all NGO worker permissions)`);
  } else if (!owner) {
    // Pre-create so Google sign-in gets admin on first login
    await User.create({
      name:     'Nitin Ghildiyal',
      email:    OWNER_EMAIL,
      password: require('crypto').randomBytes(32).toString('hex'), // login via Google
      role:     'admin',
      state:    'Uttarakhand',
      joinedVia:'google',
    });
    console.log(`[SEED] Pre-created admin account for ${OWNER_EMAIL}`);
  }
}

/* ════════════════════════════════════
   START
════════════════════════════════════ */
connectDB().then(async () => {
  // ── Run seeds (non-fatal — one failure won't crash boot) ──
  try { await seedAdmin(); } catch (e) { console.error('[SEED] seedAdmin failed:', e.message); }
  try { await seedIncidentsIfEmpty(); } catch (e) { console.error('[SEED] seedIncidents failed:', e.message); }
  // ── Clean old seeded/fake system alerts from DB (one-time on startup) ──
  try {
    const Alert = require('./models/Alert');
    // Delete all 'system' source alerts seeded before today (the fake hardcoded ones)
    // Real API alerts will be re-inserted by the upcoming pollAndBroadcastLiveAlerts call
    const deleted = await Alert.deleteMany({
      source: 'system',
      // Keep any system alerts created in the last 2 hours (could be real RT alerts from last run)
      createdAt: { $lt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    });
    if (deleted.deletedCount > 0) {
      console.log(`[STARTUP] Cleared ${deleted.deletedCount} old seeded/fake system alerts. Real data will repopulate.`);
    } else {
      console.log('[STARTUP] No old seeded alerts to clear.');
    }
  } catch (e) { console.error('[STARTUP] Alert cleanup failed (non-fatal):', e.message); }

  // ── ML refresh: run in background, never block startup ──
  // Python ML is not available on Render (Node-only) — JS fallback runs automatically
  refreshAllPredictions().catch(e => console.warn('[ML] Initial refresh failed (non-fatal):', e.message));

  // ── Initial real-time alert poll (1 min after startup to avoid flood) ──
  const runPoll = () => {
    pollAndBroadcastLiveAlerts(broadcast)
      .then(r => console.log(`[RT-Alerts] Poll complete: ${r.broadcastCount} alerts.`))
      .catch(e => console.warn('[RT-Alerts] Poll failed (non-fatal):', e.message));
  };
  setTimeout(() => {
    runPoll();
    // ── Continuous real-time alert poll every 2 minutes ──
    setInterval(runPoll, 2 * 60 * 1000);
  }, 60 * 1000);

  // Inject a live synthetic incident every 2 minutes for demo purposes
  setInterval(() => {
    injectRandomIncident().then(() => {
      broadcast({ event: 'new_incident', data: { timestamp: new Date().toISOString() }});
    }).catch(() => {});
  }, 2 * 60 * 1000);

  server.listen(PORT, () => {
    console.log(`
  ╔════════════════════════════════════════╗
  ║  🌿 BioGuard Backend v2 — Port ${PORT}   ║
  ║  REST:      http://localhost:${PORT}/api  ║
  ║  WebSocket: ws://localhost:${PORT}        ║
  ║  Roles: user | asha_worker | admin      ║
  ╚════════════════════════════════════════╝
  Demo accounts (seeded on first run):
    admin@bioguard.in   / Admin@1234  (admin)
    ranger@bioguard.in  / Ranger@1234 (asha_worker)
    `);
  });
});
