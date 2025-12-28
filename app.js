// app.js - FIXED VERSION
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const Persona = require('./models/Persona');
const ProductPromotion = require('./models/ProductPromotion');
const VideoAI = require('./models/VideoAI');
const ProductShot = require('./models/ProductShot');

require('dotenv').config();
const backgroundWorker = require('./backgroundWorker');
const { cleanupUploads } = require('./utils/fileCleanup');

const { initDatabase, promisePool } = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const videoRoutes = require('./routes/videoRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const ideaRoutes = require('./routes/ideaRoutes');
const personaRoutes = require('./routes/personaRoutes');
const productPromotionRoutes = require('./routes/productPromotionRoutes');
const videoAIRoutes = require('./routes/videoAIRoutes');
const productShotRoutes = require('./routes/productShotRoutes');

// Import trending video routes - FIXED
const initTrendingVideoRoutes = require('./routes/trendingVideoRoutes');
const initVideoPromptingRoutes = require('./routes/videoPromptingRoutes');
const initProductIdeaRoutes = require('./routes/productIdeaRoutes');
const videoGenerationRoutes = require('./routes/videoGenerationRoutes');
const aiInfluencerRoutes = require('./routes/aiInfluencerRoutes');
const AIInfluencerModel = require('./models/AIInfluencerModel');
const photoProductRoutes = require('./routes/photoProductRoutes');
const PhotoProductModel = require('./models/PhotoProductModel');
const photoStudioRoutes = require('./routes/photoStudioRoutes');
const PhotoStudioModel = require('./models/PhotoStudioModel');
const imageUpscaleRoutes = require('./routes/imageUpscaleRoutes');
const ImageUpscaleModel = require('./models/ImageUpscaleModel.js');
const removeBackgroundRoutes = require('./routes/removeBackgroundRoutes');
const RemoveBackgroundModel = require('./models/RemoveBackgroundModel.js');
const videoCustomRoutes = require('./routes/videoCustomRoutes');
const VideoCustomModel = require('./models/VideoCustomModel');

const app = express();
const PORT = process.env.PORT || 3000;

initDatabase();
const VideoGenerationModel = require('./models/VideoGenerationModel');


cron.schedule('0 2 * * *', async () => {
  console.log('🗑️ Running cleanup job for old images and videos...');
  try {
    // Existing model cleanups
    await Persona.deleteOldImages();
    await ProductPromotion.deleteOldImages();
    await VideoAI.deleteOldVideos();
    await ProductShot.deleteOldImages();
    
    // Cleanup expired video generations
    const videoGenModel = new VideoGenerationModel(promisePool);
    const deletedVideos = await videoGenModel.deleteExpired();
    console.log(`🗑️ Deleted ${deletedVideos} expired video generations`);
    
    // Cleanup expired AI Influencers
    const aiInfluencerModel = new AIInfluencerModel(promisePool);
    const deletedInfluencers = await aiInfluencerModel.deleteExpired();
    console.log(`🗑️ Deleted ${deletedInfluencers} expired AI Influencers`);
    
    // Cleanup expired Photo Products
    const photoProductModel = new PhotoProductModel(promisePool);
    const deletedProducts = await photoProductModel.deleteExpired();
    console.log(`🗑️ Deleted ${deletedProducts} expired Photo Products`);
    
    // Cleanup expired Photo Studios
    const photoStudioModel = new PhotoStudioModel(promisePool);
    const deletedStudios = await photoStudioModel.deleteExpired();
    console.log(`🗑️ Deleted ${deletedStudios} expired Photo Studios`);

    // Cleanup expired Image Upscales
    const imageUpscaleModel = new ImageUpscaleModel(promisePool);
    const deletedUpscales = await imageUpscaleModel.deleteExpired();
    console.log(`🗑️ Deleted ${deletedUpscales} expired Image Upscales`);

    // Cleanup expired Remove Backgrounds
    const removeBgModel = new RemoveBackgroundModel(promisePool);
    const deletedBackgrounds = await removeBgModel.deleteExpired();
    console.log(`🗑️ Deleted ${deletedBackgrounds} expired Remove Backgrounds`);
    
    const videoCustomModel = new VideoCustomModel(promisePool);
    const deletedCustomVideos = await videoCustomModel.deleteExpired();
    console.log(`🗑️ Deleted ${deletedCustomVideos} expired Video Custom`);

    // ✅ NEW: Cleanup expired Image Upscales (if installed)
    if (typeof ImageUpscaleModel !== 'undefined') {
      const imageUpscaleModel = new ImageUpscaleModel(promisePool);
      const deletedUpscales = await imageUpscaleModel.deleteExpired();
      console.log(`🗑️ Deleted ${deletedUpscales} expired Image Upscales`);
    }
    
    // ✅ NEW: Cleanup expired Remove Backgrounds (if installed)
    if (typeof RemoveBackgroundModel !== 'undefined') {
      const removeBgModel = new RemoveBackgroundModel(promisePool);
      const deletedBackgrounds = await removeBgModel.deleteExpired();
      console.log(`🗑️ Deleted ${deletedBackgrounds} expired Remove Backgrounds`);
    }
    
    // ============================================
    // ✅ NEW: General file cleanup (2-day retention)
    // ============================================
    console.log('');
    console.log('🧹 Running general file cleanup (2-day retention)...');
    const uploadCleanup = await cleanupUploads();
    console.log(`✅ Upload cleanup completed: ${uploadCleanup.filesDeleted} files deleted`);
    
    console.log('');
    console.log('✅ All cleanup tasks completed successfully');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
});

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

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

app.use('/uploads/video-custom/images', express.static(path.join(__dirname, 'uploads/video-custom/images')));
app.use('/uploads/video-custom/audio', express.static(path.join(__dirname, 'uploads/video-custom/audio')));

// Original routes
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
app.use('/persona', personaRoutes);
app.use('/api/persona', personaRoutes);
app.use('/promotion', productPromotionRoutes);
app.use('/api/promotion', productPromotionRoutes);
app.use('/video-ai', videoAIRoutes);
app.use('/api/video-ai', videoAIRoutes);
app.use('/product-shot', productShotRoutes);
app.use('/api/product-shot', productShotRoutes);

// Trending Videos routes - FIXED
app.use('/api/trending-videos', initTrendingVideoRoutes(promisePool));
app.use('/api/video-prompting', initVideoPromptingRoutes(promisePool));
app.use('/api/product-idea', initProductIdeaRoutes(promisePool));
app.use('/api/video-generation', videoGenerationRoutes(promisePool));
app.use('/api/ai-influencer', aiInfluencerRoutes(promisePool));
app.use('/api/photo-product', photoProductRoutes(promisePool));
app.use('/api/photo-studio', photoStudioRoutes(promisePool));
app.use('/api/image-upscale', imageUpscaleRoutes(promisePool));
app.use('/api/remove-background', removeBackgroundRoutes(promisePool));
app.use('/api/video-custom', videoCustomRoutes(promisePool));

app.use('/favicon.ico', express.static(path.join(__dirname, 'public/favicon.ico')));

app.get('/', (req, res) => {
  req.session.userId ? res.redirect('/trending-videos') : res.redirect('/auth/login');
});

// Redirect to trending videos after login
app.get('/dashboard', (req, res) => {
  if (!req.session.userId) return res.redirect('/auth/login');
  res.redirect('/trending-videos');
});

// Trending Videos page
app.get('/trending-videos', (req, res) => {
  if (!req.session.userId) return res.redirect('/auth/login');
  res.render('trending-videos', { 
    user: req.session.user || { username: 'User', role: 'user' },
    userId: req.session.userId 
  });
});

// Trending Video Idea Result page
app.get('/trending-video-idea-result', (req, res) => {
  if (!req.session.userId) return res.redirect('/auth/login');
  res.render('trending-video-idea-result', {
    user: req.session.user || { username: 'User', role: 'user' }
  });
});

app.get('/video-prompting', (req, res) => {
  if (!req.session.userId) return res.redirect('/auth/login');
  res.render('video-prompting', { 
    user: req.session.user || { username: 'User', role: 'user' }
  });
});

app.get('/video-prompting-result', (req, res) => {
  if (!req.session.userId) return res.redirect('/auth/login');
  res.render('video-prompting-result', {
    user: req.session.user || { username: 'User', role: 'user' }
  });
});

app.get('/product-idea', (req, res) => {
  if (!req.session.userId) return res.redirect('/auth/login');
  res.render('product-idea', { 
    user: req.session.user || { username: 'User', role: 'user' }
  });
});

app.get('/product-idea-result', (req, res) => {
  if (!req.session.userId) return res.redirect('/auth/login');
  res.render('product-idea-result', {
    user: req.session.user || { username: 'User', role: 'user' }
  });
});

app.get('/video-generation', (req, res) => {
  if (!req.session.userId) return res.redirect('/auth/login');
  res.render('video-generation', { 
    user: req.session.user || { username: 'User', role: 'user' }
  });
});

app.get('/video-generation-history', (req, res) => {
  if (!req.session.userId) return res.redirect('/auth/login');
  res.render('video-generation-history', {
    user: req.session.user || { username: 'User', role: 'user' }
  });
});

app.get('/ai-influencer', (req, res) => {
  if (!req.session.userId) return res.redirect('/auth/login');
  res.render('ai-influencer', { 
    user: req.session.user || { username: 'User', role: 'user' }
  });
});

app.get('/ai-influencer-history', (req, res) => {
  if (!req.session.userId) return res.redirect('/auth/login');
  res.render('ai-influencer-history', {
    user: req.session.user || { username: 'User', role: 'user' }
  });
});

app.get('/photo-product', (req, res) => {
  if (!req.session.userId) return res.redirect('/auth/login');
  res.render('photo-product', { 
    user: req.session.user || { username: 'User', role: 'user' },
    userId: req.session.userId 
  });
});

app.get('/photo-product-history', (req, res) => {
  if (!req.session.userId) return res.redirect('/auth/login');
  res.render('photo-product-history', {
    user: req.session.user || { username: 'User', role: 'user' }
  });
});

app.get('/photo-studio', (req, res) => {
  if (!req.session.userId) return res.redirect('/auth/login');
  res.render('photo-studio', { 
    user: req.session.user || { username: 'User', role: 'user' },
    userId: req.session.userId 
  });
});

// Photo Studio History page
app.get('/photo-studio-history', (req, res) => {
  if (!req.session.userId) return res.redirect('/auth/login');
  res.render('photo-studio-history', {
    user: req.session.user || { username: 'User', role: 'user' }
  });
});

// Image Upscale pages
app.get('/image-upscale', (req, res) => {
  if (!req.session.userId) return res.redirect('/auth/login');
  res.render('image-upscale', { 
    user: req.session.user || { username: 'User', role: 'user' },
    userId: req.session.userId 
  });
});

app.get('/image-upscale-history', (req, res) => {
  if (!req.session.userId) return res.redirect('/auth/login');
  res.render('image-upscale-history', {
    user: req.session.user || { username: 'User', role: 'user' }
  });
});

// Remove Background pages
app.get('/remove-background', (req, res) => {
  if (!req.session.userId) return res.redirect('/auth/login');
  res.render('remove-background', { 
    user: req.session.user || { username: 'User', role: 'user' },
    userId: req.session.userId 
  });
});

app.get('/remove-background-history', (req, res) => {
  if (!req.session.userId) return res.redirect('/auth/login');
  res.render('remove-background-history', {
    user: req.session.user || { username: 'User', role: 'user' }
  });
});

app.get('/video-custom', (req, res) => {
  if (!req.session.userId) return res.redirect('/auth/login');
  res.render('video-custom', { 
    user: req.session.user || { username: 'User', role: 'user' },
    userId: req.session.userId,
    currentPage: 'video-custom',  // ✅ Tambahkan ini
    voices: [
      { name: 'Moncus', voiceId: 'IfTf4aIKP5HWjtR9yPZ2' },
      { name: 'Selina', voiceId: 'WQ4h6sgS9p2XXvLsESBT' },
      { name: 'Citra', voiceId: 'RbNgJzKAV7jpYJNtCBpj' },
      { name: 'Livna', voiceId: 'GdyFAZdMpKMBHw5pc1Bu' },
      { name: 'Anjani', voiceId: '52LXmmR0nGnIcDs1TL3f' }
    ]
  });
});


app.get('/video-custom/history', async (req, res) => {
  if (!req.session.userId) return res.redirect('/auth/login');
  
  try {
    const VideoCustomModel = require('./models/VideoCustomModel');
    const model = new VideoCustomModel(promisePool);
    
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    const generations = await model.findByUserId(req.session.userId, limit, offset);
    const total = await model.countByUserId(req.session.userId);
    const totalPages = Math.ceil(total / limit);

    res.render('video-custom-history', {
      user: req.session.user || { username: 'User', role: 'user' },
      currentPage: 'video-custom-history',
      generations,
      currentPageNum: page,
      totalPages,
      hasMore: page < totalPages
    });
  } catch (error) {
    console.error('Error loading history:', error);
    res.status(500).send('Error loading history');
  }
});

app.use('/previews', (req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.setHeader('Expires', new Date(Date.now() + 86400000).toUTCString());
  next();
}, express.static(path.join(__dirname, 'public/previews')));

backgroundWorker.start();

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  backgroundWorker.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  backgroundWorker.stop();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`🔥 Trending Videos: http://localhost:${PORT}/trending-videos`);
});

module.exports = app;