import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'

const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes in ms

const ProtectedRoute = ({ element, allowedRole }) => {
  const [timedOut, setTimedOut] = useState(false);
  const timerRef = useRef(null);

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      localStorage.removeItem('user');
      localStorage.removeItem('sessionStart');
      setTimedOut(true);
    }, INACTIVITY_LIMIT);
  };

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (timedOut || !user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRole && user.role?.toLowerCase() !== allowedRole.toLowerCase()) {
    return <Navigate to="/" replace />;
  }

  return element;
};

export default ProtectedRoute;
