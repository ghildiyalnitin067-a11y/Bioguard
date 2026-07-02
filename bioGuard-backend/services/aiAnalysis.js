/**
 * AI Image Analysis Service
 * Accepts a satellite image URL or coordinates and returns:
 *  - Deforestation risk (NDVI-approximated)
 *  - Detected anomalies
 *  - Confidence scores
 *
 * Production note: Replace the heuristic below with calls to:
 *   - Google Earth Engine API (NDVI analysis)
 *   - Sentinel Hub (change detection)
 *   - Google Cloud Vision API (object detection in drone imagery)
 */

const ANOMALY_TYPES = [
  'Clear-cut logging',
  'Selective logging trails',
  'Slash-and-burn deforestation',
  'Wildlife movement corridor',
  'Fire scar pattern',
  'Water body encroachment',
  'Road construction in forest',
  'Settlement expansion',
  'Legal forest cover',
  'Degraded secondary forest',
];

/**
 * Simulate NDVI (Normalized Difference Vegetation Index) analysis
 * NDVI range: -1 to +1 (>0.6 = dense forest, <0.2 = bare/deforested)
 */
function estimateNDVI(lat, lng) {
  // NE India baseline NDVI ~ 0.65 (rich forests)
  // Perturb based on known conflict zones
  const knownRisks = [
    { lat: 27.55, lng: 96.38, penalty: 0.3 }, // Namdapha
    { lat: 25.54, lng: 94.03, penalty: 0.25 }, // Dzukou
    { lat: 23.49, lng: 92.50, penalty: 0.15 }, // Dampa
  ];
  let ndvi = 0.65 + (Math.random() * 0.15 - 0.07);
  for (const r of knownRisks) {
    const dist = Math.sqrt(Math.pow(lat - r.lat, 2) + Math.pow(lng - r.lng, 2));
    if (dist < 0.5) ndvi -= r.penalty * (1 - dist / 0.5);
  }
  return Math.max(0.0, Math.min(0.95, ndvi));
}

/**
 * Detect anomalies from an image/coordinate pair
 * Returns structured analysis result
 */
function analyzeImage({ lat, lng, imageUrl, zone }) {
  const ndvi          = estimateNDVI(lat, lng);
  const forestCover   = Math.round(ndvi * 100);
  const changeRate    = parseFloat(((0.75 - ndvi) * 15).toFixed(2));  // % change per year
  const deforestRisk  = parseFloat((1 - ndvi).toFixed(3));

  // Detect likely anomalies
  const detected = [];
  if (ndvi < 0.25)       detected.push({ label: 'Clear-cut logging',         confidence: 0.87, bbox: { x: 23, y: 31, w: 45, h: 38 } });
  if (ndvi < 0.35)       detected.push({ label: 'Selective logging trails',   confidence: 0.74, bbox: { x: 60, y: 15, w: 30, h: 20 } });
  if (ndvi < 0.45)       detected.push({ label: 'Slash-and-burn deforestation', confidence: 0.68, bbox: { x: 10, y: 55, w: 28, h: 22 } });
  if (changeRate > 1.5)  detected.push({ label: 'Vegetation loss hotspot',    confidence: 0.79, bbox: { x: 40, y: 40, w: 35, h: 28 } });
  if (ndvi > 0.6)        detected.push({ label: 'Dense forest canopy',        confidence: 0.92, bbox: { x: 5,  y: 5,  w: 90, h: 90 } });
  if (ndvi > 0.4 && ndvi < 0.6)
                         detected.push({ label: 'Degraded secondary forest',  confidence: 0.71, bbox: { x: 20, y: 20, w: 60, h: 60 } });

  const riskLevel = deforestRisk > 0.6 ? 'critical' : deforestRisk > 0.4 ? 'high' : deforestRisk > 0.25 ? 'medium' : 'low';

  return {
    zone:          zone || `${lat.toFixed(3)}, ${lng.toFixed(3)}`,
    coordinates:   { lat, lng },
    analyzed_at:   new Date().toISOString(),
    image_url:     imageUrl || null,
    ndvi_score:    parseFloat(ndvi.toFixed(3)),
    forest_cover:  forestCover,
    annual_change: changeRate,
    deforest_risk: deforestRisk,
    risk_level:    riskLevel,
    detections:    detected,
    summary: riskLevel === 'critical'
      ? `⚠️ CRITICAL: Severe deforestation detected. Forest cover ${forestCover}%. Immediate ground verification required.`
      : riskLevel === 'high'
      ? `🟠 HIGH RISK: Significant vegetation loss. NDVI ${ndvi.toFixed(2)} ↓ from baseline 0.65. DFO alert recommended.`
      : riskLevel === 'medium'
      ? `🟡 MODERATE: Minor vegetation changes detected. Monitoring advised.`
      : `🟢 LOW RISK: Healthy forest cover (${forestCover}%). No immediate action required.`,
    recommendations: buildRecommendations(riskLevel, changeRate),
  };
}

function buildRecommendations(level, changeRate) {
  const base = ['Schedule next satellite pass in 15 days'];
  if (level === 'critical') return [
    'Dispatch ground verification team immediately',
    'Suspend new permits in 5km radius',
    'Notify District Forest Officer and State PCB',
    'File FIR if illegal activity confirmed',
    ...base,
  ];
  if (level === 'high') return [
    'Drone survey within 48h',
    'Increase patrol frequency in area',
    'Cross-check with permit registry',
    ...base,
  ];
  if (level === 'medium') return [
    'Add zone to weekly monitoring list',
    'Community engagement with village councils',
    ...base,
  ];
  return base;
}

module.exports = { analyzeImage };
