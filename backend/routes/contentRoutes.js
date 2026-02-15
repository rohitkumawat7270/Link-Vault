import express from 'express';
import { uploadContent, getContent, downloadFile, deleteContent, getUserUploads } from '../controllers/contentController.js';
import upload from '../config/multer.js';
import { optionalAuth, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/upload', optionalAuth, upload.single('file'), uploadContent);
router.post('/content/:id', optionalAuth, getContent); // Changed to POST to accept password
router.get('/download/:id', downloadFile);
router.delete('/content/:id', protect, deleteContent); // Protected route
router.get('/my-uploads', protect, getUserUploads); // Protected route

export default router;