require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./connection/db');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const siteRoutes = require('./routes/site');
const commentRoutes = require('./routes/comment');
const path = require('path');

const app = express();

// Trust proxy - DigitalOcean/Nginx arkasında çalışıyorsak gerekli
app.set('trust proxy', 1);

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

// 🔥 DEBUG MIDDLEWARE — BURAYA
app.use((req, res, next) => {
   console.log("NODE_ENV:", process.env.NODE_ENV);
   console.log("SECURE?", req.secure);
   console.log("XFP:", req.headers["x-forwarded-proto"]);
   next();
});

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/auth', authRoutes);
app.use('/api/site', siteRoutes);
app.use('/api/comment', commentRoutes);

connectDB();

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
   res.send('Hello World');
});

app.listen(PORT, () => {
   console.log(`Server started on port ${PORT}`);
});