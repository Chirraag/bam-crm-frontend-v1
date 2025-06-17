import { useState, useEffect, useRef } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  TextField,
  IconButton,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Alert,
  AlertTitle,
  InputAdornment,
  Chip,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Send as SendIcon,
  Search as SearchIcon,
  Sms as SmsIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import Layout from "../components/Layout";
import { Client } from "../types/client";
import { api, messageService } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../utils/supabaseClient";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useNotifications } from "../context/NotificationContext";
import { useLocation } from "react-router-dom";

// Inside Messages component:
const location = useLocation();
const { addNotification } = useNotifications();
const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(
  null,
);

// Add this useEffect for handling navigation from notification
useEffect(() => {
  if (location.state?.selectedClientId) {
    const client = clients.find(
      (c) => c.id === location.state.selectedClientId,
    );
    if (client) {
      setSelectedClient(client);
    }
  }
}, [location.state, clients]);

// Add this useEffect for real-time subscription
useEffect(() => {
  if (!user?.phone_number) return;

  // Subscribe to new messages
  const channel = supabase
    .channel("messages-changes")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `or(from_number.eq.${user.phone_number},to_number.eq.${user.phone_number})`,
      },
      async (payload) => {
        const newMessage = payload.new as Message;

        // If it's an inbound message, show notification
        if (
          newMessage.direction === "inbound" &&
          newMessage.to_number === user.phone_number
        ) {
          // Find client info
          const client = clients.find((c) => c.id === newMessage.client_id);

          if (client) {
            addNotification({
              id: newMessage.id,
              clientId: newMessage.client_id,
              clientName: `${client.first_name} ${client.last_name}`,
              message: newMessage.content,
              timestamp: new Date(newMessage.created_at),
            });
          }
        }

        // Update messages if viewing this client
        if (selectedClient?.id === newMessage.client_id) {
          setClientMessages((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              messages: [...prev.messages, newMessage].sort(
                (a, b) =>
                  new Date(a.created_at).getTime() -
                  new Date(b.created_at).getTime(),
              ),
            };
          });
        }
      },
    )
    .subscribe();

  setRealtimeChannel(channel);

  // Cleanup subscription
  return () => {
    if (channel) {
      supabase.removeChannel(channel);
    }
  };
}, [user?.phone_number, selectedClient, clients, addNotification]);

interface Message {
  id: string;
  client_id: string;
  to_number: string;
  from_number: string;
  content: string;
  direction: "inbound" | "outbound";
  status: string;
  user_id?: string;
  created_at: string;
}

interface ClientMessages {
  client_id: string;
  client_phone: string;
  messages: Message[];
}

const Messages = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientMessages, setClientMessages] = useState<ClientMessages | null>(
    null,
  );
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      fetchClientMessages(selectedClient.id!.toString());
    }
  }, [selectedClient]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [clientMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchClients = async () => {
    try {
      setLoading(true);
      const clientsData = await api.get("/api/clients");
      setClients(clientsData);
    } catch (error) {
      console.error("Error fetching clients:", error);
      setError("Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  const fetchClientMessages = async (clientId: string) => {
    try {
      const messagesData = await messageService.getClientMessages(clientId);
      setClientMessages(messagesData);
      setError(null);
    } catch (error) {
      console.error("Error fetching messages:", error);
      setError("Failed to load messages");
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedClient || sendingMessage) return;

    // Check if operator has a phone number
    if (!user?.phone_number) {
      setError(
        "Your account does not have a phone number assigned. Please contact the administrator.",
      );
      return;
    }

    try {
      setSendingMessage(true);
      await messageService.sendMessage(
        selectedClient.id!.toString(),
        newMessage, // Don't trim here to preserve internal formatting
        user.phone_number, // Use operator's phone number
      );

      setNewMessage("");
      // Refresh messages after sending
      await fetchClientMessages(selectedClient.id!.toString());
      setError(null);
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    // Send on Enter (but allow Shift+Enter for new lines)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
    // Shift+Enter will naturally create a new line
  };

  const filteredClients = clients.filter(
    (client) =>
      `${client.first_name} ${client.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      client.primary_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.primary_phone?.includes(searchTerm),
  );

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return theme.palette.success.main;
      case "sent":
        return theme.palette.info.main;
      case "failed":
        return theme.palette.error.main;
      case "received":
        return theme.palette.primary.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  return (
    <Layout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="500" sx={{ mb: 1 }}>
          Messages
        </Typography>
        <Typography color="text.secondary">
          Send and receive SMS messages with your clients
        </Typography>
        {user?.phone_number && (
          <Typography
            variant="body2"
            color="primary"
            sx={{ mt: 1 }}
          ></Typography>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {!user?.phone_number && (
        <Alert severity="warning" sx={{ mb: 3 }} icon={<WarningIcon />}>
          <AlertTitle>Phone Number Required</AlertTitle>
          Your account does not have a phone number assigned. You will not be
          able to send or receive messages until an administrator assigns a
          phone number to your account. You are currently logged in as{" "}
          <strong>{user?.name || user?.email}</strong>.
        </Alert>
      )}

      <Grid container spacing={3} sx={{ height: "75vh" }}>
        {" "}
        {/* Fixed height for dashboard */}
        {/* Client List */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              height: "100%",
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box
              sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}
            >
              <TextField
                fullWidth
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <List sx={{ flex: 1, overflow: "auto", p: 0 }}>
                {filteredClients.map((client) => (
                  <ListItem key={client.id} disablePadding>
                    <ListItemButton
                      selected={selectedClient?.id === client.id}
                      onClick={() => setSelectedClient(client)}
                      sx={{
                        p: 2,
                        "&.Mui-selected": {
                          backgroundColor: alpha(
                            theme.palette.primary.main,
                            0.1,
                          ),
                          "&:hover": {
                            backgroundColor: alpha(
                              theme.palette.primary.main,
                              0.15,
                            ),
                          },
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                          {client.first_name?.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${client.first_name} ${client.last_name}`}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {client.primary_phone || "No phone number"}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {client.primary_email}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                ))}

                {filteredClients.length === 0 && !loading && (
                  <Box sx={{ textAlign: "center", p: 4 }}>
                    <PersonIcon
                      sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
                    />
                    <Typography color="text.secondary">
                      {searchTerm ? "No clients found" : "No clients available"}
                    </Typography>
                  </Box>
                )}
              </List>
            )}
          </Paper>
        </Grid>
        {/* Message Area */}
        <Grid item xs={12} md={8}>
          <Paper
            elevation={0}
            sx={{
              height: "100%",
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {selectedClient ? (
              <>
                {/* Header */}
                <Box
                  sx={{
                    p: 2,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 2 }}>
                      {selectedClient.first_name?.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 500 }}>
                        {selectedClient.first_name} {selectedClient.last_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {clientMessages?.client_phone ||
                          selectedClient.primary_phone ||
                          "No phone number"}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Messages */}
                <Box
                  sx={{
                    flex: 1,
                    overflow: "hidden", // Prevent this container from scrolling
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {!user?.phone_number ? (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        textAlign: "center",
                        color: "text.secondary",
                        p: 3,
                      }}
                    >
                      <WarningIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                      <Typography variant="h6" gutterBottom>
                        No phone number assigned
                      </Typography>
                      <Typography variant="body2">
                        You cannot view or send messages because your account
                        doesn't have a phone number assigned.
                      </Typography>
                    </Box>
                  ) : clientMessages?.messages.length === 0 ? (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        textAlign: "center",
                        color: "text.secondary",
                      }}
                    >
                      <SmsIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                      <Typography variant="h6" gutterBottom>
                        No messages yet
                      </Typography>
                      <Typography variant="body2">
                        Start a conversation by sending a message below
                      </Typography>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        flex: 1,
                        overflow: "auto", // Only this messages container scrolls
                        p: 2,
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        // Custom scrollbar styling
                        "&::-webkit-scrollbar": {
                          width: "6px",
                        },
                        "&::-webkit-scrollbar-track": {
                          backgroundColor: "transparent",
                        },
                        "&::-webkit-scrollbar-thumb": {
                          backgroundColor: alpha(
                            theme.palette.text.secondary,
                            0.2,
                          ),
                          borderRadius: "3px",
                          "&:hover": {
                            backgroundColor: alpha(
                              theme.palette.text.secondary,
                              0.3,
                            ),
                          },
                        },
                      }}
                    >
                      {clientMessages?.messages.map((message) => {
                        const isOutbound = message.direction === "outbound";

                        return (
                          <Box
                            key={message.id}
                            sx={{
                              display: "flex",
                              justifyContent: isOutbound
                                ? "flex-end"
                                : "flex-start",
                              mb: 1,
                            }}
                          >
                            <Box sx={{ maxWidth: "70%" }}>
                              <Card
                                elevation={0}
                                sx={{
                                  backgroundColor: isOutbound
                                    ? theme.palette.primary.main
                                    : theme.palette.grey[100],
                                  color: isOutbound ? "white" : "text.primary",
                                  borderRadius: 2,
                                  borderTopRightRadius: isOutbound ? 0 : 2,
                                  borderTopLeftRadius: !isOutbound ? 0 : 2,
                                }}
                              >
                                <CardContent
                                  sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}
                                >
                                  <Typography
                                    variant="body1"
                                    sx={{
                                      whiteSpace: "pre-wrap", // Preserve whitespace and newlines
                                      wordBreak: "break-word", // Handle long words/emojis
                                      lineHeight: 1.4, // Better spacing for multiline
                                      fontFamily: "inherit", // Consistent emoji rendering
                                    }}
                                  >
                                    {message.content}
                                  </Typography>
                                </CardContent>
                              </Card>

                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: isOutbound
                                    ? "flex-end"
                                    : "flex-start",
                                  gap: 1,
                                  mt: 0.5,
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {formatTime(message.created_at)}
                                </Typography>

                                {isOutbound && (
                                  <>
                                    <Chip
                                      label={message.status}
                                      size="small"
                                      sx={{
                                        height: 16,
                                        fontSize: "0.7rem",
                                        backgroundColor: alpha(
                                          getStatusColor(message.status),
                                          0.1,
                                        ),
                                        color: getStatusColor(message.status),
                                        "& .MuiChip-label": { px: 1 },
                                      }}
                                    />
                                    {message.from_number &&
                                      message.from_number !==
                                        user?.phone_number && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          sx={{ fontSize: "0.7rem" }}
                                        >
                                          • Sent from: {message.from_number}
                                        </Typography>
                                      )}
                                  </>
                                )}
                              </Box>
                            </Box>
                          </Box>
                        );
                      })}
                      {/* Invisible element to scroll to */}
                      <div ref={messagesEndRef} />
                    </Box>
                  )}
                </Box>

                {/* Send Message */}
                <Box
                  sx={{
                    p: 2,
                    borderTop: `1px solid ${theme.palette.divider}`,
                    backgroundColor: alpha(
                      theme.palette.background.default,
                      0.5,
                    ),
                    flexShrink: 0, // Prevent this from shrinking
                  }}
                >
                  {!selectedClient.primary_phone ? (
                    <Alert severity="warning">
                      This client doesn't have a phone number. Please add one to
                      send messages.
                    </Alert>
                  ) : !user?.phone_number ? (
                    <Alert severity="error">
                      You cannot send messages because your account doesn't have
                      a phone number assigned.
                    </Alert>
                  ) : (
                    <Box
                      sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}
                    >
                      <TextField
                        fullWidth
                        placeholder="Type your message... (Shift+Enter for new line)"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={sendingMessage}
                        multiline
                        maxRows={4}
                        minRows={1}
                        size="small"
                        sx={{
                          "& .MuiInputBase-input": {
                            lineHeight: 1.4,
                            fontFamily: "inherit",
                          },
                        }}
                      />
                      <IconButton
                        onClick={handleSendMessage}
                        disabled={
                          !newMessage.trim() ||
                          sendingMessage ||
                          !user?.phone_number
                        }
                        color="primary"
                        sx={{
                          mb: 0.25, // Small bottom margin to align with text baseline
                          flexShrink: 0, // Prevent button from shrinking
                        }}
                      >
                        {sendingMessage ? (
                          <CircularProgress size={20} />
                        ) : (
                          <SendIcon />
                        )}
                      </IconButton>
                    </Box>
                  )}
                </Box>
              </>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  textAlign: "center",
                  color: "text.secondary",
                }}
              >
                <SmsIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" gutterBottom>
                  Select a client to start messaging
                </Typography>
                <Typography variant="body2">
                  Choose a client from the list to view and send SMS messages
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Layout>
  );
};

export default Messages;
