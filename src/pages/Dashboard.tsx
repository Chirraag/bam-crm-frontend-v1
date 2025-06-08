import { useState, useEffect } from 'react';
import { 
  Typography, 
  Grid, 
  Paper, 
  Box, 
  Card, 
  CardContent, 
  Divider,
  useTheme,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Button
} from '@mui/material';
import {
  People as PeopleIcon,
  EventNote as EventNoteIcon,
  Message as MessageIcon,
  TrendingUp as TrendingUpIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import Layout from '../components/Layout';
import { api } from '../utils/api';

interface DashboardStats {
  clients: number;
  appointments: number;
  messages: number;
  revenue: number;
}

interface Appointment {
  id: number;
  title: string;
  client: string;
  date: string;
  type: string;
}

interface Client {
  id: number;
  name: string;
  email: string;
  status: string;
}

const Dashboard = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    clients: 0,
    appointments: 0,
    messages: 0,
    revenue: 0
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([
    {
      id: 1,
      title: "Initial Consultation",
      client: "John Smith",
      date: "Today, 2:00 PM",
      type: "Consultation"
    },
    {
      id: 2,
      title: "Case Review",
      client: "Sarah Wilson",
      date: "Tomorrow, 10:00 AM",
      type: "Review"
    },
    {
      id: 3,
      title: "Document Signing",
      client: "Michael Brown",
      date: "Wed, 3:30 PM",
      type: "Document"
    }
  ]);
  const [recentClients, setRecentClients] = useState<Client[]>([
    {
      id: 1,
      name: "Emma Johnson",
      email: "emma.j@example.com",
      status: "Active"
    },
    {
      id: 2,
      name: "David Lee",
      email: "david.lee@example.com",
      status: "Pending"
    },
    {
      id: 3,
      name: "Sarah Wilson",
      email: "sarah.w@example.com",
      status: "Active"
    }
  ]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setStats({
          clients: 45,
          appointments: 12,
          messages: 28,
          revenue: 52000
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const StatCard = ({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: string }) => (
    <Card elevation={0} sx={{ height: '100%', borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box
            sx={{
              bgcolor: `${color}20`,
              color: color,
              borderRadius: '12px',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
            }}
          >
            {icon}
          </Box>
          <Typography variant="h4" component="div" fontWeight="500">
            {value}
          </Typography>
        </Box>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          {title}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="500" sx={{ mb: 1 }}>
          Dashboard
        </Typography>
        <Typography color="text.secondary">
          Welcome back! Here's an overview of your law firm.
        </Typography>
      </Box>

      {loading ? (
        <>
          <LinearProgress sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            {[1, 2, 3, 4].map((item) => (
              <Grid item xs={12} sm={6} md={3} key={item}>
                <Paper sx={{ p: 3, height: 100 }} />
              </Grid>
            ))}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3, height: 350 }} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, height: 350 }} />
            </Grid>
          </Grid>
        </>
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Clients"
                value={stats.clients}
                icon={<PeopleIcon />}
                color={theme.palette.primary.main}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Appointments"
                value={stats.appointments}
                icon={<EventNoteIcon />}
                color={theme.palette.secondary.main}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Messages"
                value={stats.messages}
                icon={<MessageIcon />}
                color={theme.palette.info.main}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Revenue (USD)"
                value={`$${stats.revenue.toLocaleString()}`}
                icon={<TrendingUpIcon />}
                color={theme.palette.success.main}
              />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card elevation={0} sx={{ height: '100%', borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" component="h2" fontWeight="500">
                      Upcoming Appointments
                    </Typography>
                    <Button 
                      endIcon={<ArrowForwardIcon />} 
                      size="small" 
                      onClick={() => {}} 
                      sx={{ textTransform: 'none' }}
                    >
                      View All
                    </Button>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                    {upcomingAppointments.map((appointment) => (
                      <ListItem 
                        key={appointment.id}
                        alignItems="flex-start"
                        sx={{ 
                          px: 2, 
                          py: 1.5, 
                          borderRadius: 1,
                          mb: 1,
                          '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' },
                          cursor: 'pointer'
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ 
                            bgcolor: 
                              appointment.type === 'Consultation' ? theme.palette.primary.main : 
                              appointment.type === 'Review' ? theme.palette.secondary.main : 
                              theme.palette.info.main
                          }}>
                            {appointment.client.charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1\" fontWeight={500}>
                              {appointment.title}
                            </Typography>
                          }
                          secondary={
                            <>
                              <Typography component="span" variant="body2" color="text.primary">
                                {appointment.client}
                              </Typography>
                              {` — ${appointment.date}`}
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card elevation={0} sx={{ height: '100%', borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" component="h2" fontWeight="500">
                      Recent Clients
                    </Typography>
                    <Button 
                      endIcon={<ArrowForwardIcon />} 
                      size="small" 
                      onClick={() => {}} 
                      sx={{ textTransform: 'none' }}
                    >
                      View All
                    </Button>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                    {recentClients.map((client) => (
                      <ListItem 
                        key={client.id}
                        alignItems="flex-start"
                        sx={{ 
                          px: 2, 
                          py: 1, 
                          borderRadius: 1,
                          mb: 0.5,
                          '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' },
                          cursor: 'pointer'
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                            {client.name.charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2\" fontWeight={500}>
                              {client.name}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="body2" color="text.secondary">
                              {client.email}
                            </Typography>
                          }
                        />
                        <Box>
                          <Box
                            sx={{
                              px: 1.5,
                              py: 0.5,
                              borderRadius: 1,
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              bgcolor: client.status === 'Active' ? 'success.light' : 'warning.light',
                              color: client.status === 'Active' ? 'success.dark' : 'warning.dark',
                            }}
                          >
                            {client.status}
                          </Box>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Layout>
  );
};

export default Dashboard;