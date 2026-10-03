import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStravaAuth {
  athleteId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp in seconds
  scope: string;
}

export interface IUserDocument extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  weightKg: number;
  strava?: IStravaAuth;
  createdAt: Date;
  updatedAt: Date;
}

const StravaAuthSchema = new Schema<IStravaAuth>(
  {
    athleteId: { type: String, required: true },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    expiresAt: { type: Number, required: true },
    scope: { type: String, default: 'activity:write,read' },
  },
  { _id: false }
);

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    weightKg: { type: Number, default: 75, min: 20, max: 300 },
    strava: { type: StravaAuthSchema, default: undefined },
  },
  {
    timestamps: true,
  }
);

export const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);
