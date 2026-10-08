import React, { useState } from 'react';
import { sendOtp, verifyOtp } from '../api';

export function AuthPage({ onLoginSuccess }) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1 = Phone input, 2 = OTP input
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');

    if (!phone || phone.trim().length < 8) {
      setError('Please enter a valid phone number with area/country code.');
      return;
    }

    setLoading(true);
    try {
      const data = await sendOtp(phone);
      if (data.success) {
        setStep(2);
        setInfoMsg(data.message || 'OTP sent successfully!');
      } else {
        setError(data.error || 'Failed to send OTP.');
      }
    } catch (err) {
      setError('Network error. Make sure the backend server is running on port 5001.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');

    if (!otp || otp.trim().length < 4) {
      setError('Please enter the OTP received.');
      return;
    }

    setLoading(true);
    try {
      const data = await verifyOtp(phone, otp);
      if (data.success && data.user) {
        onLoginSuccess(data.user);
      } else {
        setError(data.error || 'Invalid OTP code.');
      }
    } catch (err) {
      setError('Network error verifying OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Online Polling System</h1>
          <p>Instant polls with passwordless phone authentication</p>
          <div className="badge-minimoth">
            <span>⚡ Powered by Minimoth OTP</span>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {infoMsg && <div className="alert alert-success">{infoMsg}</div>}

        {step === 1 ? (
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label className="form-label" htmlFor="phone-input">
                Mobile Phone Number
              </label>
              <input
                id="phone-input"
                type="tel"
                className="form-input"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </div>

            <button
              id="send-otp-btn"
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={loading}
            >
              {loading ? 'Sending OTP...' : 'Send Verification OTP →'}
            </button>

            <div className="demo-hint">
              💡 <strong>Workshop Sandbox:</strong> If testing locally without SMS credits, default OTP is <code>000000</code>.
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label className="form-label" htmlFor="otp-input">
                Enter 6-Digit Verification Code
              </label>
              <input
                id="otp-input"
                type="text"
                className="form-input input-otp"
                maxLength={6}
                placeholder="······"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </div>

            <button
              id="verify-otp-btn"
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify & Enter Polling System'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                onClick={() => {
                  setStep(1);
                  setOtp('');
                  setError('');
                }}
              >
                ← Change Number
              </button>

              <button
                type="button"
                className="btn btn-outline"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                onClick={handleSendOtp}
                disabled={loading}
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
export default AuthPage;
