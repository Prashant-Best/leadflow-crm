import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

// Reads a one-time message passed through navigation state
// (e.g. navigate('/leads', { state: { flash: 'Lead deleted' } })) and then
// clears it from history so it does not reappear on refresh.
export function useFlashMessage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [flash, setFlash] = useState(location.state?.flash || '');

  useEffect(() => {
    if (location.state?.flash) {
      setFlash(location.state.flash);
      navigate(location.pathname + location.search, { replace: true, state: null });
    }
  }, [location, navigate]);

  return [flash, setFlash];
}
