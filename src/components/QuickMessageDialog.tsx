import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import { Send as SendIcon, Sms as SmsIcon } from '@mui/icons-material';
import { Client } from '../types/client';
import { messageService } from '../utils/api';

interface QuickMessageDialogProps {
  open: boolean;
  onClose: () => void;
  client: Client | null;
}

const QuickMessageDialog = ({ open, onClose, client }: QuickMessageDialogProps) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!message.trim() || !client) return;

    try {
      setSending(true);
      setError(null);
      
      await messageService.sendMessage(
        client.id!.toString(),
        message.trim()
      );
      
      setSuccess(true);
      setMessage('');
      
      // Auto close after success
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    if (!sending) {
      setMessage('');
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSend();
    }
  };

  if (!client) return null;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SmsIcon color="primary" />
          <Typography variant="h6">Send Message</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          To: {client.first_name} {client.last_name}
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Chip 
            label={client.primary_phone || 'No phone number'} 
            size="small" 
            color={client.primary_phone ? "primary" : "error"}
            variant="outlined"
          />
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Message sent successfully!
          </Alert>
        )}

        {!client.primary_phone ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            This client doesn't have a phone number. Please add one before sending messages.
          </Alert>
        ) : (
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Type your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sending || success}
            sx={{ mb: 1 }}
          />
        )}
        
        <Typography variant="caption" color="text.secondary">
          Tip: Press Ctrl+Enter to send quickly
        </Typography>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={handleClose} 
          disabled={sending}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSend}
          variant="contained"
          startIcon={sending ? <CircularProgress size={16} /> : <SendIcon />}
          disabled={!message.trim() || sending || !client.primary_phone || success}
        >
          {sending ? 'Sending...' : 'Send Message'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuickMessageDialog;