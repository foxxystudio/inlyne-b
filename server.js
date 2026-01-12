const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./connection/db');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const siteRoutes = require('./routes/site');
const path = require('path');

dotenv.config();

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,https://app.inlyne.ai,https://inlyne.ai')
   .split(',')
   .map(o => o.trim().replace(/\/$/, '')) // trim and drop trailing slash
   .filter(Boolean);

app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(cors({
   origin: (origin, callback) => {
      if (allowedOrigins.includes(origin) || !origin) {
         callback(null, true);
      } else {
         callback(new Error('Not allowed by CORS'));
      }
   },
   credentials: true,
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/auth', authRoutes);
app.use('/api/site', siteRoutes);

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
   console.log(`Server started on port ${PORT}`);
});