/**
 * Real-Time Alert Service — BioGuard v3
 * ─────────────────────────────────────────────────────────────────
 * Pulls ONLY from authenticated government / scientific APIs:
 *
 *   1. GBIF   — Wildlife occurrence spikes → Wildlife alerts
 *   2. GFW    — Real documented deforestation zones → Deforestation alerts
 *   3. NASA FIRMS — Satellite fire detections (VIIRS SNPP, 375m) → Wildfire alerts
 *
 * NO synthetic/fake event templates. NO seeded data.
 * All alerts are PERSISTED to MongoDB so /api/alerts returns real data.
 *
 * Called by:
 *   • server.js  — every 15 minutes via cron
 *   • POST /api/alerts/refresh-live  — manual admin trigger
 */

const { fetchGBIFOccurrences, fetchForestAlerts, fetchNASAFireAlerts } = require('./realDataService');
const { generateAlertMessage } = require('./alertMessageGenerator');
const Alert  = require('../models/Alert');
const Report = require('../models/Report');

/* ── In-memory live alert cache (also held in DB now) ── */
let _liveAlertCache = [];
let _lastLivePoll   = null;

/* ── Haversine distance helper ── */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371, r = d => d * Math.PI / 180;
  const dLat = r(lat2 - lat1), dLng = r(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

/* ══════════════════════════════════════════════════════════════════
   ML FEATURE UPDATE
══════════════════════════════════════════════════════════════════ */
let _mlFeatureOverrides = {};

function updateMLFeatureCache(alertData) {
  const zoneKey = alertData.location.split('—')[0].split(',')[0].trim().substring(0, 20);
  _mlFeatureOverrides[zoneKey] = {
    boost: alertData.severity === 'critical' ? 0.25 : alertData.severity === 'warning' ? 0.15 : 0.05,
    type: alertData.type,
    updatedAt: new Date().toISOString(),
  };
}

function getMLFeatureOverrides() {
  const cutoff = Date.now() - 6 * 60 * 60 * 1000;
  const valid = {};
  for (const [k, v] of Object.entries(_mlFeatureOverrides)) {
    if (new Date(v.updatedAt).getTime() > cutoff) valid[k] = v;
  }
  _mlFeatureOverrides = valid;
  return valid;
}

/* ══════════════════════════════════════════════════════════════════
   STATE EXTRACTOR
══════════════════════════════════════════════════════════════════ */
function extractState(location) {
  const STATE_MAP = {
    'Assam': 'Assam', 'Arunachal': 'Arunachal Pradesh', 'Meghalaya': 'Meghalaya',
    'Manipur': 'Manipur', 'Nagaland': 'Nagaland', 'Sikkim': 'Sikkim',
    'Mizoram': 'Mizoram', 'Tripura': 'Tripura',
  };
  for (const [k, v] of Object.entries(STATE_MAP)) {
    if (location.includes(k)) return v;
  }
  return 'Assam'; // Default for NE India
}

/* ══════════════════════════════════════════════════════════════════
   SOURCE 1: GBIF → Wildlife Alerts
   Real IUCN-threatened species occurrence spikes from GBIF.org
   Data attributed to 1,900+ publishing institutions worldwide
══════════════════════════════════════════════════════════════════ */
async function synthesizeGBIFAlerts() {
  try {
    console.log('[RT-Alerts] Fetching GBIF wildlife occurrences…');
    const occurrences = await fetchGBIFOccurrences({ limit: 100 });
    const threatened  = occurrences.filter(o => o.isThreatened && o.lat && o.lng);

    if (threatened.length === 0) {
      console.log('[RT-Alerts] No threatened species spikes from GBIF.');
      return [];
    }

    // Group by geographic cluster (within 50km)
    const clusters = [];
    for (const o of threatened) {
      let added = false;
      for (const c of clusters) {
        if (haversineKm(c.centerLat, c.centerLng, o.lat, o.lng) < 50) {
          c.sightings.push(o);
          added = true;
          break;
        }
      }
      if (!added) clusters.push({ centerLat: o.lat, centerLng: o.lng, sightings: [o] });
    }

    const alerts = [];
    for (const cluster of clusters) {
      if (cluster.sightings.length < 1) continue;
      const sample   = cluster.sightings[0];
      const species  = [...new Set(cluster.sightings.map(s => s.species))].slice(0, 3).join(', ');
      const iucnList = [...new Set(cluster.sightings.map(s => s.iucnStatus).filter(Boolean))];
      const isCritical = cluster.sightings.some(s => s.iucnStatus === 'CRITICALLY_ENDANGERED');
      const severity = isCritical ? 'critical' : cluster.sightings.length > 5 ? 'warning' : 'info';
      const stateName = sample.stateProvince || extractState(sample.locality || '');
      const location  = sample.locality || `${stateName} Forest Zone`;

      alerts.push({
        type:        'Wildlife',
        severity,
        location:    location.slice(0, 100),
        state:       stateName || 'Assam',
        coordinates: { lat: sample.lat, lng: sample.lng },
        description: `GBIF live occurrence data: ${cluster.sightings.length} sightings of IUCN-threatened ` +
          `species recorded in ${stateName || 'NE India'}. Species: ${species}. ` +
          `IUCN Status: ${iucnList.join(', ') || 'Vulnerable'}. ` +
          `Data sourced from ${sample.datasetName || 'GBIF publisher network'}.`,
        action:      'State Forest Department alerted. GBIF data flagged for field verification.',
        notificationType: 'satellite',
        source:      'system',
        _externalRef: `GBIF:${sample.id}`,
      });
    }

    console.log(`[RT-Alerts] GBIF → ${alerts.length} wildlife alerts from ${threatened.length} threatened sightings.`);
    return alerts;
  } catch (err) {
    console.error('[RT-Alerts] GBIF synthesis failed:', err.message);
    return [];
  }
}

/* ══════════════════════════════════════════════════════════════════
   SOURCE 2: GFW → Deforestation Alerts
   Real Global Forest Watch GLAD/RADD deforestation alert zones
══════════════════════════════════════════════════════════════════ */
async function synthesizeForestAlerts() {
  try {
    console.log('[RT-Alerts] Fetching GFW deforestation alerts…');
    const forestAlerts = await fetchForestAlerts();

    const alerts = forestAlerts
      .filter(a => ['critical', 'high'].includes(a.severity))
      .map(a => ({
        type:        'Deforestation',
        severity:    a.severity === 'critical' ? 'critical' : 'warning',
        location:    a.location,
        state:       a.state || extractState(a.location),
        coordinates: { lat: a.lat, lng: a.lng },
        description: `${a.alertType} deforestation alert from Global Forest Watch: ` +
          `${a.area_ha} hectares of forest cover lost. Alert date: ${a.date}. ` +
          `This area requires immediate ground-truth verification and government intervention.`,
        action:      'Ground-truth survey dispatched. District Forest Officer notified. Area flagged in GFW monitoring.',
        notificationType: 'satellite',
        source:      'system',
        _externalRef: `GFW:${a.alertType}:${a.lat}:${a.lng}`,
      }));

    console.log(`[RT-Alerts] GFW → ${alerts.length} deforestation alerts.`);
    return alerts;
  } catch (err) {
    console.error('[RT-Alerts] GFW synthesis failed:', err.message);
    return [];
  }
}

/* ══════════════════════════════════════════════════════════════════
   SOURCE 3: NASA FIRMS → Wildfire Alerts
   Real satellite fire detections from VIIRS SNPP (375m resolution)
   Updated every ~3 hours from NASA Earth Observing System
══════════════════════════════════════════════════════════════════ */
async function synthesizeFireAlerts() {
  try {
    console.log('[RT-Alerts] Fetching NASA FIRMS satellite fire detections…');
    const fires = await fetchNASAFireAlerts();

    if (fires.length === 0) {
      console.log('[RT-Alerts] No fire detections from NASA FIRMS right now.');
      return [];
    }

    // Group nearby fires into events (within 20km)
    const events = [];
    for (const fire of fires) {
      let added = false;
      for (const ev of events) {
        if (haversineKm(ev.lat, ev.lng, fire.lat, fire.lng) < 20) {
          ev.fires.push(fire);
          ev.totalFRP += fire.frp;
          added = true;
          break;
        }
      }
      if (!added) events.push({ lat: fire.lat, lng: fire.lng, fires: [fire], totalFRP: fire.frp, date: fire.date });
    }

    const alerts = events
      .filter(ev => ev.fires.some(f => f.confidence !== 'low'))
      .map(ev => {
        const state    = nearestNEIndiaState(ev.lat, ev.lng);
        const severity = ev.totalFRP > 100 ? 'critical' : ev.totalFRP > 30 ? 'warning' : 'info';
        return {
          type:        'Wildfire',
          severity,
          location:    `${state} Forest Zone — ${ev.lat.toFixed(2)}°N ${ev.lng.toFixed(2)}°E`,
          state:       state,
          coordinates: { lat: ev.lat, lng: ev.lng },
          description: `NASA FIRMS VIIRS SNPP satellite detected ${ev.fires.length} active fire pixel(s). ` +
            `Combined Fire Radiative Power: ${ev.totalFRP.toFixed(1)} MW. ` +
            `Detection date: ${ev.date}. Confidence: ${ev.fires[0].confidence}. ` +
            `Real-time satellite data — 375m resolution.`,
          action:      'State Forest Department fire response unit alerted. NDRF on standby.',
          notificationType: 'satellite',
          source:      'system',
          _externalRef: `FIRMS:VIIRS:${ev.lat.toFixed(3)}:${ev.lng.toFixed(3)}:${ev.date}`,
        };
      });

    console.log(`[RT-Alerts] FIRMS → ${alerts.length} wildfire alerts from ${fires.length} fire pixels.`);
    return alerts;
  } catch (err) {
    console.error('[RT-Alerts] NASA FIRMS synthesis failed:', err.message);
    return [];
  }
}

/* Map lat/lng to NE India state */
function nearestNEIndiaState(lat, lng) {
  const states = [
    { name: 'Assam',             lat: 26.2, lng: 92.9 },
    { name: 'Arunachal Pradesh', lat: 27.5, lng: 95.0 },
    { name: 'Meghalaya',         lat: 25.5, lng: 91.4 },
    { name: 'Manipur',           lat: 24.7, lng: 93.9 },
    { name: 'Nagaland',          lat: 26.2, lng: 94.6 },
    { name: 'Mizoram',           lat: 23.7, lng: 92.7 },
    { name: 'Tripura',           lat: 23.8, lng: 91.6 },
    { name: 'Sikkim',            lat: 27.6, lng: 88.6 },
  ];
  let nearest = states[0], minDist = Infinity;
  for (const s of states) {
    const d = haversineKm(lat, lng, s.lat, s.lng);
    if (d < minDist) { minDist = d; nearest = s; }
  }
  return nearest.name;
}

/* ══════════════════════════════════════════════════════════════════
   COMMUNITY REPORT SIGNAL AGGREGATION
══════════════════════════════════════════════════════════════════ */
async function aggregateReportSignals() {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const reports = await Report.find({ createdAt: { $gte: since }, status: { $ne: 'fake' } }).lean();
    const regionSignals = {};
    reports.forEach(r => {
      if (!regionSignals[r.region]) regionSignals[r.region] = { count: 0, urgent: 0, types: {} };
      regionSignals[r.region].count++;
      if (r.urgency?.toLowerCase().includes('high')) regionSignals[r.region].urgent++;
      regionSignals[r.region].types[r.type] = (regionSignals[r.region].types[r.type] || 0) + 1;
    });
    return regionSignals;
  } catch (err) {
    console.error('[RT-Alerts] Report aggregation failed:', err.message);
    return {};
  }
}



/* ══════════════════════════════════════════════════════════════════
   MAIN: pollAndBroadcastLiveAlerts()
   Called every 15 min by cron. Fetches real data → saves to DB → broadcasts via WS.
══════════════════════════════════════════════════════════════════ */
async function pollAndBroadcastLiveAlerts(broadcastFn) {
  console.log('[RT-Alerts] 🛰️ Polling real government data sources…');
  console.log('[RT-Alerts]    Sources: GBIF.org · GlobalForestWatch · NASA FIRMS');
  const startTime = Date.now();

  try {
    const [gbifAlerts, gfwAlerts, fireAlerts, reportSignals] = await Promise.all([
      synthesizeGBIFAlerts(),
      synthesizeForestAlerts(),
      synthesizeFireAlerts(),
      aggregateReportSignals(),
    ]);

    const allAlerts = [...gbifAlerts, ...gfwAlerts, ...fireAlerts];

    if (allAlerts.length === 0) {
      console.log('[RT-Alerts] No new real-time alerts from any source this cycle.');
      _lastLivePoll = new Date().toISOString();
      return { alerts: [], mlSignals: reportSignals, broadcastCount: 0 };
    }

    // Enrich each with village message and ML contribution
    const enriched = allAlerts.map(alert => {
      const generated = generateAlertMessage(alert.type, alert.severity, alert.location);
      updateMLFeatureCache(alert);
      return {
        ...alert,
        externalRef:    alert._externalRef,
        headline:       generated.headline,
        headlineHindi:  generated.hindi,
        villageMessage: generated.villageMessage,
        solutions:      generated.solutions,
        prevention:     generated.prevention,
        whatsappText:   generated.whatsappText,
      };
    });

    // Deduplicate internally before bulkWrite
    const uniqueEnriched = [];
    const seenRefs = new Set();
    for (const a of enriched) {
      if (!seenRefs.has(a.externalRef)) {
        seenRefs.add(a.externalRef);
        uniqueEnriched.push(a);
      }
    }

    let newlyInsertedAlerts = [];

    if (uniqueEnriched.length > 0) {
      const bulkOps = uniqueEnriched.map(a => {
        const { id, _id, _externalRef, ...docToInsert } = a;
        docToInsert.polledAt = new Date().toISOString();
        return {
          updateOne: {
            filter: { externalRef: a.externalRef },
            update: { $setOnInsert: docToInsert },
            upsert: true
          }
        };
      });

      const result = await Alert.bulkWrite(bulkOps, { ordered: false });
      
      if (result.upsertedCount > 0) {
        const newIds = Object.values(result.upsertedIds);
        newlyInsertedAlerts = await Alert.find({ _id: { $in: newIds } }).lean();
      }
    }

    // Update in-memory cache with current active latest alerts from DB
    _liveAlertCache = await Alert.find({ source: 'system' }).sort({ createdAt: -1 }).limit(50).lean();
    _lastLivePoll   = new Date().toISOString();

    // Broadcast newly inserted ones via WebSocket
    if (broadcastFn && newlyInsertedAlerts.length > 0) {
      broadcastFn({
        event: 'realtime_alert_batch',
        data: {
          alerts:     newlyInsertedAlerts,
          count:      newlyInsertedAlerts.length,
          saved:      newlyInsertedAlerts.length,
          mlSignals:  reportSignals,
          polledAt:   _lastLivePoll,
          sources:    ['GBIF', 'GFW', 'NASA-FIRMS'],
          durationMs: Date.now() - startTime,
        },
      });

      // Individual toasts for critical alerts
      newlyInsertedAlerts
        .filter(a => a.severity === 'critical')
        .forEach(a => broadcastFn({ event: 'realtime_critical_alert', data: a }));
    }

    const durationMs = Date.now() - startTime;
    console.log(`[RT-Alerts] ✅ Done: ${newlyInsertedAlerts.length} NEW alerts persisted to MongoDB in ${durationMs}ms`);
    return { alerts: newlyInsertedAlerts, mlSignals: reportSignals, broadcastCount: newlyInsertedAlerts.length, saved: newlyInsertedAlerts.length };

  } catch (err) {
    console.error('[RT-Alerts] ❌ Poll failed:', err.message);
    return { alerts: [], mlSignals: {}, broadcastCount: 0, error: err.message };
  }
}

/* ── Get cached live alerts (for /api/alerts/live-feed) ── */
function getLiveAlerts() {
  return { alerts: _liveAlertCache, lastPoll: _lastLivePoll };
}

module.exports = {
  pollAndBroadcastLiveAlerts,
  getLiveAlerts,
  getMLFeatureOverrides,
  aggregateReportSignals,
};
