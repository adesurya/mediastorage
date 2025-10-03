const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initDatabase } = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const videoRoutes = require('./routes/videoRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const ideaRoutes = require('./routes/ideaRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

initDatabase();

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(cookieParser());

// CORS untuk uploads - akses publik
app.use('/uploads', cors({
  origin: '*',
  methods: ['GET', 'HEAD', 'OPTIONS'],
  credentials: false
}));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/api/users', userRoutes);
app.use('/media', mediaRoutes);
app.use('/api/media', mediaRoutes);
app.use('/video', videoRoutes);
app.use('/api/video', videoRoutes);
app.use('/categories', categoryRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/idea', ideaRoutes);
app.use('/api/idea', ideaRoutes);

app.use('/favicon.ico', express.static(path.join(__dirname, 'public/favicon.ico')));

app.get('/', (req, res) => {
  req.session.userId ? res.redirect('/dashboard') : res.redirect('/auth/login');
});

app.get('/dashboard', (req, res) => {
  if (!req.session.userId) return res.redirect('/auth/login');
  res.redirect('/media');
});

app.use('/previews', (req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours cache
  res.setHeader('Expires', new Date(Date.now() + 86400000).toUTCString());
  next();
}, express.static(path.join(__dirname, 'public/previews')));


app.listen(PORT, () => {
  console.log(`Server: http://localhost:${PORT}`);
});