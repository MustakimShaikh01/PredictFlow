import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'admin' | 'manager' | 'employee';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  experience: number;
  performanceScore: number;
  tasksCompleted: number;
  teamId?: mongoose.Types.ObjectId;
  isActive: boolean;
  refreshToken?: string;
  createdAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['admin', 'manager', 'employee'], default: 'employee' },
  avatar: { type: String },
  department: { type: String },
  experience: { type: Number, default: 0 },
  performanceScore: { type: Number, default: 0, min: 0, max: 100 },
  tasksCompleted: { type: Number, default: 0 },
  teamId: { type: Schema.Types.ObjectId, ref: 'Team' },
  isActive: { type: Boolean, default: true },
  refreshToken: { type: String },
}, { timestamps: true });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const { password, refreshToken, ...rest } = ret;
    return rest;
  }
});

export default mongoose.model<IUser>('User', UserSchema);
