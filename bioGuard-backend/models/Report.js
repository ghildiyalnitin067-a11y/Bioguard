const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  type: { type: String, required: true, enum: ['wildlife', 'deforestation', 'fire', 'poaching', 'other'] },
  region: { type: String, required: true },
  location: { type: String, required: true },
  urgency: { type: String, required: true },
  description: { type: String, required: true },
  files: [{ type: String }],
  imageData: [{ type: String }],

  anonymous: { type: Boolean, default: false },
  contactName: { type: String, default: '' },
  contactPhone: { type: String, default: '' },
  contactEmail: { type: String, default: '' },

  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  status: { type: String, enum: ['pending', 'reviewed', 'resolved', 'fake'], default: 'pending' },
  refId: { type: String, unique: true },
  riskLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  isFake: { type: Boolean, default: false },
  moderatorNote: { type: String, default: '' }
}, { timestamps: true });

reportSchema.index({ region: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);