import React, { useState, useEffect } from 'react';
import { getPolls, castVote } from '../api';

export function PollDetailPage({ pollId, currentUser, onBack }) {
  const [poll, setPoll] = useState(null);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchPollDetail = async () => {
    try {
      const data = await getPolls(pollId);
      if (data.success && data.polls && data.polls.length > 0) {
        setPoll(data.polls[0]);
      } else {
        setError('Poll not found.');
      }
    } catch (err) {
      setError('Failed to fetch poll details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPollDetail();
  }, [pollId]);

  const handleVoteSubmit = async () => {
    if (!selectedOptionId) {
      setError('Please choose an option to vote.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const data = await castVote(pollId, selectedOptionId, currentUser.phone);
      if (data.success) {
        setSuccessMsg('Your vote was successfully recorded!');
        await fetchPollDetail();
      } else {
        setError(data.error || 'Failed to submit vote.');
      }
    } catch (err) {
      setError('Network error while casting vote.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
        Loading poll details...
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="empty-state">
        <h3>Poll Not Found</h3>
        <p>This poll might have been removed or does not exist.</p>
        <button className="btn btn-secondary" onClick={onBack}>
          ← Back to All Polls
        </button>
      </div>
    );
  }

  const hasVoted = poll.voters && poll.voters.includes(currentUser.phone);

  return (
    <div>
      <button
        id="btn-back-to-polls"
        className="btn btn-outline"
        style={{ marginBottom: '1.25rem' }}
        onClick={onBack}
      >
        ← Back to All Polls
      </button>

      <div className="detail-card">
        <div className="detail-header">
          <h2 className="detail-question">{poll.question}</h2>
          <div className="detail-meta">
            <span>👤 Author: {poll.creator_phone}</span>
            <span>•</span>
            <span>📊 Total Votes: <strong>{poll.total_votes}</strong></span>
            {hasVoted && (
              <>
                <span>•</span>
                <span className="voted-badge">✓ You Participated</span>
              </>
            )}
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {successMsg && <div className="alert alert-success">{successMsg}</div>}

        <div className="vote-options-list">
          {poll.options.map((option) => {
            const isSelected = selectedOptionId === option.id;

            return (
              <button
                key={option.id}
                id={`option-btn-${option.id}`}
                type="button"
                className={`vote-option-btn ${isSelected ? 'selected' : ''} ${
                  hasVoted ? 'voted-item' : ''
                }`}
                onClick={() => {
                  if (!hasVoted) {
                    setSelectedOptionId(option.id);
                  }
                }}
                disabled={hasVoted}
              >
                {/* Progress bar background for completed votes */}
                {hasVoted && (
                  <div
                    className="progress-fill"
                    style={{ width: `${option.percentage}%` }}
                  />
                )}

                <div className="option-content">
                  {!hasVoted && (
                    <div className="radio-circle">
                      {isSelected && <div className="radio-circle-inner" />}
                    </div>
                  )}
                  <span>{option.text}</span>
                </div>

                {hasVoted && (
                  <div className="option-stats">
                    <span>{option.votes_count} votes</span>
                    <span className="stat-percentage">{option.percentage}%</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {!hasVoted ? (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button
              id="btn-submit-vote"
              className="btn btn-primary"
              style={{ minWidth: '160px' }}
              onClick={handleVoteSubmit}
              disabled={submitting || !selectedOptionId}
            >
              {submitting ? 'Submitting...' : 'Submit Vote →'}
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--bg-card-border)'
            }}
          >
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Live results calculated across {poll.total_votes} total submissions
            </span>
            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
              onClick={fetchPollDetail}
            >
              🔄 Refresh Results
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
export default PollDetailPage;
