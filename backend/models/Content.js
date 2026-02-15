import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const contentSchema = new mongoose.Schema({
  contentId: { type: String, required: true, unique: true, index: true },
  type: { type: String, required: true, enum: ['text', 'file'] },
  textContent: { type: String, required: function() { return this.type === 'text'; } },
  filePath: { type: String, required: function() { return this.type === 'file'; } },
  fileName: { type: String, required: function() { return this.type === 'file'; } },
  fileSize: { type: Number, required: function() { return this.type === 'file'; } },
  mimeType: { type: String, required: function() { return this.type === 'file'; } },
  createdAt: { type: Date, default: Date.now, index: true },
  expiresAt: { type: Date, required: true, index: true },
  viewCount: { type: Number, default: 0 },
  
  password: { type: String, default: null },
  isOneTimeView: { type: Boolean, default: false },
  maxViews: { type: Number, default: null },
  isDeleted: { type: Boolean, default: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  
}, { timestamps: true });

contentSchema.index({ expiresAt: 1 });
contentSchema.index({ userId: 1 });

contentSchema.pre('save', async function(next) {
  if (this.password && this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

contentSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return true;
  return await bcrypt.compare(candidatePassword, this.password);
};

contentSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

contentSchema.methods.isViewLimitReached = function() {
  if (!this.maxViews) return false;
  return this.viewCount >= this.maxViews;
};

contentSchema.statics.findByContentId = async function(contentId) {
  const content = await this.findOne({ contentId, isDeleted: false });
  
  if (!content) return null;
  if (content.isExpired()) return 'expired';
  if (content.isViewLimitReached()) return 'view_limit';
  
  return content;
};

export default mongoose.model('Content', contentSchema);
