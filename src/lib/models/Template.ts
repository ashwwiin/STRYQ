import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITemplateExercise {
  name: string;
  isCompound: boolean;
  defaultSets: number;
  defaultWeightKg: number;
  defaultReps: number;
}

export interface ITemplateDocument extends Document {
  userId: mongoose.Types.ObjectId | string;
  name: string;
  category: string;
  notes?: string;
  exercises: ITemplateExercise[];
  createdAt: Date;
  updatedAt: Date;
}

const TemplateExerciseSchema = new Schema<ITemplateExercise>(
  {
    name: { type: String, required: true },
    isCompound: { type: Boolean, default: false },
    defaultSets: { type: Number, default: 3, min: 1, max: 20 },
    defaultWeightKg: { type: Number, default: 60, min: 0, max: 600 },
    defaultReps: { type: Number, default: 8, min: 1, max: 100 },
  },
  { _id: false }
);

const TemplateSchema = new Schema<ITemplateDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, default: 'Custom', trim: true },
    notes: { type: String, default: '' },
    exercises: [TemplateExerciseSchema],
  },
  {
    timestamps: true,
  }
);

TemplateSchema.index({ userId: 1, createdAt: -1 });

export const Template: Model<ITemplateDocument> =
  mongoose.models.Template || mongoose.model<ITemplateDocument>('Template', TemplateSchema);
