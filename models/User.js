const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
   email: {
      type: String,
      required: true,
      unique: true
   },
   password: {
      type: String,
      required: true
   },
   isVerified: {
      type: Boolean,
      default: false
   },
   workspaceID: {
      type: String,
      unique: true,
      index: true,
      required: true
   }
});

module.exports = mongoose.model('User', userSchema);