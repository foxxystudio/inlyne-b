const express = require('express');
const Site = require('../models/Site');
const crypto = require('crypto');
const generateCoverImage = require('../utils/site/generateCoverImage');

const router = express.Router();

// SiteID generate
const generateSiteId = async () => {
   let id;
   let exists = true;

   while (exists) {
      id = crypto.randomBytes(4).toString('hex'); // 8 char: [0-9a-f]
      exists = await Site.exists({ siteID: id });
   }

   return id;
};

// Create a new site
router.post('/create', async (req, res) => {
   const { userId, name, url } = req.body;

   try {
      if (!name || !url) {
         return res.status(400).json({
            success: false,
            msg: 'Name and URL are required',
         });
      }

      const siteID = await generateSiteId();

      // 🔥 SCREENSHOT AL (tolerate failure in prod)
      let coverImage = null;
      try {
         coverImage = await generateCoverImage(url, siteID);
      } catch (err) {
         console.error('Cover image generation failed:', err?.message || err);
         coverImage = null;
      }

      const site = await Site.create({
         name,
         url,
         siteID,
         coverImage,
         allowedUsers: [userId],
      });

      res.status(201).json({
         success: true,
         msg: 'Site created successfully',
         data: site,
      });

   } catch (err) {
      console.error(err);
      res.status(500).json({
         success: false,
         msg: 'Server error from create site',
      });
   }
});

// Get Sites by userID
router.get('/get/:userId', async (req, res) => {
   try {
      const userId = req.params.userId;

      const sites = await Site.find({
         allowedUsers: userId
      }).sort({ createdAt: -1 });

      res.json({
         success: true,
         data: sites
      });

   } catch (err) {
      res.status(500).json({
         success: false,
         msg: 'Failed to fetch sites'
      });
   }
});

module.exports = router;