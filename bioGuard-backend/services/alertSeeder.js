/**
 * alertSeeder.js
 * ─────────────────────────────────────────────────────────────────
 * Seeds the database with realistic, real-life-inspired alerts for
 * NE India based on actual documented incidents (Kaziranga floods,
 * Manas wildfires, Manipur leopard sightings, etc.).
 *
 * These are SOURCE = "system" alerts — they represent official
 * government notifications, satellite detections, and verified
 * field events. They appear in the "Real-Life Alerts" section of
 * the dashboard.
 *
 * Run on startup:  seedAlertsIfEmpty()
 * Force re-seed:   seedAlertsForce()  (admin endpoint)
 */

const Alert = require('../models/Alert');
const { generateAlertMessage } = require('./alertMessageGenerator');

/* ═══════════════════════════════════════════════════════════════════
   REAL-LIFE INSPIRED ALERT DATA
   Based on documented NE India biodiversity events (2022–2025)
═══════════════════════════════════════════════════════════════════ */
const REAL_LIFE_ALERTS = [

  /* ── CRITICAL ALERTS ── */
  {
    type: 'Wildlife',
    severity: 'critical',
    location: 'Kaziranga National Park — Western Range, Bagori',
    state: 'Assam',
    coordinates: { lat: 26.578, lng: 93.041 },
    description: 'A male one-horned rhinoceros (estimated 8 years old) found with gunshot wounds near Bagori range. Poachers suspected to have accessed the park through the Brahmaputra floodplain during seasonal flood displacement. Anti-poaching unit deployed.',
    action: 'Anti-poaching rapid response unit (RPF Squad 3) deployed. Rhino airlifted to CWS veterinary unit. FIR No. KNP/04/2025 filed.',
    status: 'active',
    notificationType: 'real_news',
  },
  {
    type: 'Wildfire',
    severity: 'critical',
    location: 'Manas National Park — Beki River Corridor, Basbari',
    state: 'Assam',
    coordinates: { lat: 26.742, lng: 90.980 },
    description: 'Large-scale wildfire erupted across 1,200 hectares of the Manas buffer zone grassland. Dry conditions following delayed monsoon combined with suspected deliberate fire-setting created rapid spread. Over 40 wildlife species habitat affected.',
    action: 'Assam Forest Department Fire Response Unit activated. Firebreak lines cut by JCBs. Community volunteers from Basbari and Sorenga villages assisting. Air support requested from NDRF.',
    status: 'active',
    notificationType: 'satellite',
  },
  {
    type: 'Deforestation',
    severity: 'critical',
    location: 'Namdapha Tiger Reserve — Miao Buffer Zone',
    state: 'Arunachal Pradesh',
    coordinates: { lat: 27.493, lng: 96.394 },
    description: 'Satellite imagery from Sentinel-2 detected clearance of approximately 340 hectares of old-growth forest in the Miao buffer zone. Suspected Chinese timber operation using local intermediaries. Primary forest with rare Hoolock Gibbon habitat destroyed.',
    action: 'Arunachal Pradesh Forest Crime Cell investigating. Two suspects detained. Area cordoned off pending DSF court order. WCCB alerted.',
    status: 'monitoring',
    notificationType: 'satellite',
  },
  {
    type: 'Conflict',
    severity: 'critical',
    location: 'Elephants — NH-37 Crossing near Bokakhat',
    state: 'Assam',
    coordinates: { lat: 26.637, lng: 93.601 },
    description: 'Herd of 23 elephants (including 4 calves) attempting to cross NH-37 national highway between Bokakhat and Kaziranga. Multiple vehicles stopped. One truck driver injured when elephant charged. Highway blocked for 3+ hours.',
    action: 'Traffic on NH-37 halted between Km 234–289. Forest Department elephant squads with firecrackers guiding herd. Medical team on standby at Bokakhat PHC.',
    status: 'active',
    notificationType: 'field_report',
  },

  /* ── WARNING ALERTS ── */
  {
    type: 'Poaching',
    severity: 'warning',
    location: 'Keibul Lamjao National Park — Floating Biomass Zone',
    state: 'Manipur',
    coordinates: { lat: 24.508, lng: 93.891 },
    description: 'Three unknown persons with country-made firearms spotted near the Sangai deer habitat zone at 02:30 AM. The Brow-antlered Deer (Sangai) — Manipur\'s state animal — breeds here exclusively. Two camera traps triggered near section 7B.',
    action: 'Night patrol squad deployed. CCTV footage under analysis. WCCB Manipur State Wing alerted. Local informant network activated.',
    status: 'monitoring',
    notificationType: 'field_report',
  },
  {
    type: 'Wildlife',
    severity: 'warning',
    location: 'Dibru-Saikhowa National Park — Guijan Ferry Area',
    state: 'Assam',
    coordinates: { lat: 27.467, lng: 95.254 },
    description: 'Feral horses (protected feral population unique to Dibru-Saikhowa) exhibiting unusual movement patterns towards nearby villages. Suspected due to high Brahmaputra water level cutting off grazing areas. 12 horses seen at village periphery.',
    action: 'Forest rangers monitoring movement. Villagers advised not to approach. Supplementary fodder being arranged at safe locations.',
    status: 'monitoring',
    notificationType: 'field_report',
  },
  {
    type: 'Deforestation',
    severity: 'warning',
    location: 'Pakke Tiger Reserve — Seijosa Eco-Sensitive Zone',
    state: 'Arunachal Pradesh',
    coordinates: { lat: 27.023, lng: 93.218 },
    description: 'Unregistered bulldozer operations spotted near forest boundary of Pakke Tiger Reserve. Suspected land clearing for unauthorized jhum cultivation extension. Approx. 80 hectares at risk. Hornbill nesting trees in the area.',
    action: 'Notice issued to Village Council Chairman. DFO conducting ground-truth verification. Operations suspended pending inquiry.',
    status: 'active',
    notificationType: 'satellite',
  },
  {
    type: 'Wildfire',
    severity: 'warning',
    location: 'Dzukou Valley — Viswema Village Track',
    state: 'Nagaland',
    coordinates: { lat: 25.509, lng: 94.082 },
    description: 'Fire detected on the eastern slopes of Dzukou Valley near the trekking trail. The valley hosts over 250 species of rare flowers including the iconic Dzukou lily. Strong winds forecast over next 48 hours may spread fire.',
    action: 'Trekking suspended until further notice. Forest Department fire line team mobilized. Village fire brigades from Viswema and Jakhama on standby.',
    status: 'active',
    notificationType: 'satellite',
  },

  /* ── INFO ALERTS ── */
  {
    type: 'Wildlife',
    severity: 'info',
    location: 'Orang National Park — Bramhaputra North Bank',
    state: 'Assam',
    coordinates: { lat: 26.493, lng: 92.246 },
    description: 'Sentinel-2 satellite pass detected 3 Bengal tiger territory movements over the last 72 hours. All within park boundary. One juvenile male showing range expansion towards eco-sensitive zone border. Monitoring increased.',
    action: 'Camera trap imagery confirms healthy tiger population. No immediate threat. Monitoring continued by Range Officer Ranjit Bora.',
    status: 'monitoring',
    notificationType: 'satellite',
  },
  {
    type: 'Conflict',
    severity: 'info',
    location: 'Balpakram National Park Area — Baghmara Township',
    state: 'Meghalaya',
    coordinates: { lat: 25.159, lng: 90.861 },
    description: 'Community members report increased Leopard cat sightings near Baghmara market area and surrounding homesteads. 3 livestock (goats) killed in past week. No human casualties. Pattern suggests individual animal pushed out of park by territorial conflict.',
    action: 'Forest Dept. set up cage trap at hotspot location. Community informed about safety precautions. Compensation forms distributed to affected families.',
    status: 'monitoring',
    notificationType: 'field_report',
  },
  {
    type: 'Deforestation',
    severity: 'info',
    location: 'Singphan Wildlife Sanctuary — Longleng District',
    state: 'Nagaland',
    coordinates: { lat: 26.602, lng: 94.862 },
    description: 'Annual forest cover loss analysis (2023–2025) shows 2.3% decline in canopy density within 5km of sanctuary boundary. Attributed to expanding subsistence agriculture pressure. No illegal logging detected but trend warrants monitoring.',
    action: 'Satellite monitoring frequency increased to weekly. Outreach scheduled with Longleng District Council on Oct 15. BioGuard reporting stations to be established in 3 border villages.',
    status: 'monitoring',
    notificationType: 'satellite',
  },
  {
    type: 'Poaching',
    severity: 'info',
    location: 'Assam-Nagaland Border — Golaghat Forest Division',
    state: 'Assam',
    coordinates: { lat: 26.511, lng: 93.975 },
    description: 'Routine patrol by Golaghat Forest Division recovered 8 wire snares set for deer along the Doyang river corridor. No animals found. Snares consistent with local hunting methods. Warning notices issued to 4 border villages.',
    action: 'Snares removed and logged as evidence. Awareness camp organized in Khumtai village. Anti-poaching informant network refreshed in border area.',
    status: 'resolved',
    notificationType: 'field_report',
  },
];

/* ═══════════════════════════════════════════════════════════════════
   SEEDER FUNCTIONS
═══════════════════════════════════════════════════════════════════ */

async function _createRealLifeAlerts() {
  const created = [];
  for (const data of REAL_LIFE_ALERTS) {
    const generated = generateAlertMessage(data.type, data.severity, data.location);
    const alert = await Alert.create({
      ...data,
      source: 'system',
      headline:       generated.headline,
      headlineHindi:  generated.hindi,
      villageMessage: generated.villageMessage,
      solutions:      generated.solutions,
      prevention:     generated.prevention,
      whatsappText:   generated.whatsappText,
    });
    created.push(alert._id);
  }
  return created;
}

/**
 * Seed real-life alerts ONLY if no system alerts exist yet.
 * Safe to call on every startup — idempotent.
 */
async function seedAlertsIfEmpty() {
  try {
    const count = await Alert.countDocuments({ source: 'system' });
    if (count === 0) {
      console.log('[AlertSeeder] No system alerts found. Seeding real-life alerts...');
      const ids = await _createRealLifeAlerts();
      console.log(`[AlertSeeder] ✅ Seeded ${ids.length} real-life alerts.`);
    } else {
      console.log(`[AlertSeeder] ${count} system alerts already exist — skipping seed.`);
    }
  } catch (err) {
    console.error('[AlertSeeder] Failed to seed alerts:', err.message);
  }
}

/**
 * Force re-seed: delete all system alerts and recreate.
 * Called from the admin endpoint POST /api/alerts/seed.
 */
async function seedAlertsForce() {
  try {
    const deleted = await Alert.deleteMany({ source: 'system' });
    console.log(`[AlertSeeder] Cleared ${deleted.deletedCount} existing system alerts.`);
    const ids = await _createRealLifeAlerts();
    console.log(`[AlertSeeder] ✅ Force-seeded ${ids.length} real-life alerts.`);
    return ids.length;
  } catch (err) {
    console.error('[AlertSeeder] Force seed failed:', err.message);
    throw err;
  }
}

module.exports = { seedAlertsIfEmpty, seedAlertsForce, REAL_LIFE_ALERTS };
