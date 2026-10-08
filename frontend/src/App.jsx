import React, { useState, useEffect } from 'react';
import AuthPage from './pages/AuthPage';
import PollsPage from './pages/PollsPage';
import PollDetailPage from './pages/PollDetailPage';

export function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('polling_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [currentPage, setCurrentPage] = useState('polls'); // 'polls' | 'detail'
  const [selectedPollId, setSelectedPollId] = useState(null);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('polling_user', JSON.stringify(user));
    setCurrentPage('polls');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('polling_user');
    setSelectedPollId(null);
    setCurrentPage('polls');
  };

  const handleSelectPoll = (pollId) => {
    setSelectedPollId(pollId);
    setCurrentPage('detail');
  };

  const handleBackToPolls = () => {
    setSelectedPollId(null);
    setCurrentPage('polls');
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <header className="navbar">
        <div className="nav-brand" onClick={handleBackToPolls}>
          <div className="brand-icon">🗳️</div>
          <span className="brand-title">Online Polling System</span>
        </div>

        {currentUser && (
          <div className="nav-actions">
            <div className="user-badge" title="Authenticated via Minimoth">
              <span className="status-dot" />
              <span>{currentUser.phone}</span>
            </div>
            <button
              id="logout-btn"
              className="btn btn-outline"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
              onClick={handleLogout}
            >
              Sign Out
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="content-wrapper">
        {!currentUser ? (
          <AuthPage onLoginSuccess={handleLoginSuccess} />
        ) : currentPage === 'detail' && selectedPollId ? (
          <PollDetailPage
            pollId={selectedPollId}
            currentUser={currentUser}
            onBack={handleBackToPolls}
          />
        ) : (
          <PollsPage
            currentUser={currentUser}
            onSelectPoll={handleSelectPoll}
          />
        )}
      </main>
    </div>
  );
}

export default App;
