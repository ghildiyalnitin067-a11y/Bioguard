const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  animal:      { type: String, required: true },
  location:    { type: String, required: true },
  state:       { type: String, required: true },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  severity:    { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status:      { type: String, enum: ['ongoing', 'contained', 'monitoring', 'resolved'], default: 'ongoing' },
  casualties:  { type: Number, default: 0 },
  damage:      { type: String, default: '' },
  response:    { type: String, default: '' },
  date:        { type: String },
  reportedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Incident', incidentSchema);
