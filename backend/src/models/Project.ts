import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  title: string;
  description: string;
  deadline: Date;
  status: 'planning' | 'active' | 'review' | 'completed' | 'on-hold';
  priority: 'low' | 'medium' | 'high' | 'critical';
  teamId: mongoose.Types.ObjectId;
  managerId: mongoose.Types.ObjectId;
  progress: number;
  estimatedHours: number;
  actualHours: number;
  tags: string[];
  createdAt: Date;
}

const ProjectSchema = new Schema<IProject>({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  deadline: { type: Date, required: true },
  status: { type: String, enum: ['planning','active','review','completed','on-hold'], default: 'planning' },
  priority: { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
  managerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  estimatedHours: { type: Number, default: 0 },
  actualHours: { type: Number, default: 0 },
  tags: [{ type: String }],
}, { timestamps: true });

export default mongoose.model<IProject>('Project', ProjectSchema);
