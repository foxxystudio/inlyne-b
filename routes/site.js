const express = require('express');
const Site = require('../models/Site');
const User = require('../models/User');
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

      // 🔥 SCREENSHOT AL (skip if disabled; never block creation)
      const screenshotsDisabled = process.env.PUPPETEER_DISABLED === 'true';

      let coverImage = null;
      if (!screenshotsDisabled) {
         try {
            coverImage = await generateCoverImage(url, siteID);
         } catch (err) {
            console.error('Cover image generation failed:', err?.message || err);
            coverImage = null;
         }
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

// Add an allowed user by email for a site
router.post('/invite', async (req, res) => {
   const { userEmail, siteID, userId } = req.body;
   const requesterId = req.user?.id || userId;

   if (!requesterId) {
      return res.status(401).json({ msg: 'Unauthorized' });
   }

   if (!userEmail || !siteID) {
      return res.status(400).json({ msg: 'userEmail and siteID are required' });
   }

   try {
      const site = await Site.findOne({
         siteID,
         allowedUsers: requesterId // only current allowed users can add more
      });

      if (!site) {
         return res.status(403).json({ msg: 'No permission for this site' });
      }

      const user = await User.findOne({ email: userEmail.toLowerCase() });

      if (!user) {
         return res.status(404).json({ msg: 'User not found' });
      }

      const alreadyAllowed = site.allowedUsers.some(
         (id) => id.toString() === user._id.toString()
      );

      if (alreadyAllowed) {
         return res.status(400).json({ msg: 'User already has access' });
      }

      await Site.findByIdAndUpdate(site._id, {
         $addToSet: { allowedUsers: user._id }
      });

      res.json({ success: true });
   } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Invite error' });
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