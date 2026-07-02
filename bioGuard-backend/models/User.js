const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['user', 'asha_worker', 'admin'], default: 'user' },
  state: { type: String, default: 'Assam' },
  bio: { type: String, default: '' },
  avatar: { type: String, default: '' },
  reports: { type: Number, default: 0 },
  alertsRecv: { type: Number, default: 0 },
  joined: { type: String, default: () => new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }) },
  joinedVia: { type: String, enum: ['email', 'google'], default: 'email' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.pre('save', function (next) {
  if (!this.avatar) {
    this.avatar = `https://api.dicebear.com/8.x/adventurer/svg?seed=${encodeURIComponent(this.email)}`;
  }
  next();
});

userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.toPublic = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

userSchema.methods.isAdmin = function () {return this.role === 'admin';};
userSchema.methods.isAshaWorker = function () {return ['asha_worker', 'admin'].includes(this.role);};

module.exports = mongoose.model('User', userSchema);