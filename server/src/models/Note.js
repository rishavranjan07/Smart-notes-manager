import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({ question: String, options: [String], answer: Number, explanation: String }, { _id: false });
const noteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  content: { type: String, default: '' },
  tags: [{ type: String, trim: true, lowercase: true }],
  folder: { type: String, enum: ['Study', 'Personal', 'Work', 'Fun'], default: 'Study' },
  source: { type: String, enum: ['manual', 'pdf'], default: 'manual' },
  summary: { type: String, default: '' },
  bulletPoints: { type: [String], default: [] },
  questions: { type: [questionSchema], default: [] }
}, { timestamps: true });
export default mongoose.model('Note', noteSchema);
