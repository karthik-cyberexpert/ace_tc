import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

const Login = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Authentication logic with redirection
    setTimeout(() => {
      if (email === 'admin@ace.edu' && password === 'admin123') {
        window.location.href = '/admin'
      } else if (email === 'office@ace.edu' && password === 'office123') {
        window.location.href = '/office'
      } else if (email === 'principal@ace.edu' && password === 'principal123') {
        window.location.href = '/principal'
      } else {
        setError('Invalid credentials.')
        setIsLoading(false)
      }
    }, 1200)
  }

  return (
    <div className="login-wrapper">
      {/* Background with Dark Overlay */}
      <div 
        className="login-background"
        style={{ backgroundImage: "url('/college.jpeg')" }}
      />
      <div className="login-overlay" />
      
      {/* Back Button */}
      <a href="/" className="back-btn-ghost">
        <ArrowLeft size={16} />
        Back to Home
      </a>

      <div className="glass-card-container">
        <div className="card-header">
          <h2>Sign-In</h2>
        </div>

        <form className="card-content" onSubmit={handleSubmit}>
          {error && <p style={{ color: '#fca5a5', fontSize: '13px', textAlign: 'center', margin: '0 0 10px 0' }}>{error}</p>}
          
          <div className="form-item">
            <label>Email</label>
            <input
              type="email"
              placeholder="your.email@example.com"
              className="glass-input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="form-item">
            <label>Password</label>
            <div className="input-group-relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="glass-input-field pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="input-eye-button"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-action-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .login-wrapper {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          position: relative;
          background: #000;
          overflow: hidden;
          font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
        }

        .login-background {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          opacity: 0.75;
          z-index: 0;
        }

        .login-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.2);
          z-index: 1;
        }

        .back-btn-ghost {
          position: absolute;
          top: 1rem;
          left: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          color: white;
          font-weight: 500;
          text-decoration: none;
          background: transparent;
          border-radius: 0.375rem;
          z-index: 10;
          font-size: 0.875rem;
        }

        @media (min-width: 768px) {
          .back-btn-ghost {
            top: 2rem;
            left: 2rem;
          }
        }

        .back-btn-ghost:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .glass-card-container {
          width: 100%;
          max-width: 448px; /* max-w-md */
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 0.75rem;
          padding: 2.5rem;
          z-index: 10;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          color: white;
        }

        .card-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .card-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
        }

        .card-content {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-item label {
          font-size: 0.875rem;
          font-weight: 500;
          color: white;
        }

        .input-group-relative {
          position: relative;
          display: flex;
          align-items: center;
        }

        .glass-input-field {
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.375rem;
          padding: 0.6rem 0.8rem;
          color: white;
          font-size: 0.875rem;
          outline: none;
          box-sizing: border-box;
        }

        .glass-input-field:focus {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .glass-input-field::placeholder {
          color: rgba(255, 255, 255, 0.8);
        }

        .input-eye-button {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 0;
          z-index: 5;
        }

        .input-eye-button:hover {
          color: white;
        }

        .login-action-btn {
          width: 100%;
          background: white;
          color: #0f172a; /* slate-900 */
          border: none;
          border-radius: 0.375rem;
          padding: 0.75rem;
          font-weight: 700;
          font-size: 0.875rem;
          cursor: pointer;
          margin-top: 1rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .login-action-btn:hover {
          background: rgba(255, 255, 255, 0.9);
        }

        .login-action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pr-10 { padding-right: 2.5rem; }
      `}} />
    </div>
  )
}

export default Login
