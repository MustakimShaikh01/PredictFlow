import mongoose, { Document, Schema } from 'mongoose';

export interface ITeam extends Document {
  name: string;
  description: string;
  managerId: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  department: string;
  createdAt: Date;
}

const TeamSchema = new Schema<ITeam>({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  managerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  department: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model<ITeam>('Team', TeamSchema);
