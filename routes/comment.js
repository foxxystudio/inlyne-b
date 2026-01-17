const express = require('express');
const Comment = require('../models/Comment');

const router = express.Router();

// Create a new comment
router.post('/create', async (req, res) => {
   try {
      const {
         userId,
         workspaceId,
         userEmail,
         userName,
         projectId,
         iframeId,
         iframeUrl,
         iframePage,
         resolved,
         text,
         meta
      } = req.body;

      // Validation
      if (!userId || !workspaceId || !userEmail || !userName || !projectId || !iframeId || !text) {
         return res.status(400).json({
            success: false,
            msg: 'Missing required fields'
         });
      }

      if (text.length > 1000) {
         return res.status(400).json({
            success: false,
            msg: 'Comment text cannot exceed 1000 characters'
         });
      }

      // Create comment
      const comment = await Comment.create({
         userId,
         workspaceId,
         userEmail,
         userName,
         projectId,
         iframeId,
         iframeUrl,
         iframePage,
         resolved: resolved || false,
         text,
         meta
      });

      res.status(201).json({
         success: true,
         msg: 'Comment created successfully',
         data: comment
      });

   } catch (err) {
      console.error('Create comment error:', err);
      res.status(500).json({
         success: false,
         msg: 'Server error from create comment'
      });
   }
});

// Get comments by iframeId and page
router.get('/get/:iframeId', async (req, res) => {
   try {
      const { iframeId } = req.params;
      const { page, deviceType } = req.query;

      // Build query - MUST match both page AND deviceType
      const query = { iframeId };
      
      if (page) {
         query.iframePage = page;
      }
      
      if (deviceType) {
         query['meta.deviceType'] = deviceType;
      }

      const comments = await Comment.find(query)
         .sort({ createdAt: -1 })
         .populate('userId', 'email');

      res.json({
         success: true,
         data: comments
      });

   } catch (err) {
      console.error('Get comments error:', err);
      res.status(500).json({
         success: false,
         msg: 'Failed to fetch comments'
      });
   }
});

module.exports = router;
