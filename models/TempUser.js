const mongoose = require('mongoose');

const tempUserSchema = new mongoose.Schema({
   email: {
      type: String,
      required: true,
      unique: true
   },
   name: {
      type: String,
      required: true
   },
   verificationToken: {
      type: String,
      required: true
   },
   isEmailVerified: {
      type: Boolean,
      default: false
   },
   workspaceID: {
      type: String,
      unique: true,
      required: true
   },
   createdAt: {
      type: Date,
      default: Date.now
   }
});

// TTL index
tempUserSchema.index(
   { createdAt: 1 },
   { expireAfterSeconds: 3600 } // test için
);

module.exports = mongoose.model('TempUser', tempUserSchema);

