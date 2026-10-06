import mongoose from 'mongoose';

const attemptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  note: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', required: true, index: true },
  questions: [{ question: String, options: [String], answer: Number, explanation: String }],
  selectedAnswers: [{ type: Number, min: 0, max: 3 }],
  correctAnswers: { type: Number, required: true, min: 0 },
  totalQuestions: { type: Number, required: true, min: 1 },
  score: { type: Number, required: true, min: 0 },
  percentage: { type: Number, required: true, min: 0, max: 100 }
}, { timestamps: true });
export default mongoose.model('QuizAttempt', attemptSchema);
