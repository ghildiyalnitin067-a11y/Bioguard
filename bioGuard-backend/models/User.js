const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

/**
 * Roles:
 *   user        — Community Member (read alerts, submit reports)
 *   asha_worker — Field Ranger / Asha Worker (create alerts, full incident access)
 *   admin       — Administrator (full system access, user management, ML controls)
 */
const userSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:     { type: String, required: true, minlength: 6, select: false },
  role:         { type: String, enum: ['user', 'asha_worker', 'admin'], default: 'user' },
  state:        { type: String, default: 'Assam' },
  bio:          { type: String, default: '' },
  avatar:       { type: String, default: '' },
  reports:      { type: Number, default: 0 },
  alertsRecv:   { type: Number, default: 0 },
  joined:       { type: String, default: () => new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }) },
  joinedVia:    { type: String, enum: ['email', 'google'], default: 'email' },
  isActive:     { type: Boolean, default: true },
  lastLogin:    { type: Date },
}, { timestamps: true });

/* Hash password before save */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

/* Generate avatar from email */
userSchema.pre('save', function (next) {
  if (!this.avatar) {
    this.avatar = `https://api.dicebear.com/8.x/adventurer/svg?seed=${encodeURIComponent(this.email)}`;
  }
  next();
});

/* Compare password */
userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

/* Safe public view (no password) */
userSchema.methods.toPublic = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

/* Role checks */
userSchema.methods.isAdmin      = function () { return this.role === 'admin'; };
userSchema.methods.isAshaWorker = function () { return ['asha_worker', 'admin'].includes(this.role); };

module.exports = mongoose.model('User', userSchema);
