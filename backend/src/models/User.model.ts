import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'USER' | 'ADMIN';

export interface IUser extends Document {
  clerkId: string;            // Clerk user id
  email: string;
  name?: string;
  imageUrl?: string;
  role: UserRole;
  status: 'active' | 'disabled';
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, index: true },
    name: String,
    imageUrl: String,
    role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
    status: { type: String, enum: ['active', 'disabled'], default: 'active' },
    lastLoginAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
