const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  type: { type: String, required: true, enum: ['Wildlife', 'Deforestation', 'Wildfire', 'Poaching', 'Conflict', 'Other'] },
  severity: { type: String, required: true, enum: ['info', 'warning', 'critical'] },
  location: { type: String, required: true },
  state: { type: String, required: true, default: 'Assam' },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  description: { type: String, default: '' },
  action: { type: String, default: '' },
  status: { type: String, enum: ['active', 'resolved', 'monitoring'], default: 'active' },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: { type: Date },

  source: { type: String, enum: ['system', 'asha_worker', 'admin'], default: 'system' },
  notificationType: { type: String, default: '' },
  externalRef: { type: String, unique: true, sparse: true },

  villageMessage: { type: String, default: '' },
  headline: { type: String, default: '' },
  headlineHindi: { type: String, default: '' },
  solutions: [{ type: String }],
  prevention: [{ type: String }],
  whatsappText: { type: String, default: '' }

}, { timestamps: true });

alertSchema.index({ state: 1, severity: 1, createdAt: -1 });

module.exports = mongoose.model('Alert', alertSchema);