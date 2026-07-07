import { Schema, model, Document, Types } from 'mongoose';

export interface IFeedback extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  rating: number;
  message: string;
  createdAt: Date;
}

const feedbackSchema = new Schema<IFeedback>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default model<IFeedback>('Feedback', feedbackSchema);
