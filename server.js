const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const cors = require('cors');
const connectDB = require('./connection/db');
const cookieParser = require('cookie-parser');

dotenv.config();

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,https://inlyne-f.vercel.app')
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
app.use('/api/auth', authRoutes);

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
   console.log(`Server started on port ${PORT}`);
});