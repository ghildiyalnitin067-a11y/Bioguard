require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

const EMAIL = 'nitinghildiyal2007@gmail.com';

async function run() {
  console.log('[Script] Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[Script] Connected.');

  const User = require('../models/User');

  let user = await User.findOne({ email: EMAIL });

  if (!user) {
    console.log(`[Script] User "${EMAIL}" not found — creating admin account...`);
    user = await User.create({
      name: 'Nitin Ghildiyal',
      email: EMAIL,
      password: 'Admin@1234',
      role: 'admin',
      state: 'Uttarakhand'
    });
    console.log(`[Script] ✅ Created admin user: ${EMAIL}`);
  } else {
    const prev = user.role;
    user.role = 'admin';
    await user.save({ validateBeforeSave: false });
    console.log(`[Script] ✅ Updated "${EMAIL}" role: ${prev} → admin`);
    console.log(`[Script] ℹ️  Admin role includes all NGO Worker (asha_worker) permissions.`);
  }

  console.log('\n  User details:');
  console.log(`    Name  : ${user.name}`);
  console.log(`    Email : ${user.email}`);
  console.log(`    Role  : ${user.role}`);
  console.log(`    State : ${user.state}`);
  console.log('\n  Access granted:');
  console.log('    ✅ /admin-dashboard  (admin panel)');
  console.log('    ✅ /worker-dashboard (NGO worker panel)');
  console.log('    ✅ /analytics        (analytics panel)');
  console.log('    ✅ /conflict         (conflict monitor)');
  console.log('    ✅ /alerts           (create & manage alerts)');
  console.log('    ✅ All user features');

  await mongoose.disconnect();
  console.log('\n[Script] Done. ✅');
  process.exit(0);
}

run().catch((err) => {
  console.error('[Script] ❌ Error:', err.message);
  process.exit(1);
});