import React, { useState, useEffect } from 'react';
import { getPolls, createPoll } from '../api';

export function PollsPage({ currentUser, onSelectPoll }) {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create Poll state
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState(['', '']);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const fetchAllPolls = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getPolls();
      if (data.success) {
        setPolls(data.polls);
      } else {
        setError(data.error || 'Failed to load polls.');
      }
    } catch (err) {
      setError('Could not connect to backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPolls();
  }, []);

  const handleAddOptionField = () => {
    if (newOptions.length < 6) {
      setNewOptions([...newOptions, '']);
    }
  };

  const handleOptionChange = (index, value) => {
    const updated = [...newOptions];
    updated[index] = value;
    setNewOptions(updated);
  };

  const handleRemoveOptionField = (index) => {
    if (newOptions.length > 2) {
      setNewOptions(newOptions.filter((_, i) => i !== index));
    }
  };

  const handleCreatePollSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (!newQuestion.trim() || newQuestion.trim().length < 5) {
      setCreateError('Poll question must be at least 5 characters.');
      return;
    }

    const validOptions = newOptions.map((o) => o.trim()).filter(Boolean);
    if (validOptions.length < 2) {
      setCreateError('Please provide at least 2 distinct options.');
      return;
    }

    setCreating(true);
    try {
      const data = await createPoll(newQuestion, validOptions, currentUser.phone);
      if (data.success) {
        setNewQuestion('');
        setNewOptions(['', '']);
        setShowCreateModal(false);
        await fetchAllPolls();
        if (data.pollId) {
          onSelectPoll(data.pollId);
        }
      } else {
        setCreateError(data.error || 'Failed to create poll.');
      }
    } catch (err) {
      setCreateError('Network error while creating poll.');
    } finally {
      setCreating(false);
    }
  };

  const filteredPolls = polls.filter((p) =>
    p.question.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Active Community Polls</h1>
          <p className="page-subtitle">Cast your vote or create your own topic</p>
        </div>
        <button
          id="btn-create-poll-modal"
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          + Create Poll
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="search-bar">
        <span style={{ color: 'var(--text-dim)' }}>🔍</span>
        <input
          id="search-polls-input"
          type="text"
          className="search-input"
          placeholder="Search polls by question..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading community polls...
        </div>
      ) : filteredPolls.length === 0 ? (
        <div className="empty-state">
          <h3>No polls found</h3>
          <p>
            {searchQuery
              ? 'No polls match your search query.'
              : 'Be the first to launch a question for the community!'}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            Create the First Poll
          </button>
        </div>
      ) : (
        <div className="polls-grid">
          {filteredPolls.map((poll) => {
            const hasVoted = poll.voters && poll.voters.includes(currentUser.phone);
            return (
              <div
                key={poll.id}
                className="poll-card"
                onClick={() => onSelectPoll(poll.id)}
              >
                <div className="poll-card-header">
                  <h3 className="poll-question">{poll.question}</h3>
                  {hasVoted ? (
                    <span className="voted-badge">✓ You Voted</span>
                  ) : (
                    <span className="option-pill" style={{ color: 'var(--accent)' }}>
                      Vote Now →
                    </span>
                  )}
                </div>

                <div className="poll-options-preview">
                  {poll.options.map((opt) => (
                    <span key={opt.id} className="option-pill">
                      {opt.text} {hasVoted ? `(${opt.percentage}%)` : ''}
                    </span>
                  ))}
                </div>

                <div className="poll-meta">
                  <span>📊 {poll.total_votes} {poll.total_votes === 1 ? 'vote' : 'votes'}</span>
                  <span>•</span>
                  <span>Created by {poll.creator_phone}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Poll Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Poll</h2>
              <button
                className="btn-close"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>

            {createError && <div className="alert alert-error">{createError}</div>}

            <form onSubmit={handleCreatePollSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="new-poll-question">
                  Poll Question / Topic
                </label>
                <input
                  id="new-poll-question"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Which cloud database do you prefer?"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Poll Options (at least 2)</label>
                {newOptions.map((opt, idx) => (
                  <div key={idx} className="option-input-row">
                    <input
                      id={`poll-option-input-${idx}`}
                      type="text"
                      className="form-input"
                      placeholder={`Option ${idx + 1}`}
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                    />
                    {newOptions.length > 2 && (
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ padding: '0.6rem 0.8rem' }}
                        onClick={() => handleRemoveOptionField(idx)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {newOptions.length < 6 && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: '100%', marginBottom: '1.25rem', fontSize: '0.82rem' }}
                  onClick={handleAddOptionField}
                >
                  + Add Another Option
                </button>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  id="submit-create-poll-btn"
                  type="submit"
                  className="btn btn-primary"
                  disabled={creating}
                >
                  {creating ? 'Publishing...' : 'Publish Poll'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default PollsPage;
