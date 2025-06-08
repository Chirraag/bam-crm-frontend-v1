import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';

const CalendarOAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = 'https://57b1b00a-4bf9-4306-873a-03f22b673287-00-ftagn6x1l8ri.pike.replit.dev/api/calendar';

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        setError('Authentication was cancelled or failed');
        setLoading(false);
        setTimeout(() => navigate('/calendar'), 3000);
        return;
      }

      if (!code) {
        setError('No authorization code received');
        setLoading(false);
        setTimeout(() => navigate('/calendar'), 3000);
        return;
      }

      try {
        // Try GET method first (direct URL callback)
        let response = await fetch(`${API_BASE}/oauth2callback?code=${encodeURIComponent(code)}`);
        
        // If GET fails, try POST method
        if (!response.ok) {
          response = await fetch(`${API_BASE}/oauth2callback`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code })
          });
        }

        if (response.ok) {
          const credentials = await response.json();
          localStorage.setItem('google_calendar_credentials', JSON.stringify(credentials));
          navigate('/calendar', { replace: true });
        } else {
          const errorData = await response.json().catch(() => ({ detail: 'Authentication failed' }));
          throw new Error(errorData.detail || 'Authentication failed');
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(err instanceof Error ? err.message : 'Failed to complete authentication');
        setLoading(false);
        setTimeout(() => navigate('/calendar'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      gap: 2
    }}>
      {loading ? (
        <>
          <CircularProgress size={50} />
          <Typography variant="h6">
            Completing authentication...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Processing authorization code from Google...
          </Typography>
        </>
      ) : error ? (
        <>
          <Alert severity="error" sx={{ mb: 2, maxWidth: 400 }}>
            {error}
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Redirecting to calendar in 3 seconds...
          </Typography>
        </>
      ) : (
        <Typography variant="h6">
          Authentication successful! Redirecting...
        </Typography>
      )}
    </Box>
  );
};

export default CalendarOAuthCallback;