import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'polling.db');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Initialize schema (3 database models: User, Poll, Option)
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS polls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    creator_phone TEXT NOT NULL,
    voters TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    poll_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    votes_count INTEGER DEFAULT 0,
    FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE
  );
`);

// Seed initial sample polls if empty for quick workshop demo
const pollCount = db.prepare('SELECT COUNT(*) as count FROM polls').get().count;
if (pollCount === 0) {
  const seedPoll1 = db.prepare(`
    INSERT INTO polls (question, creator_phone, voters)
    VALUES (?, ?, ?)
  `).run('What is your primary web stack for 2025/2026?', '+919999988888', JSON.stringify(['+919999988888']));

  const insertOption = db.prepare('INSERT INTO options (poll_id, text, votes_count) VALUES (?, ?, ?)');
  insertOption.run(seedPoll1.lastInsertRowid, 'React + Node.js (Express)', 14);
  insertOption.run(seedPoll1.lastInsertRowid, 'Next.js + TypeScript', 9);
  insertOption.run(seedPoll1.lastInsertRowid, 'Python (FastAPI / Django)', 6);
  insertOption.run(seedPoll1.lastInsertRowid, 'Go / Rust microservices', 3);

  const seedPoll2 = db.prepare(`
    INSERT INTO polls (question, creator_phone, voters)
    VALUES (?, ?, ?)
  `).run('Should AI assistants participate in pull request reviews?', '+919999977777', JSON.stringify(['+919999977777']));

  insertOption.run(seedPoll2.lastInsertRowid, 'Yes, absolutely - saves team review time', 18);
  insertOption.run(seedPoll2.lastInsertRowid, 'Only for syntax, lints, and test coverage', 12);
  insertOption.run(seedPoll2.lastInsertRowid, 'No, human-only reviews are better', 4);
}

// User model functions
export function findOrCreateUser(phone) {
  const existing = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
  if (existing) return existing;
  const info = db.prepare('INSERT INTO users (phone) VALUES (?)').run(phone);
  return db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
}

// Poll & Options functions
export function getAllPolls(pollId = null) {
  let polls;
  if (pollId) {
    const single = db.prepare('SELECT * FROM polls WHERE id = ?').get(pollId);
    polls = single ? [single] : [];
  } else {
    polls = db.prepare('SELECT * FROM polls ORDER BY created_at DESC').all();
  }

  const getOptions = db.prepare('SELECT * FROM options WHERE poll_id = ? ORDER BY id ASC');

  return polls.map((poll) => {
    const options = getOptions.all(poll.id);
    const voters = JSON.parse(poll.voters || '[]');
    const totalVotes = options.reduce((sum, opt) => sum + opt.votes_count, 0);

    return {
      id: poll.id,
      question: poll.question,
      creator_phone: poll.creator_phone,
      total_votes: totalVotes,
      voters_count: voters.length,
      voters: voters,
      created_at: poll.created_at,
      options: options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        votes_count: opt.votes_count,
        percentage: totalVotes > 0 ? Math.round((opt.votes_count / totalVotes) * 100) : 0
      }))
    };
  });
}

export function createPoll(question, optionTexts, creatorPhone) {
  const insertPoll = db.prepare(`
    INSERT INTO polls (question, creator_phone, voters)
    VALUES (?, ?, ?)
  `);

  const insertOption = db.prepare(`
    INSERT INTO options (poll_id, text, votes_count)
    VALUES (?, ?, 0)
  `);

  const transaction = db.transaction(() => {
    const pollResult = insertPoll.run(question.trim(), creatorPhone, JSON.stringify([]));
    const pollId = pollResult.lastInsertRowid;

    for (const text of optionTexts) {
      if (text && text.trim()) {
        insertOption.run(pollId, text.trim());
      }
    }
    return pollId;
  });

  return transaction();
}

export function castVote(pollId, optionId, voterPhone) {
  const poll = db.prepare('SELECT * FROM polls WHERE id = ?').get(pollId);
  if (!poll) {
    throw new Error('Poll not found');
  }

  const voters = JSON.parse(poll.voters || '[]');
  if (voters.includes(voterPhone)) {
    throw new Error('You have already voted on this poll');
  }

  const option = db.prepare('SELECT * FROM options WHERE id = ? AND poll_id = ?').get(optionId, pollId);
  if (!option) {
    throw new Error('Invalid option selected');
  }

  const updateVote = db.prepare('UPDATE options SET votes_count = votes_count + 1 WHERE id = ?');
  const updatePollVoters = db.prepare('UPDATE polls SET voters = ? WHERE id = ?');

  const transaction = db.transaction(() => {
    updateVote.run(optionId);
    voters.push(voterPhone);
    updatePollVoters.run(JSON.stringify(voters), pollId);
  });

  transaction();
  return true;
}

export default db;
