import { nanoid } from 'nanoid';
import Content from '../models/Content.js';
import fs from 'fs';

export const uploadContent = async (req, res) => {
  try {
    const { text, expiryMinutes, password, isOneTimeView, maxViews } = req.body;
    const file = req.file;

    if ((!text && !file) || (text && file)) {
      return res.status(400).json({ success: false, message: 'Provide either text or file, not both' });
    }

    const contentId = nanoid(10);
    const expiryDuration = expiryMinutes ? parseInt(expiryMinutes) : 10;
    const expiresAt = new Date(Date.now() + expiryDuration * 60 * 1000);

    let contentData = { 
      contentId, 
      expiresAt, 
      createdAt: new Date(),
      userId: req.user ? req.user._id : null
    };

    if (password && password.trim()) {
      contentData.password = password.trim();
    }
    if (isOneTimeView === 'true' || isOneTimeView === true) {
      contentData.isOneTimeView = true;
    }
    if (maxViews && parseInt(maxViews) > 0) {
      contentData.maxViews = parseInt(maxViews);
    }

    if (text) {
      if (!text.trim()) return res.status(400).json({ success: false, message: 'Text cannot be empty' });
      contentData = { ...contentData, type: 'text', textContent: text.trim() };
    }

    if (file) {
      contentData = {
        ...contentData,
        type: 'file',
        filePath: file.path,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype
      };
    }

    const content = await new Content(contentData).save();

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    res.status(201).json({
      success: true,
      message: 'Content uploaded',
      data: {
        contentId: content.contentId,
        url: `${process.env.FRONTEND_URL || baseUrl.replace(/:\\d+$/, ':5173')}/view/${content.contentId}`,
        type: content.type,
        expiresAt: content.expiresAt,
        expiresIn: `${expiryDuration} minutes`,
        hasPassword: !!content.password,
        isOneTimeView: content.isOneTimeView,
        maxViews: content.maxViews
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    const message = process.env.NODE_ENV === 'production'
      ? 'Upload failed'
      : `Upload failed: ${error.message || 'Unknown error'}`;
    res.status(500).json({ success: false, message });
  }
};

export const getContent = async (req, res) => {
  try {
    const { password } = req.body;
    const result = await Content.findByContentId(req.params.id);

    if (!result) return res.status(404).json({ success: false, message: 'Not found' });
    if (result === 'expired') return res.status(410).json({ success: false, message: 'Expired' });
    if (result === 'view_limit') return res.status(410).json({ success: false, message: 'View limit reached' });

    if (result.password) {
      if (!password) {
        return res.status(401).json({ 
          success: false, 
          message: 'Password required',
          requiresPassword: true 
        });
      }

      const isPasswordValid = await result.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ 
          success: false, 
          message: 'Incorrect password',
          requiresPassword: true 
        });
      }
    }

    if (result.type === 'text') {
      if (result.isOneTimeView && result.viewCount > 0) {
        return res.status(410).json({ success: false, message: 'This content was set for one-time view only' });
      }
      result.viewCount += 1;
      if (result.isOneTimeView) {
        result.isDeleted = true;
      }
      await result.save();
    } else {
      if (result.isOneTimeView && result.viewCount > 0) {
        return res.status(410).json({ success: false, message: 'This file was set for one-time download only' });
      }
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const data = {
      contentId: result.contentId,
      type: result.type,
      createdAt: result.createdAt,
      expiresAt: result.expiresAt,
      viewCount: result.viewCount,
      maxViews: result.maxViews,
      isOneTimeView: result.isOneTimeView,
      canDelete: req.user && result.userId && req.user._id.equals(result.userId) // Can delete if owner
    };

    if (result.type === 'text') {
      data.textContent = result.textContent;
    } else {
      data.fileName = result.fileName;
      data.fileSize = result.fileSize;
      data.mimeType = result.mimeType;
      data.downloadUrl = `${baseUrl}/api/download/${result.contentId}`;
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Retrieval failed' });
  }
};

export const downloadFile = async (req, res) => {
  try {
    const result = await Content.findByContentId(req.params.id);

    if (!result) return res.status(404).json({ success: false, message: 'Not found' });
    if (result === 'expired') return res.status(410).json({ success: false, message: 'Expired' });
    if (result === 'view_limit') return res.status(410).json({ success: false, message: 'View limit reached' });
    if (result.type !== 'file') return res.status(400).json({ success: false, message: 'Not a file' });

    if (!result.filePath || !fs.existsSync(result.filePath)) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    if (result.isOneTimeView && result.viewCount > 0) {
      return res.status(410).json({ success: false, message: 'This file was set for one-time download only' });
    }
    if (result.maxViews && result.viewCount >= result.maxViews) {
      return res.status(410).json({ success: false, message: 'View limit reached' });
    }

    result.viewCount += 1;
    if (result.isOneTimeView || (result.maxViews && result.viewCount >= result.maxViews)) {
      result.isDeleted = true;
    }
    await result.save();

    res.setHeader('Content-Type', result.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.fileName)}"`);

    const stream = fs.createReadStream(result.filePath);
    stream.on('error', (err) => {
      console.error('Download stream error:', err.message);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Download failed' });
      } else {
        res.destroy();
      }
    });
    stream.pipe(res);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Download failed' });
  }
};

export const deleteContent = async (req, res) => {
  try {
    const content = await Content.findOne({ contentId: req.params.id });

    if (!content) return res.status(404).json({ success: false, message: 'Not found' });

    if (!req.user || !content.userId || !req.user._id.equals(content.userId)) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this content' });
    }

    content.isDeleted = true;
    await content.save();

    res.json({ success: true, message: 'Content deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
};

export const getUserUploads = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const uploads = await Content.find({ 
      userId: req.user._id, 
      isDeleted: false 
    }).sort({ createdAt: -1 });

    res.json({ success: true, data: uploads });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch uploads' });
  }
};
