import express from 'express';
import dotenv from 'dotenv';
import { findOrCreateUser, getAllPolls, createPoll, castVote } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const MINIMOTH_API_KEY = process.env.MINIMOTH_API_KEY || '';

// Basic middlewares
app.use(express.json());

// Lightweight CORS handling for direct API access
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Helper: normalize phone number to E.164 format
function normalizePhone(input) {
  if (!input) return '';
  const cleaned = input.toString().replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.length === 10) return `+91${cleaned}`;
  return `+${cleaned}`;
}

/* =========================================================
   ENDPOINT 1: POST /api/auth/send-otp
   Request OTP via Minimoth API
   ========================================================= */
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const rawPhone = req.body.phone;
    if (!rawPhone || typeof rawPhone !== 'string' || rawPhone.trim().length < 6) {
      return res.status(400).json({ success: false, error: 'A valid phone number is required.' });
    }

    const phone = normalizePhone(rawPhone);
    const isPlaceholderKey = !MINIMOTH_API_KEY || MINIMOTH_API_KEY.includes('your_minimoth_api_key');

    // If no real API key is configured yet in local workshop, allow demo sandbox fallback
    if (isPlaceholderKey) {
      console.log(`[MiniMoth Demo Mode] Sending OTP to ${phone}. Default sandbox code: 000000`);
      return res.json({
        success: true,
        phone,
        message: 'OTP sent! (Workshop demo mode active: use OTP 000000)',
        demoMode: true
      });
    }

    // Call Minimoth API
    const response = await fetch('https://api.minimoth.dev/v1/otp/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': MINIMOTH_API_KEY
      },
      body: JSON.stringify({ phone })
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data.message || data.error || 'Failed to send OTP via Minimoth API';
      return res.status(response.status).json({ success: false, error: errMsg });
    }

    const isSandboxKey = MINIMOTH_API_KEY.startsWith('mm_test_');

    return res.json({
      success: true,
      phone,
      message: isSandboxKey
        ? 'OTP generated in Minimoth sandbox! (Use code 000000)'
        : 'OTP sent successfully to your phone!',
      isSandbox: isSandboxKey
    });
  } catch (err) {
    console.error('Error sending OTP:', err);
    return res.status(500).json({ success: false, error: 'Internal server error while sending OTP.' });
  }
});

/* =========================================================
   ENDPOINT 2: POST /api/auth/verify-otp
   Verify OTP with Minimoth API and register / login user
   ========================================================= */
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { phone: rawPhone, code } = req.body;
    if (!rawPhone || !code) {
      return res.status(400).json({ success: false, error: 'Phone and OTP code are required.' });
    }

    const phone = normalizePhone(rawPhone);
    const trimmedCode = code.toString().trim();
    const isPlaceholderKey = !MINIMOTH_API_KEY || MINIMOTH_API_KEY.includes('your_minimoth_api_key');

    // Demo mode verification
    if (isPlaceholderKey) {
      if (trimmedCode !== '000000' && trimmedCode !== '123456') {
        return res.status(400).json({ success: false, error: 'Invalid OTP code in demo mode. Try 000000.' });
      }
      const user = findOrCreateUser(phone);
      return res.json({ success: true, user, message: 'Authenticated successfully (Demo Mode)' });
    }

    // Verify via Minimoth API
    const response = await fetch('https://api.minimoth.dev/v1/otp/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': MINIMOTH_API_KEY
      },
      body: JSON.stringify({ phone, code: trimmedCode })
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data.message || data.error || 'Invalid or expired OTP code.';
      return res.status(response.status).json({ success: false, error: errMsg });
    }

    // Register / login in our local database
    const user = findOrCreateUser(phone);

    return res.json({
      success: true,
      user,
      session: data.access_token || null,
      message: 'Logged in successfully!'
    });
  } catch (err) {
    console.error('Error verifying OTP:', err);
    return res.status(500).json({ success: false, error: 'Internal server error while verifying OTP.' });
  }
});

/* =========================================================
   ENDPOINT 3: GET /api/polls
   Retrieve all polls (or single poll if ?id= is given)
   ========================================================= */
app.get('/api/polls', (req, res) => {
  try {
    const pollId = req.query.id ? parseInt(req.query.id, 10) : null;
    const polls = getAllPolls(pollId);
    return res.json({ success: true, polls });
  } catch (err) {
    console.error('Error fetching polls:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch polls.' });
  }
});

/* =========================================================
   ENDPOINT 4: POST /api/polls
   Create a new poll with question & options
   ========================================================= */
app.post('/api/polls', (req, res) => {
  try {
    const { question, options, creatorPhone } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length < 5) {
      return res.status(400).json({ success: false, error: 'Question must be at least 5 characters long.' });
    }

    if (!Array.isArray(options) || options.filter((o) => typeof o === 'string' && o.trim()).length < 2) {
      return res.status(400).json({ success: false, error: 'Please provide at least 2 non-empty options.' });
    }

    if (!creatorPhone) {
      return res.status(401).json({ success: false, error: 'Creator phone is required. Please login.' });
    }

    const pollId = createPoll(question, options, creatorPhone);
    return res.status(201).json({ success: true, pollId, message: 'Poll created successfully!' });
  } catch (err) {
    console.error('Error creating poll:', err);
    return res.status(500).json({ success: false, error: 'Failed to create poll.' });
  }
});

/* =========================================================
   ENDPOINT 5: POST /api/polls/:id/vote
   Cast a vote on a poll option
   ========================================================= */
app.post('/api/polls/:id/vote', (req, res) => {
  try {
    const pollId = parseInt(req.params.id, 10);
    const { optionId, voterPhone } = req.body;

    if (!pollId || isNaN(pollId)) {
      return res.status(400).json({ success: false, error: 'Invalid poll ID.' });
    }

    if (!optionId) {
      return res.status(400).json({ success: false, error: 'Please select an option to vote.' });
    }

    if (!voterPhone) {
      return res.status(401).json({ success: false, error: 'You must be logged in with your phone to vote.' });
    }

    castVote(pollId, parseInt(optionId, 10), voterPhone);
    return res.json({ success: true, message: 'Your vote has been cast successfully!' });
  } catch (err) {
    const isConflict = err.message && err.message.includes('already voted');
    const statusCode = isConflict ? 409 : 400;
    return res.status(statusCode).json({ success: false, error: err.message || 'Failed to submit vote.' });
  }
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`Polling Backend running on http://localhost:${PORT}`);
  console.log(`MiniMoth API Key status: ${MINIMOTH_API_KEY ? 'Configured' : 'Missing (Using demo fallback)'}`);
});
