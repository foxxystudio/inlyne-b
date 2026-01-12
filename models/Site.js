const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema({
   name: {
      type: String,
      required: true
   },
   url: {
      type: String,
      required: true
   },
   coverImage: {
      type: String,
      required: false,
      default: null
   },
   siteID: {
      type: String,
      unique: true,
      index: true,
      required: true
   },
   allowedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
   }],
   createdAt: {
      type: Date,
      default: Date.now
   },
   updatedAt: {
      type: Date,
      default: Date.now
   }
});

module.exports = mongoose.model('Site', siteSchema);