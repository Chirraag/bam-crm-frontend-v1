import { useState } from 'react';
import { 
  Typography, 
  Box, 
  Card, 
  CardContent,
  Paper,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  LinearProgress,
  Avatar,
  useTheme,
  IconButton,
  Grid,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Send as SendIcon,
  Settings as SettingsIcon,
  ChatBubble as ChatBubbleIcon,
  RecordVoiceOver as RecordVoiceOverIcon,
  Delete as DeleteIcon,
  QuestionAnswer as QuestionAnswerIcon,
  SmartToy as SmartToyIcon
} from '@mui/icons-material';
import Layout from '../components/Layout';

const VoiceBot = () => {
  const theme = useTheme();
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I'm your virtual legal assistant. How can I help you today?", isUser: false, timestamp: '10:30 AM' },
  ]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleSendMessage = () => {
    if (inputText.trim()) {
      // Add user message
      const userMessage = {
        id: messages.length + 1,
        text: inputText,
        isUser: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages([...messages, userMessage]);
      setInputText('');
      setIsProcessing(true);
      
      // Simulate bot processing and response
      setTimeout(() => {
        const botResponses = {
          "legal advice": "I can provide general legal information, but for specific legal advice regarding your case, you should consult with your attorney directly.",
          "appointment": "I can help you schedule an appointment. Please provide your preferred date and time, and I'll check the availability.",
          "documents": "You can upload documents through the messaging system, and they will be securely stored and reviewed by your attorney.",
          "case status": "To check your case status, I need to access your case information. Please provide your case reference number.",
          "court date": "I can provide information about your upcoming court dates. Let me check the schedule for you."
        };
        
        let botResponse = "I'm not sure how to help with that. Would you like me to connect you with your attorney?";
        
        // Simple keyword matching
        for (const [keyword, response] of Object.entries(botResponses)) {
          if (userMessage.text.toLowerCase().includes(keyword)) {
            botResponse = response;
            break;
          }
        }
        
        const botMessage = {
          id: messages.length + 2,
          text: botResponse,
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        setMessages(prevMessages => [...prevMessages, botMessage]);
        setIsProcessing(false);
      }, 1500);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const toggleRecording = () => {
    setIsRecording(!isRecording);
    
    if (!isRecording) {
      // Simulate voice recording
      setTimeout(() => {
        setIsRecording(false);
        setInputText("Can you help me check my case status?");
      }, 3000);
    }
  };
  
  const handleClearChat = () => {
    setMessages([
      { id: 1, text: "Hello! I'm your virtual legal assistant. How can I help you today?", isUser: false, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ]);
  };

  return (
    <Layout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="500" sx={{ mb: 1 }}>
          Voice Bot
        </Typography>
        <Typography color="text.secondary">
          Interact with our AI legal assistant
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper 
            elevation={0} 
            sx={{ 
              height: 'calc(100vh - 240px)', 
              borderRadius: 2, 
              border: '1px solid rgba(0, 0, 0, 0.12)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Box sx={{ 
              p: 2, 
              borderBottom: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar 
                  sx={{ 
                    bgcolor: theme.palette.primary.main,
                    mr: 2
                  }}
                >
                  <SmartToyIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    Legal Assistant
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    AI-powered voice and text bot
                  </Typography>
                </Box>
              </Box>
              <IconButton onClick={handleClearChat}>
                <DeleteIcon />
              </IconButton>
            </Box>
            
            <Box sx={{ 
              flex: 1, 
              p: 2,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}>
              {messages.map((message) => (
                <Box
                  key={message.id}
                  sx={{
                    display: 'flex',
                    justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                  }}
                >
                  {!message.isUser && (
                    <Avatar 
                      sx={{ 
                        width: 36, 
                        height: 36, 
                        mr: 1,
                        bgcolor: theme.palette.primary.main
                      }}
                    >
                      <SmartToyIcon fontSize="small" />
                    </Avatar>
                  )}
                  <Box sx={{ maxWidth: '70%' }}>
                    <Box
                      sx={{
                        bgcolor: message.isUser ? 'primary.main' : 'grey.100',
                        color: message.isUser ? 'white' : 'text.primary',
                        p: 1.5,
                        borderRadius: 2,
                        borderTopRightRadius: message.isUser ? 0 : 2,
                        borderTopLeftRadius: message.isUser ? 2 : 0,
                      }}
                    >
                      <Typography variant="body1">
                        {message.text}
                      </Typography>
                    </Box>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        display: 'block', 
                        mt: 0.5, 
                        color: 'text.secondary',
                        textAlign: message.isUser ? 'right' : 'left'
                      }}
                    >
                      {message.timestamp}
                    </Typography>
                  </Box>
                  {message.isUser && (
                    <Avatar 
                      sx={{ 
                        width: 36, 
                        height: 36, 
                        ml: 1,
                        bgcolor: theme.palette.primary.dark
                      }}
                    >
                      <ChatBubbleIcon fontSize="small" />
                    </Avatar>
                  )}
                </Box>
              ))}
              
              {isProcessing && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Avatar 
                    sx={{ 
                      width: 36, 
                      height: 36, 
                      mr: 1,
                      bgcolor: theme.palette.primary.main
                    }}
                  >
                    <SmartToyIcon fontSize="small" />
                  </Avatar>
                  <Box sx={{ width: 60 }}>
                    <LinearProgress />
                  </Box>
                </Box>
              )}
            </Box>
            
            <Box sx={{ 
              p: 2, 
              borderTop: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              alignItems: 'center'
            }}>
              <IconButton 
                color={isRecording ? "error" : "default"} 
                onClick={toggleRecording}
                sx={{ mr: 1 }}
              >
                {isRecording ? <MicOffIcon /> : <MicIcon />}
              </IconButton>
              <TextField
                placeholder="Type your message..."
                variant="outlined"
                fullWidth
                multiline
                maxRows={3}
                size="small"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isRecording}
              />
              <IconButton 
                sx={{ ml: 1 }} 
                color="primary"
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isProcessing}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.12)', mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <QuestionAnswerIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                <Typography variant="h6" component="h2" fontWeight="500">
                  Suggested Queries
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <List dense>
                {[
                  "What's the status of my case?",
                  "I need legal advice about my contract",
                  "When is my next court date?",
                  "Can you schedule an appointment with my lawyer?",
                  "How do I upload documents for my case?"
                ].map((query, index) => (
                  <ListItem 
                    key={index}
                    button
                    onClick={() => setInputText(query)}
                    sx={{ 
                      borderRadius: 1,
                      mb: 0.5,
                      '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.08)' },
                    }}
                  >
                    <ListItemText primary={query} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
          
          <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.12)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SettingsIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                <Typography variant="h6" component="h2" fontWeight="500">
                  Settings
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <List>
                <ListItem>
                  <ListItemIcon>
                    <RecordVoiceOverIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Voice Recognition" 
                    secondary="Enable voice input for the assistant"
                  />
                  <Switch defaultChecked />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <SmartToyIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Auto-Suggestions" 
                    secondary="Show suggestions based on context"
                  />
                  <Switch defaultChecked />
                </ListItem>
                <ListItem>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Save chat history"
                    sx={{ ml: 0 }}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Layout>
  );
};

export default VoiceBot;