import mongoose, { Document, Schema } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description: string;
  projectId: mongoose.Types.ObjectId;
  assignedTo: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  status: 'todo' | 'in-progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedHours: number;
  actualHours: number;
  deadline: Date;
  completedAt?: Date;
  tags: string[];
  comments: Array<{ user: mongoose.Types.ObjectId; text: string; createdAt: Date }>;
  createdAt: Date;
}

const TaskSchema = new Schema<ITask>({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['todo','in-progress','review','completed'], default: 'todo' },
  priority: { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  estimatedHours: { type: Number, default: 0 },
  actualHours: { type: Number, default: 0 },
  deadline: { type: Date, required: true },
  completedAt: { type: Date },
  tags: [{ type: String }],
  comments: [{
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    text: { type: String },
    createdAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

export default mongoose.model<ITask>('Task', TaskSchema);
