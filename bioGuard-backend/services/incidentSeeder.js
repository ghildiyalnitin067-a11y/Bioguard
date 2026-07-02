const Incident = require('../models/Incident');

const SYNTHETIC_INCIDENTS = [
{ animal: 'Asian Elephant', location: 'Kaziranga National Park - Eastern Range', state: 'Assam', lat: 26.6, lng: 93.45, severity: 'high', status: 'ongoing', casualties: 0, damage: 'Crop damage in peripheral village', response: 'Forest guards dispatched with noise makers', date: new Date().toLocaleDateString('en-IN') },
{ animal: 'Leopard', location: 'Manas National Park - Buffer Zone', state: 'Assam', lat: 26.72, lng: 91.1, severity: 'medium', status: 'monitoring', casualties: 0, damage: 'Livestock depredation reported', response: 'Camera traps installed', date: new Date(Date.now() - 86400000).toLocaleDateString('en-IN') },
{ animal: 'Wild Boar', location: 'Namdapha National Park', state: 'Arunachal Pradesh', lat: 27.5, lng: 96.2, severity: 'low', status: 'resolved', casualties: 0, damage: 'Minor agricultural disruption', response: 'Fencing patched up', date: new Date(Date.now() - 172800000).toLocaleDateString('en-IN') },
{ animal: 'Tiger', location: 'Keibul Lamjao National Park', state: 'Manipur', lat: 24.55, lng: 93.9, severity: 'high', status: 'contained', casualties: 0, damage: 'Spotted near human settlement', response: 'Warning issued to locals, perimeter secured', date: new Date(Date.now() - 259200000).toLocaleDateString('en-IN') },
{ animal: 'Asiatic Black Bear', location: 'Dzukou Valley Trek', state: 'Nagaland', lat: 25.5, lng: 94.08, severity: 'medium', status: 'resolved', casualties: 0, damage: 'Tourist camp raided for food', response: 'Camp relocated, awareness drive conducted', date: new Date(Date.now() - 345600000).toLocaleDateString('en-IN') }];


async function seedIncidentsIfEmpty() {
  try {
    const count = await Incident.countDocuments();
    if (count < 5) {
      console.log(`[SEEDER] Empty incidents collection detected. Generating ${SYNTHETIC_INCIDENTS.length} automatic incidents...`);
      for (const inc of SYNTHETIC_INCIDENTS) {
        await Incident.create({
          animal: inc.animal,
          location: inc.location,
          state: inc.state,
          coordinates: { lat: inc.lat, lng: inc.lng },
          severity: inc.severity,
          status: inc.status,
          casualties: inc.casualties,
          damage: inc.damage,
          response: inc.response,
          date: inc.date
        });
      }
      console.log('[SEEDER] Successfully injected synthetic incidents.');
    }
  } catch (err) {
    console.error('[SEEDER] Failed to seed incidents:', err.message);
  }
}

async function injectRandomIncident() {
  try {
    const base = SYNTHETIC_INCIDENTS[Math.floor(Math.random() * SYNTHETIC_INCIDENTS.length)];
    const lat = base.lat + (Math.random() * 0.05 - 0.025);
    const lng = base.lng + (Math.random() * 0.05 - 0.025);

    await Incident.create({
      animal: base.animal,
      location: `Near ${base.location}`,
      state: base.state,
      coordinates: { lat, lng },
      severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      status: 'ongoing',
      casualties: 0,
      damage: 'Automated live feed detection incident.',
      response: 'Auto-logged by system.',
      date: new Date().toLocaleDateString('en-IN')
    });
    console.log('[SEEDER] ⚠️ Live automatic incident injected:', base.animal, 'near', base.location);
  } catch (err) {
    console.error('[SEEDER] Failed to inject live incident:', err.message);
  }
}

module.exports = { seedIncidentsIfEmpty, injectRandomIncident };