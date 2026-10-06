import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import noteRoutes from './routes/notes.js';
const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes); app.use('/api/notes', noteRoutes);
app.use((err, _, res, __) => {
  console.error(err);
  const status = Number(err.status || err.code) || 500;
  const message = status === 503 ? 'Gemini is temporarily busy. Please try again in a minute.' : (err.message || 'Something went wrong.');
  res.status(status).json({ message });
});

const required = ['MONGODB_URI', 'JWT_SECRET'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`API configuration missing: ${missing.join(', ')}. Copy server/.env.example to server/.env and set these values.`);
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
  .then(() => app.listen(process.env.PORT || 5000, '127.0.0.1', () => console.log(`API running at http://127.0.0.1:${process.env.PORT || 5000}`)))
  .catch((err) => { console.error(`MongoDB connection failed: ${err.message}`); process.exit(1); });
