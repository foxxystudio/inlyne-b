const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const cors = require('cors');
const connectDB = require('./connection/db');
const cookieParser = require('cookie-parser');

dotenv.config();

const app = express();

const allowedOrigins = ['http://localhost:3000', 'https://senin-domain.com'];

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

app.listen(5000, () => console.log('Server started on port 5000.'));