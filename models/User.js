const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
   email: {
      type: String,
      required: true,
      unique: true
   },
   name: {
      type: String,
      required: true
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
   },
   role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user'
   },
   createdAt: {
      type: Date,
      default: Date.now
   },
   updatedAt: {
      type: Date,
      default: Date.now
   }
});

module.exports = mongoose.model('User', userSchema);