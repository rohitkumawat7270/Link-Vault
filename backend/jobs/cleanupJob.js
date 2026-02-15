import cron from 'node-cron';
import Content from '../models/Content.js';
import fs from 'fs';

const cleanupExpiredContent = () => {
  cron.schedule('*/5 * * * *', async () => {
    try {
      console.log('🧹 Cleaning expired content...');
      
      const expired = await Content.find({ expiresAt: { $lt: new Date() } });
      if (expired.length === 0) {
        console.log('✅ No expired content');
        return;
      }

      console.log(`📋 Found ${expired.length} expired items`);

      for (const content of expired) {
        if (content.type === 'file' && content.filePath && fs.existsSync(content.filePath)) {
          fs.unlinkSync(content.filePath);
          console.log(`🗑️  Deleted: ${content.filePath}`);
        }
        await Content.deleteOne({ _id: content._id });
      }

      console.log('✅ Cleanup complete');
    } catch (error) {
      console.error('❌ Cleanup error:', error.message);
    }
  });

  console.log('⏰ Cleanup job scheduled (every 5 min)');
};

export default cleanupExpiredContent;