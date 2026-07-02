
const express = require('express');
const router = express.Router();
const {
  fetchGBIFOccurrences,
  fetchThreatenedSpeciesNearby,
  countOccurrencesNear,
  fetchForestAlerts,
  fetchSpeciesStats
} = require('../services/realDataService');
const {
  predictRisk, getAllPredictions, getLastRefreshed, ZONES
} = require('../services/mlPredictor');
const {
  predictWithPython, buildFeatures, isPythonMLAvailable
} = require('../ml/mlBridge');

router.get('/wildlife-data', async (req, res) => {
  try {
    const { lat, lng, radius = 200, limit = 100 } = req.query;
    const opts = lat && lng ?
    { lat: parseFloat(lat), lng: parseFloat(lng), radiusKm: parseInt(radius), limit: parseInt(limit) } :
    { limit: parseInt(limit) };

    const occurrences = await fetchGBIFOccurrences(opts);
    res.json({
      source: 'GBIF — Global Biodiversity Information Facility (api.gbif.org)',
      fetched: new Date().toISOString(),
      count: occurrences.length,
      occurrences
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/forest-alerts', async (req, res) => {
  try {
    const alerts = await fetchForestAlerts();
    res.json({
      source: 'Global Forest Watch GLAD Alerts (data-api.globalforestwatch.org)',
      fetched: new Date().toISOString(),
      count: alerts.length,
      alerts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/species-stats', async (req, res) => {
  try {
    const stats = await fetchSpeciesStats();
    res.json({ source: 'GBIF API', fetched: new Date().toISOString(), ...stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/predict-risk/zones', (req, res) => {
  const predictions = getAllPredictions();
  const lastRefreshed = getLastRefreshed();
  res.json({ predictions, count: predictions.length, lastRefreshed });
});

router.post('/predict-risk', async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat == null || lng == null)
    return res.status(400).json({ error: 'lat and lng are required.' });

    const latF = parseFloat(lat);
    const lngF = parseFloat(lng);

    const nearest = findNearestZone(latF, lngF);

    const [occurrences, threatened, forestAlerts, occCount] = await Promise.allSettled([
    fetchGBIFOccurrences({ lat: latF, lng: lngF, radiusKm: 100, limit: 20 }),
    fetchThreatenedSpeciesNearby(latF, lngF, 100),
    fetchForestAlerts(),
    countOccurrencesNear(latF, lngF, 50)]
    ).then((results) => results.map((r) => r.status === 'fulfilled' ? r.value : Array.isArray(r.value) ? [] : 0));

    const safeOccurrences = Array.isArray(occurrences) ? occurrences : [];
    const safeThreatened = Array.isArray(threatened) ? threatened : [];
    const safeForest = Array.isArray(forestAlerts) ? forestAlerts : [];
    const safeOccCount = typeof occCount === 'number' ? occCount : 0;

    const nearbyForest = safeForest.filter((a) =>
    haversineKm(latF, lngF, a.lat, a.lng) < 200
    );

    const features = buildFeatures(latF, lngF);
    const pyFeatures = {
      sightings: safeOccCount,
      hist_conflicts: nearbyForest.filter((a) => ['high', 'critical'].includes(a.severity)).length * 3
    };
    const pyResult = await predictWithPython(latF, lngF, pyFeatures);

    const enrichedScore = pyResult.risk_score;
    const riskLevel = pyResult.risk_level?.toLowerCase() || getRiskLevel(enrichedScore);
    const modelUsed = pyResult.source === 'python_ml' ?
    'Python RandomForestRegressor (sklearn) + GBIF/GFW enrichment' :
    'JS Random Forest (fallback) + GBIF/GFW enrichment';

    const gbifBoost = Math.min(0.10, safeOccCount / 1500);
    const threatenedBoost = Math.min(0.07, safeThreatened.length * 0.02);
    const forestBoost = Math.min(0.08,
    nearbyForest.filter((a) => ['high', 'critical'].includes(a.severity)).length * 0.03
    );
    const basePred = { ...pyResult, threat_type: pyResult.threat_type || 'Wildlife', factors: pyResult.features_used };

    const insight = generateInsight({
      riskLevel, enrichedScore, nearest: nearest.zone,
      occCount: safeOccCount, threatened: safeThreatened.length,
      nearbyForest, basePred
    });

    res.json({
      lat: latF, lng: lngF,
      nearest_zone: nearest.zone.name,
      distance_km: parseFloat(nearest.distKm.toFixed(1)),
      risk_score: parseFloat(enrichedScore.toFixed(3)),
      risk_level: riskLevel,
      threat_type: basePred.threat_type,
      confidence: pyResult.confidence,
      insight,
      ml_model: modelUsed,
      ml_source: pyResult.source || 'js_fallback',
      data_sources: {
        gbif_sightings_50km: safeOccCount,
        gbif_sample_returned: safeOccurrences.length,
        threatened_species_nearby: safeThreatened.length,
        forest_alerts_200km: nearbyForest.length,
        gbif_boost: parseFloat(gbifBoost.toFixed(3)),
        threatened_boost: parseFloat(threatenedBoost.toFixed(3)),
        forest_boost: parseFloat(forestBoost.toFixed(3))
      },
      top_species: safeOccurrences.slice(0, 5).map((o) => ({
        species: o.species,
        commonName: o.commonName || '',
        iucnStatus: o.iucnStatus || null,
        lat: o.lat, lng: o.lng
      })),
      threatened_nearby: safeThreatened.slice(0, 3),
      forest_alerts_nearby: nearbyForest.slice(0, 3),
      factors: {
        ...(pyResult.features_used || {}),
        gbif_sighting_boost: parseFloat(gbifBoost.toFixed(3)),
        threatened_species_boost: parseFloat(threatenedBoost.toFixed(3)),
        forest_alert_boost: parseFloat(forestBoost.toFixed(3))
      },
      generated_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('[PredictRisk] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371,r = (d) => d * Math.PI / 180;
  const dLat = r(lat2 - lat1),dLng = r(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearestZone(lat, lng) {
  let best = ZONES[0],bestDist = Infinity;
  for (const z of ZONES) {
    const d = haversineKm(lat, lng, z.lat, z.lng);
    if (d < bestDist) {bestDist = d;best = z;}
  }
  return { zone: best, distKm: bestDist };
}

function getRiskLevel(score) {
  if (score >= 0.80) return 'critical';
  if (score >= 0.60) return 'high';
  if (score >= 0.40) return 'medium';
  return 'low';
}

function generateInsight({ riskLevel, enrichedScore, nearest, occCount, threatened, nearbyForest, basePred }) {
  const pct = Math.round(enrichedScore * 100);
  const threat = basePred.threat_type;
  const lines = [];

  const RISK_LABELS = {
    critical: `🔴 CRITICAL RISK (${pct}/100) — Immediate action required near ${nearest.name}.`,
    high: `🟠 HIGH RISK (${pct}/100) — Elevated ${threat} threat near ${nearest.name}.`,
    medium: `🟡 MEDIUM RISK (${pct}/100) — Monitor ${threat} activity near ${nearest.name}.`,
    low: `🟢 LOW RISK (${pct}/100) — ${nearest.name} appears stable.`
  };

  lines.push(RISK_LABELS[riskLevel] || RISK_LABELS.medium);

  if (basePred.prediction) lines.push(basePred.prediction);

  if (occCount > 500)
  lines.push(`🐾 High wildlife activity: ${occCount.toLocaleString()} GBIF sightings within 50km.`);else
  if (occCount > 0)
  lines.push(`🐾 ${occCount} GBIF wildlife sightings recorded within 50km.`);

  if (threatened > 0)
  lines.push(`⚠️ ${threatened} threatened/endangered species recorded nearby (GBIF/IUCN).`);

  if (nearbyForest.length > 0) {
    const critical = nearbyForest.filter((a) => a.severity === 'critical').length;
    lines.push(`🌳 ${nearbyForest.length} GFW deforestation alert(s) within 200km${critical ? ` (${critical} critical)` : ''}.`);
  }

  return lines.join(' | ');
}

module.exports = router;