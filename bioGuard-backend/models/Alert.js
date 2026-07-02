const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  type:        { type: String, required: true, enum: ['Wildlife', 'Deforestation', 'Wildfire', 'Poaching', 'Conflict', 'Other'] },
  severity:    { type: String, required: true, enum: ['info', 'warning', 'critical'] },
  location:    { type: String, required: true },
  state:       { type: String, required: true, default: 'Assam' },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  description: { type: String, default: '' },
  action:      { type: String, default: '' },
  status:      { type: String, enum: ['active', 'resolved', 'monitoring'], default: 'active' },
  reportedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt:  { type: Date },

  /* ── Source classification for dashboard sections ── */
  source:          { type: String, enum: ['system', 'asha_worker', 'admin'], default: 'system' },
  notificationType:{ type: String, default: '' }, // e.g. "real_news", "field_report", "satellite"
  externalRef:     { type: String, unique: true, sparse: true }, // Real-time deduplication key

  /* ── Auto-generated village message fields ── */
  villageMessage: { type: String, default: '' },   // Plain-text public advisory
  headline:       { type: String, default: '' },   // e.g. "🚨 WILDLIFE DANGER — STAY INDOORS"
  headlineHindi:  { type: String, default: '' },   // Hindi subtitle
  solutions:      [{ type: String }],              // Step-by-step actions for villagers
  prevention:     [{ type: String }],              // Long-term prevention tips
  whatsappText:   { type: String, default: '' },   // Ready-to-copy WhatsApp/SMS message

}, { timestamps: true });

alertSchema.index({ state: 1, severity: 1, createdAt: -1 });

module.exports = mongoose.model('Alert', alertSchema);
