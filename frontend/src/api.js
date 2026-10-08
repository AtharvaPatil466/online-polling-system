const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
  : '';

export async function sendOtp(phone) {
  const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone })
  });
  return res.json();
}

export async function verifyOtp(phone, code) {
  const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code })
  });
  return res.json();
}

export async function getPolls(pollId = null) {
  const url = pollId ? `${API_BASE}/api/polls?id=${pollId}` : `${API_BASE}/api/polls`;
  const res = await fetch(url);
  return res.json();
}

export async function createPoll(question, options, creatorPhone) {
  const res = await fetch(`${API_BASE}/api/polls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, options, creatorPhone })
  });
  return res.json();
}

export async function castVote(pollId, optionId, voterPhone) {
  const res = await fetch(`${API_BASE}/api/polls/${pollId}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ optionId, voterPhone })
  });
  return res.json();
}
