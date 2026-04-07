import { ArrowLeft, Eye, EyeOff, ShieldCheck, Lock, Shield, ChevronRight } from 'lucide-react'
import { useState } from 'react'

const Login = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isBoarding, setIsBoarding] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [userId, setUserId] = useState(null)
  const [tempUser, setTempUser] = useState(null)

    const handleSubmit = async (e) => {
      e.preventDefault()
      setIsLoading(true)
      setError('')

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (data.success) {
        if (data.onboarding) {
          setUserId(data.id);
          setTempUser(data);
          setIsBoarding(true);
          setIsLoading(false);
          return;
        }
        localStorage.setItem('user', JSON.stringify(data));
        window.location.href = `/${data.role.toLowerCase()}`;
      } else {
        setError(data.message || 'Invalid credentials');
        setIsLoading(false);
      }
    } catch (err) {
      setError('Server error. Please try again.');
      setIsLoading(false);
    }
  }

  const handleOnboard = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}/onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      });
      const data = await response.json();
      if (data.success) {
        const finalUser = { ...tempUser, onboarding: false };
        localStorage.setItem('user', JSON.stringify(finalUser));
        window.location.href = `/${finalUser.role.toLowerCase()}`;
      }
    } catch (err) {
      setError('Sync failed. Please try again.');
      setIsLoading(false);
    }
  }

  return (
    <div className="login-container">
      <div className="top-nav">
        <a href="/" className="back-link">
          <ArrowLeft size={16} />
          <span>Back to home</span>
        </a>
      </div>

      <div className="login-card card">
        {!isBoarding ? (
          <>
            <div className="login-header" style={{ marginBottom: '2rem' }}>
              <h1>Welcome Back</h1>
              <p className="text-muted" style={{ fontSize: '14px' }}>Enter your credentials to access your dashboard</p>
            </div>

            <form onSubmit={handleSubmit}>
              {error && <div className="error-alert">{error}</div>}
              
              <div className="form-group">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Email Address</label>
                <input
                  id="email"
                  type="email"
                  className="input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  style={{ height: '48px', borderRadius: '10px' }}
                  required
                />
              </div>

              <div className="form-group" style={{ marginTop: '1.25rem' }}>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    style={{ paddingRight: '40px', height: '48px', borderRadius: '10px' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="eye-toggle"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '2rem', height: '52px', fontWeight: '600', borderRadius: '10px' }}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Sign in to Portal'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="login-header" style={{ marginBottom: '2rem', textAlign: 'left' }}>
              <h1 style={{ color: '#0f172a', fontSize: '20px', fontWeight: '700' }}>Account Authority</h1>
              <p className="text-muted" style={{ fontSize: '14px', lineHeight: '1.5' }}>Synchronize your personal credentials to finalize your institutional authorization.</p>
            </div>

            <form onSubmit={handleOnboard}>
              {error && <div className="error-alert" style={{ marginBottom: '1.5rem' }}>{error}</div>}
              
              <div className="form-group">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">New Institutional Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                  style={{ height: '48px', borderRadius: '10px' }}
                  required
                />
              </div>

              <div className="form-group" style={{ marginTop: '1.25rem' }}>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Confirm Institutional Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Re-enter to confirm"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  style={{ height: '48px', borderRadius: '10px' }}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '2rem', height: '52px', fontWeight: '600', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                disabled={isLoading}
              >
                {isLoading ? 'Synchronizing Credentials...' : (
                  <>
                    <span>Complete Authorization</span>
                    <ChevronRight size={18} />
                  </>
                )}
              </button>
              
              <p className="text-center text-xs text-slate-400 mt-6 pt-6" style={{ borderTop: '1px solid #f1f5f9' }}>
                Mandatory institutional security measure for record access.
              </p>
            </form>
          </>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .login-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background-color: #f8fafc;
          padding: 24px;
          position: relative;
        }

        .top-nav {
          position: absolute;
          top: 32px;
          left: 32px;
        }

        .login-card {
          width: 100%;
          max-width: 400px;
        }

        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .login-header h1 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 0.5rem;
        }

        .error-alert {
          background: #fef2f2;
          color: #991b1b;
          padding: 10px;
          border-radius: 6px;
          font-size: 0.875rem;
          margin-bottom: 1rem;
          text-align: center;
          border: 1px solid #fee2e2;
        }

        .eye-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          padding: 0;
        }

        .login-footer {
          margin-top: 2rem;
          text-align: center;
          border-top: 1px solid #f1f5f9;
          padding-top: 1.5rem;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #64748b;
          text-decoration: none;
          font-size: 0.875rem;
          transition: color 0.2s;
        }

        .back-link:hover {
          color: #0f172a;
        }
      `}} />
    </div>
  )
}

export default Login
