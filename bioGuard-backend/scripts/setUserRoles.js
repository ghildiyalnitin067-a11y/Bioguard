require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const ASSIGNMENTS = [
{
  email: 'nitinghildiyal2007@gmail.com',
  role: 'admin',
  name: 'Nitin Ghildiyal (Govt)',
  label: 'Government User (Admin)'
},
{
  email: 'ghildiyalnitin067@gmail.com',
  role: 'asha_worker',
  name: 'Nitin Ghildiyal (ASHA)',
  label: 'ASHA / NGO Worker'
}];


async function run() {
  console.log('[Script] Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[Script] Connected.\n');

  const User = require('../models/User');

  for (const { email, role, name, label } of ASSIGNMENTS) {
    let user = await User.findOne({ email });

    if (!user) {
      console.log(`  ⚙  "${email}" not found — creating new account...`);
      user = await User.create({
        name,
        email,
        password: role === 'admin' ? 'Admin@1234' : 'Asha@1234',
        role,
        state: 'Uttarakhand'
      });
      console.log(`  ✅ Created   → ${email}  [${label}]`);
    } else {
      const prev = user.role;
      user.role = role;
      await user.save({ validateBeforeSave: false });
      console.log(`  ✅ Updated   → ${email}  :  ${prev} → ${role}  [${label}]`);
    }
  }

  console.log('\n  ── Role Summary ──────────────────────────────────────────');
  console.log('  nitinghildiyal2007@gmail.com  →  admin (Government User)');
  console.log('    ✅ /admin-dashboard, /analytics, /conflict, /alerts, all features');
  console.log('');
  console.log('  ghildiyalnitin067@gmail.com   →  asha_worker (ASHA Worker)');
  console.log('    ✅ /worker-dashboard, /conflict, /alerts, all user features');
  console.log('  ──────────────────────────────────────────────────────────\n');

  await mongoose.disconnect();
  console.log('[Script] Done. ✅');
  process.exit(0);
}

run().catch((err) => {
  console.error('[Script] ❌ Error:', err.message);
  process.exit(1);
});