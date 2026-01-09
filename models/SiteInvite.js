const mongoose = require('mongoose');

const siteInviteSchema = new mongoose.Schema({
   site: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      required: true,
      index: true
   },

   email: {
      type: String,
      required: true,
      lowercase: true,
      index: true
   },

   token: {
      type: String,
      required: true,
      unique: true,
      index: true
   },

   role: {
      type: String,
      enum: ['viewer', 'editor'],
      default: 'viewer'
   },

   accepted: {
      type: Boolean,
      default: false
   },

   expiresAt: {
      type: Date,
      required: true,
      index: { expires: '0s' } // ⏳ TTL auto delete
   },

   createdAt: {
      type: Date,
      default: Date.now
   }
});

module.exports = mongoose.model('SiteInvite', siteInviteSchema);