import { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { 
  Box,
  Typography,
  Button,
  IconButton,
  Paper,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  useTheme,
  Chip,
  Avatar,
  Divider,
  Stack,
  Fade,
  alpha
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccessTime,
  LocationOn,
  People,
  Event as EventIcon,
  Today as TodayIcon,
  CalendarMonth,
  Schedule,
  Logout as LogoutIcon
} from '@mui/icons-material';
import Layout from '../components/Layout';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO, isToday, startOfWeek, endOfWeek } from 'date-fns';
import { calendarService } from '../services/calendarService';

const Calendar = () => {
  const theme = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [eventForm, setEventForm] = useState({
    summary: '',
    description: '',
    location: '',
    start: {
      dateTime: new Date().toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    end: {
      dateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    attendees: [] as { email: string }[]
  });

  // Check for existing authentication on component mount
  useEffect(() => {
    checkExistingAuth();
  }, []);

  const checkExistingAuth = async () => {
    try {
      setCheckingAuth(true);
      
      // Check for stored credentials
      const storedCredentials = localStorage.getItem('google_calendar_credentials');
      
      if (storedCredentials) {
        const credentials = JSON.parse(storedCredentials);
        
        // Check if token is still valid (not expired)
        if (credentials.expiry && new Date(credentials.expiry) > new Date()) {
          await calendarService.initClient();
          calendarService.setToken(credentials.token);
          setIsAuthenticated(true);
          loadEvents();
          setError(null);
        } else {
          // Token expired, remove from storage
          localStorage.removeItem('google_calendar_credentials');
        }
      }
    } catch (error) {
      console.error('Error checking existing auth:', error);
      localStorage.removeItem('google_calendar_credentials');
    } finally {
      setCheckingAuth(false);
    }
  };

  const login = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        await calendarService.initClient();
        calendarService.setToken(response.access_token);
        
        // Store credentials with expiry time
        const credentials = {
          token: response.access_token,
          expiry: new Date(Date.now() + (response.expires_in * 1000)).toISOString(),
          scope: response.scope
        };
        
        localStorage.setItem('google_calendar_credentials', JSON.stringify(credentials));
        
        setIsAuthenticated(true);
        loadEvents();
        setError(null);
      } catch (error) {
        console.error('Error during login:', error);
        setError('Failed to authenticate with Google Calendar');
      }
    },
    onError: () => {
      setError('Google login failed');
    },
    scope: 'https://www.googleapis.com/auth/calendar',
  });

  const logout = () => {
    localStorage.removeItem('google_calendar_credentials');
    calendarService.setToken('');
    setIsAuthenticated(false);
    setEvents([]);
    setError(null);
  };

  const loadEvents = async () => {
    try {
      setLoading(true);
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const events = await calendarService.listEvents(monthStart, monthEnd);
      setEvents(events || []);
      setError(null);
    } catch (error) {
      console.error('Load events error:', error);
      
      // If we get an auth error, clear stored credentials and force re-auth
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        localStorage.removeItem('google_calendar_credentials');
        setIsAuthenticated(false);
        setError('Authentication expired. Please reconnect your calendar.');
      } else {
        setError('Failed to load calendar events');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadEvents();
    }
  }, [isAuthenticated, currentDate]);

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = event.start.dateTime 
        ? parseISO(event.start.dateTime)
        : parseISO(event.start.date);
      return isSameDay(eventDate, date);
    });
  };

  const handleEventSubmit = async () => {
    try {
      setLoading(true);
      if (editingEvent) {
        await calendarService.updateEvent(editingEvent.id, eventForm);
      } else {
        await calendarService.createEvent(eventForm);
      }
      await loadEvents();
      setEventDialogOpen(false);
      setEditingEvent(null);
      resetEventForm();
      setError(null);
    } catch (error) {
      setError(`Failed to ${editingEvent ? 'update' : 'create'} event`);
      console.error('Event submit error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventDelete = async (eventId: string) => {
    try {
      setLoading(true);
      await calendarService.deleteEvent(eventId);
      await loadEvents();
      setError(null);
    } catch (error) {
      setError('Failed to delete event');
      console.error('Delete event error:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEventDialog = (event?: any) => {
    if (event) {
      setEditingEvent(event);
      setEventForm({
        summary: event.summary || '',
        description: event.description || '',
        location: event.location || '',
        start: event.start,
        end: event.end,
        attendees: event.attendees || []
      });
    } else {
      setEditingEvent(null);
      resetEventForm();
    }
    setEventDialogOpen(true);
  };

  const resetEventForm = () => {
    setEventForm({
      summary: '',
      description: '',
      location: '',
      start: {
        dateTime: new Date().toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      attendees: []
    });
  };

  const formatEventTime = (event: any) => {
    if (event.start.dateTime && event.end.dateTime) {
      const start = new Date(event.start.dateTime);
      const end = new Date(event.end.dateTime);
      return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
    }
    return 'All day';
  };

  const eventColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ];

  const getEventColor = (eventId: string) => {
    const hash = eventId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return eventColors[hash % eventColors.length];
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    
    const monthName = format(currentDate, 'MMMM yyyy');
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    return (
      <Card 
        elevation={0} 
        sx={{ 
          borderRadius: '24px',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          overflow: 'hidden'
        }}
      >
        {/* Calendar Header */}
        <Box sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          p: 3
        }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CalendarMonth sx={{ fontSize: 32 }} />
              <Typography variant="h4" component="h2" fontWeight="600">
                {monthName}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button 
                variant="outlined" 
                size="medium"
                startIcon={<TodayIcon />}
                onClick={() => {
                  setCurrentDate(new Date());
                  setSelectedDate(new Date());
                }}
                sx={{ 
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: 'white',
                  borderRadius: '12px',
                  '&:hover': {
                    borderColor: 'rgba(255,255,255,0.5)',
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                Today
              </Button>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton 
                  size="medium" 
                  onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                  sx={{ 
                    color: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.2)'
                    }
                  }}
                >
                  <ChevronLeft />
                </IconButton>
                <IconButton 
                  size="medium" 
                  onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                  sx={{ 
                    color: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.2)'
                    }
                  }}
                >
                  <ChevronRight />
                </IconButton>
              </Box>
              
              {isAuthenticated && (
                <>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => openEventDialog()}
                    sx={{ 
                      bgcolor: 'white',
                      color: '#667eea',
                      borderRadius: '12px',
                      fontWeight: 600,
                      ml: 2,
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.9)'
                      }
                    }}
                  >
                    New Event
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<LogoutIcon />}
                    onClick={logout}
                    sx={{ 
                      borderColor: 'rgba(255,255,255,0.3)',
                      color: 'white',
                      borderRadius: '12px',
                      ml: 1,
                      '&:hover': {
                        borderColor: 'rgba(255,255,255,0.5)',
                        backgroundColor: 'rgba(255,255,255,0.1)'
                      }
                    }}
                  >
                    Disconnect
                  </Button>
                </>
              )}
            </Box>
          </Box>
        </Box>

        {/* Days of Week Header */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}>
          {daysOfWeek.map(day => (
            <Box 
              key={day} 
              sx={{ 
                p: 2, 
                textAlign: 'center',
                backgroundColor: alpha(theme.palette.primary.main, 0.05)
              }}
            >
              <Typography 
                variant="subtitle2" 
                fontWeight="600" 
                color="primary.main"
              >
                {day}
              </Typography>
            </Box>
          ))}
        </Box>
        
        {/* Calendar Grid */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)',
        }}>
          {calendarDays.map((day, index) => {
            const dayEvents = getEventsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isSelected = isSameDay(day, selectedDate);
            const isTodayDate = isToday(day);
            
            return (
              <Box 
                key={day.toISOString()}
                sx={{ 
                  minHeight: 120,
                  p: 1.5,
                  borderRight: index % 7 !== 6 ? `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none',
                  borderBottom: index < calendarDays.length - 7 ? `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none',
                  backgroundColor: isSelected 
                    ? alpha(theme.palette.primary.main, 0.1)
                    : isTodayDate 
                    ? alpha(theme.palette.warning.main, 0.05)
                    : 'transparent',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: isSelected 
                      ? alpha(theme.palette.primary.main, 0.15)
                      : alpha(theme.palette.action.hover, 0.5),
                    transform: 'translateY(-1px)'
                  }
                }}
                onClick={() => setSelectedDate(day)}
              >
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1
                }}>
                  <Typography 
                    variant="body1"
                    sx={{ 
                      fontWeight: isTodayDate ? 700 : isSelected ? 600 : 400,
                      color: !isCurrentMonth 
                        ? theme.palette.text.disabled 
                        : isTodayDate 
                        ? theme.palette.warning.main
                        : isSelected
                        ? theme.palette.primary.main
                        : theme.palette.text.primary,
                      fontSize: '1rem'
                    }}
                  >
                    {format(day, 'd')}
                  </Typography>
                  
                  {isTodayDate && (
                    <Box sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: theme.palette.warning.main
                    }} />
                  )}
                </Box>
                
                <Stack spacing={0.5}>
                  {dayEvents.slice(0, 3).map(event => (
                    <Chip
                      key={event.id}
                      label={event.summary}
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEventDialog(event);
                      }}
                      sx={{
                        backgroundColor: getEventColor(event.id),
                        color: 'white',
                        fontSize: '0.7rem',
                        height: 20,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        '& .MuiChip-label': {
                          px: 1,
                          fontWeight: 500
                        },
                        '&:hover': {
                          transform: 'scale(1.02)',
                          boxShadow: `0 2px 8px ${alpha(getEventColor(event.id), 0.4)}`
                        }
                      }}
                    />
                  ))}
                  
                  {dayEvents.length > 3 && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: theme.palette.text.secondary,
                        fontWeight: 500,
                        fontSize: '0.7rem'
                      }}
                    >
                      +{dayEvents.length - 3} more
                    </Typography>
                  )}
                </Stack>
              </Box>
            );
          })}
        </Box>
      </Card>
    );
  };

  // Show loading state while checking existing auth
  if (checkingAuth) {
    return (
      <Layout>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '70vh'
        }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return (
      <Layout>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '70vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
          <Fade in timeout={800}>
            <Card sx={{ 
              p: 6, 
              textAlign: 'center', 
              maxWidth: 500,
              borderRadius: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
            }}>
              <Box sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '50%',
                width: 80,
                height: 80,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3
              }}>
                <EventIcon sx={{ fontSize: 40, color: 'white' }} />
              </Box>
              
              <Typography variant="h4" gutterBottom fontWeight="600">
                Connect Your Calendar
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
                Seamlessly integrate with Google Calendar to view, create, and manage all your events in one beautiful interface.
              </Typography>
              
              <Button
                variant="contained"
                onClick={() => login()}
                disabled={loading}
                size="large"
                sx={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '12px',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 10px 20px rgba(102, 126, 234, 0.3)'
                  }
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Connect Google Calendar'}
              </Button>
            </Card>
          </Fade>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3, 
            borderRadius: '12px',
            border: 'none'
          }} 
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}
      
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <CircularProgress size={32} />
        </Box>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} lg={9}>
          {renderCalendar()}
        </Grid>
        
        <Grid item xs={12} lg={3}>
          <Card 
            elevation={0} 
            sx={{ 
              borderRadius: '24px', 
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              height: 'fit-content',
              position: 'sticky',
              top: 24
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2, 
                mb: 3 
              }}>
                <Avatar sx={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  width: 48,
                  height: 48
                }}>
                  <Schedule />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="600">
                    {format(selectedDate, 'EEEE')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {format(selectedDate, 'MMMM d, yyyy')}
                  </Typography>
                </Box>
              </Box>
              
              <Divider sx={{ mb: 3 }} />
              
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 2 
              }}>
                <Typography variant="subtitle1" fontWeight="600" color="text.primary">
                  Today's Events
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => openEventDialog()}
                  size="small"
                  sx={{ 
                    color: '#667eea',
                    fontWeight: 600,
                    borderRadius: '8px'
                  }}
                >
                  Add
                </Button>
              </Box>
              
              <Stack spacing={2}>
                {getEventsForDate(selectedDate).map(event => (
                  <Paper
                    key={event.id}
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: '12px',
                      border: `2px solid ${getEventColor(event.id)}20`,
                      backgroundColor: `${getEventColor(event.id)}10`,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: `0 4px 12px ${alpha(getEventColor(event.id), 0.2)}`
                      }
                    }}
                  >
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start',
                      mb: 1
                    }}>
                      <Typography variant="subtitle2" fontWeight="600" sx={{ flex: 1 }}>
                        {event.summary}
                      </Typography>
                      <Box>
                        <IconButton 
                          size="small" 
                          onClick={() => openEventDialog(event)}
                          sx={{ p: 0.5 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleEventDelete(event.id)}
                          sx={{ p: 0.5 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTime fontSize="small" sx={{ color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {formatEventTime(event)}
                        </Typography>
                      </Box>
                      
                      {event.location && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationOn fontSize="small" sx={{ color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {event.location}
                          </Typography>
                        </Box>
                      )}
                      
                      {event.attendees && event.attendees.length > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <People fontSize="small" sx={{ color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </Paper>
                ))}
                
                {getEventsForDate(selectedDate).length === 0 && (
                  <Box sx={{ 
                    textAlign: 'center', 
                    py: 4,
                    color: 'text.secondary'
                  }}>
                    <Schedule sx={{ fontSize: 48, mb: 2, opacity: 0.3 }} />
                    <Typography variant="body2">
                      No events scheduled
                    </Typography>
                    <Typography variant="caption">
                      Click "Add" to create your first event
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog 
        open={eventDialogOpen} 
        onClose={() => setEventDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          fontWeight: 600
        }}>
          {editingEvent ? 'Edit Event' : 'Create New Event'}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Event Title"
              value={eventForm.summary}
              onChange={(e) => setEventForm({ ...eventForm, summary: e.target.value })}
              fullWidth
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px'
                }
              }}
            />
            
            <TextField
              label="Description"
              value={eventForm.description}
              onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px'
                }
              }}
            />
            
            <TextField
              label="Location"
              value={eventForm.location}
              onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px'
                }
              }}
            />
            
            <TextField
              label="Start Date & Time"
              type="datetime-local"
              value={new Date(eventForm.start.dateTime).toISOString().slice(0, 16)}
              onChange={(e) => setEventForm({
                ...eventForm,
                start: {
                  ...eventForm.start,
                  dateTime: new Date(e.target.value).toISOString()
                }
              })}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px'
                }
              }}
            />
            
            <TextField
              label="End Date & Time"
              type="datetime-local"
              value={new Date(eventForm.end.dateTime).toISOString().slice(0, 16)}
              onChange={(e) => setEventForm({
                ...eventForm,
                end: {
                  ...eventForm.end,
                  dateTime: new Date(e.target.value).toISOString()
                }
              })}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px'
                }
              }}
            />
            
            <TextField
              label="Attendees (comma-separated emails)"
              value={eventForm.attendees.map(a => a.email).join(', ')}
              onChange={(e) => setEventForm({
                ...eventForm,
                attendees: e.target.value.split(',')
                  .map(email => email.trim())
                  .filter(email => email)
                  .map(email => ({ email }))
              })}
              fullWidth
              placeholder="email1@example.com, email2@example.com"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px'
                }
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button 
            onClick={() => setEventDialogOpen(false)}
            sx={{ 
              borderRadius: '12px',
              px: 3
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleEventSubmit} 
            variant="contained"
            disabled={!eventForm.summary || loading}
            sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              px: 3,
              fontWeight: 600
            }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : (editingEvent ? 'Update Event' : 'Create Event')}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default Calendar;