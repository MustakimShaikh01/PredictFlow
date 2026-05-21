import mongoose, { Document, Schema } from 'mongoose';

export interface ISubtask {
  _id?: mongoose.Types.ObjectId;
  title: string;
  completed: boolean;
  completedAt?: Date;
  assignedTo?: mongoose.Types.ObjectId;
}

export interface IAttachment {
  _id?: mongoose.Types.ObjectId;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
}

export interface ITimeLog {
  _id?: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  hours: number;
  date: Date;
  description: string;
}

export interface IActivityLog {
  _id?: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  action: string; // 'created', 'updated', 'commented', 'status_changed', etc
  changes: Record<string, any>;
  createdAt: Date;
}

export interface ITask extends Document {
  title: string;
  description: string;
  projectId: mongoose.Types.ObjectId;
  assignedTo: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  status: 'todo' | 'in-progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  complexity: 'easy' | 'medium' | 'hard' | 'extreme';
  storyPoints?: number;
  estimatedHours: number;
  actualHours: number;
  deadline: Date;
  startDate?: Date;
  completedAt?: Date;
  tags: string[];
  watchers: mongoose.Types.ObjectId[];
  comments: Array<{ user: mongoose.Types.ObjectId; text: string; createdAt: Date }>;
  subtasks: ISubtask[];
  attachments: IAttachment[];
  timeLogs: ITimeLog[];
  activityLogs: IActivityLog[];
  blockedBy?: mongoose.Types.ObjectId[];
  blocks?: mongoose.Types.ObjectId[];
  labels: string[];
  isRecurring: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  customFields?: Record<string, any>;
  progress: number;
  completionPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['todo','in-progress','review','completed'], default: 'todo' },
  priority: { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  complexity: { type: String, enum: ['easy','medium','hard','extreme'], default: 'medium' },
  storyPoints: { type: Number, min: 0 },
  estimatedHours: { type: Number, default: 0 },
  actualHours: { type: Number, default: 0 },
  deadline: { type: Date, required: true },
  startDate: { type: Date },
  completedAt: { type: Date },
  tags: [{ type: String }],
  watchers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    text: { type: String },
    createdAt: { type: Date, default: Date.now },
  }],
  subtasks: [{
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  }],
  attachments: [{
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSize: { type: Number },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedAt: { type: Date, default: Date.now },
  }],
  timeLogs: [{
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    hours: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    description: { type: String },
  }],
  activityLogs: [{
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    changes: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
  }],
  blockedBy: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
  blocks: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
  labels: [{ type: String }],
  isRecurring: { type: Boolean, default: false },
  recurringPattern: { type: String, enum: ['daily','weekly','biweekly','monthly'] },
  customFields: { type: Schema.Types.Mixed, default: {} },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
}, { timestamps: true });

// Index for better query performance
TaskSchema.index({ projectId: 1, status: 1 });
TaskSchema.index({ assignedTo: 1, status: 1 });
TaskSchema.index({ priority: 1, deadline: 1 });
TaskSchema.index({ watchers: 1 });

export default mongoose.model<ITask>('Task', TaskSchema);
