import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export const connectDB = async (): Promise<void> => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ai_team_platform';
    await mongoose.connect(uri);
    logger.info('✅ MongoDB connected');
  } catch (err) {
    logger.error('❌ MongoDB connection failed:', err);
    process.exit(1);
  }
};
