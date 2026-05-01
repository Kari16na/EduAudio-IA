const mongoose = require('mongoose');

const audioSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileName: { type: String, required: true },
  summary: { type: String, required: true },
  audioUrl: { type: String, required: true },
  paragraphs: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Audio', audioSchema);