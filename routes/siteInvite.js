const express = require('express');
const Site = require('../models/Sites');
const SiteInvite = require('../models/SiteInvite');
const sendMail = require('../utils/sendMail'); // senin mail helper
const crypto = require('crypto');
const { sendSiteInviteLink } = require('../utils/sendMail');

const router = express.Router();

router.post('/:siteID/invite', async (req, res) => {
   const { email, role } = req.body;
   const { siteID } = req.params;

   try {
      const site = await Site.findOne({
         siteID,
         allowedUsers: req.user.id // sadece yetkililer invite atabilir
      });

      if (!site) {
         return res.status(403).json({ msg: 'No permission' });
      }

      // zaten davetli mi?
      const alreadyInvited = await SiteInvite.findOne({
         site: site._id,
         email,
         accepted: false
      });

      if (alreadyInvited) {
         return res.status(400).json({ msg: 'User already invited' });
      }

      const token = crypto.randomBytes(32).toString('hex');

      const invite = await SiteInvite.create({
         site: site._id,
         email,
         token,
         role,
         expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24) // 24 saat
      });

      await sendSiteInviteLink(email, token);

      res.json({ success: true });

   } catch (err) {
      res.status(500).json({ msg: 'Invite error' });
   }
});

module.exports = router;