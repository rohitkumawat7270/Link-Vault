import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/database.js';
import contentRoutes from './routes/contentRoutes.js';
import authRoutes from './routes/authRoutes.js';
import cleanupExpiredContent from './jobs/cleanupJob.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

connectDB();
cleanupExpiredContent();

const corsOptions = process.env.NODE_ENV === 'production'
  ? { origin: process.env.FRONTEND_URL, credentials: true }
  : { origin: true, credentials: true };
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'LinkVault running - All Features Enabled!' });
});

app.use('/api', contentRoutes);
app.use('/api/auth', authRoutes);
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('🚀 LinkVault - ALL FEATURES ENABLED!');
  console.log('═══════════════════════════════════════════');
  console.log(`📍 Port: ${PORT}`);
  console.log(`✅ Password protection`);
  console.log(`✅ One-time view`);
  console.log(`✅ Max view count`);
  console.log(`✅ Manual delete`);
  console.log(`✅ User authentication`);
  console.log('═══════════════════════════════════════════');
  console.log('');
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Error:', err.message);
});
