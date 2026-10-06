import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWorkoutSet {
  setNumber: number;
  weightKg: number;
  reps: number;
  est1RM: number;
  completed: boolean;
}

export interface IWorkoutExercise {
  name: string;
  isCompound: boolean;
  sets: IWorkoutSet[];
}

export interface IWorkoutDocument extends Document {
  userId: mongoose.Types.ObjectId | string;
  title: string;
  durationSeconds: number;
  totalVolumeKg: number;
  caloriesBurned: number;
  exercises: IWorkoutExercise[];
  stravaActivityId?: string;
  syncedToStrava: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WorkoutSetSchema = new Schema<IWorkoutSet>(
  {
    setNumber: { type: Number, required: true },
    weightKg: { type: Number, required: true, min: 0, max: 600 },
    reps: { type: Number, required: true, min: 0, max: 100 },
    est1RM: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const WorkoutExerciseSchema = new Schema<IWorkoutExercise>(
  {
    name: { type: String, required: true },
    isCompound: { type: Boolean, default: false },
    sets: [WorkoutSetSchema],
  },
  { _id: false }
);

const WorkoutSchema = new Schema<IWorkoutDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, default: 'STRYQ Strength Session' },
    durationSeconds: { type: Number, required: true, min: 0 },
    totalVolumeKg: { type: Number, required: true, min: 0 },
    caloriesBurned: { type: Number, required: true, min: 0 },
    exercises: [WorkoutExerciseSchema],
    stravaActivityId: { type: String },
    syncedToStrava: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

WorkoutSchema.index({ userId: 1, createdAt: -1 });

export const Workout: Model<IWorkoutDocument> =
  mongoose.models.Workout || mongoose.model<IWorkoutDocument>('Workout', WorkoutSchema);
