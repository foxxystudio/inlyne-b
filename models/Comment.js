const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
   userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
   },
   workspaceId: {
      type: String,
      required: true
   },
   userEmail: {
      type: String,
      required: true
   },
   userName: {
      type: String,
      required: true
   },
   projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true
   },
   iframeId: {
      type: String,
      required: true
   },
   iframeUrl: {
      type: String,
      required: true
   },
   iframePage: {
      type: String,
      required: true
   },
   resolved: {
      type: Boolean,
      default: false
   },
   text: {
      type: String,
      required: true,
      maxLength: 1000
   },
   meta: {
      deviceType: {
         type: String,
         enum: ['desktop', 'tablet', 'mobile'],
         required: true
      },
      iframeSrc: {
         type: String,
         required: true
      },
      page: {
         type: String,
         required: true
      },
      scroll: {
         type: Number,
         required: true
      },
      viewportWidth: {
         type: Number,
         required: true
      },
      viewportHeight: {
         type: Number,
         required: true
      },
      x: {
         type: Number,
         required: true
      },
      y: {
         type: Number,
         required: true
      }
   }
}, {
   timestamps: true // createdAt ve updatedAt otomatik oluşturulur
});

module.exports = mongoose.model('Comment', commentSchema);