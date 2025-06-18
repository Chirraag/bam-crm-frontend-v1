import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  Avatar,
  Divider,
  CircularProgress,
  Chip,
  Alert,
  InputAdornment,
  Card,
  CardContent,
  useTheme,
  alpha,
  Badge,
  Tooltip,
} from "@mui/material";
import {
  Send as SendIcon,
  Search as SearchIcon,
  Phone as PhoneIcon,
  Sms as SmsIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import Layout from "../components/Layout";
import { Client } from "../types/client";
import { Message, ClientMessages } from "../types/message";
import { api, messageService } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../utils/supabaseClient";
import { format, isToday, isYesterday, parseISO } from "date-fns";

export default function Messages() {
  const theme = useTheme();
  const location = useLocation();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const subscriptionRef = useRef<any>(null);

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Check if there's a pre-selected client from navigation state
  useEffect(() => {
    if (location.state?.selectedClientId) {
      const clientId = location.state.selectedClientId;
      // Find and select the client after clients are loaded
      const client = clients.find((c) => c.id?.toString() === clientId);
      if (client) {
        handleSelectClient(client);
      }
    }
  }, [location.state, clients]);

  useEffect(() => {
    fetchClients();
    return () => {
      // Cleanup subscription on unmount
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-clear error if we have messages
  useEffect(() => {
    if (error && messages.length > 0) {
      const timer = setTimeout(() => {
        setError(null);
      }, 3000); // Clear after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [error, messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/clients");
      setClients(response);
    } catch (error) {
      console.error("Error fetching clients:", error);
      setError("Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectClient = async (client: Client) => {
    // Cleanup previous subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    setSelectedClient(client);
    setLoadingMessages(true);
    setError(null); // Always clear previous errors when switching clients

    try {
      // Fetch initial messages
      const messagesData: ClientMessages =
        await messageService.getClientMessages(client.id!.toString());

      // Handle the response safely
      const messages = messagesData?.messages || [];
      setMessages(messages);

      // Clear error on successful load
      setError(null);
    } catch (error) {
      console.error("Error loading messages:", error);
      setError("Failed to load messages");
    } finally {
      // Always set loading to false
      setLoadingMessages(false);
    }

    // Set up real-time subscription separately (don't let it affect error state)
    try {
      subscriptionRef.current = supabase
        .channel(`messages:client:${client.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "messages",
            filter: `client_id=eq.${client.id}`,
          },
          (payload) => {
            console.log("Realtime message update:", payload);

            if (payload.eventType === "INSERT") {
              const newMsg = payload.new as Message;
              setMessages((prev) => [...prev, newMsg]);
            } else if (payload.eventType === "UPDATE") {
              const updatedMsg = payload.new as Message;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === updatedMsg.id ? updatedMsg : msg,
                ),
              );
            } else if (payload.eventType === "DELETE") {
              const deletedId = payload.old.id;
              setMessages((prev) => prev.filter((msg) => msg.id !== deletedId));
            }
          },
        )
        .subscribe();
    } catch (subscriptionError) {
      // Log but don't show subscription errors to user
      console.error("Realtime subscription setup error:", subscriptionError);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedClient) return;

    // Check if operator has a phone number
    if (!user?.phone_number) {
      setError(
        "Your account does not have a phone number assigned. Please contact the administrator.",
      );
      return;
    }

    setSending(true);
    setError(null);

    try {
      await messageService.sendMessage(
        selectedClient.id!.toString(),
        newMessage.trim(),
        user.phone_number,
      );

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = parseISO(dateString);

    if (isToday(date)) {
      return format(date, "h:mm a");
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, "h:mm a")}`;
    }
    return format(date, "MMM d, h:mm a");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircleIcon sx={{ fontSize: 14 }} />;
      case "sent":
        return <CheckCircleIcon sx={{ fontSize: 14, opacity: 0.5 }} />;
      case "failed":
        return <ErrorIcon sx={{ fontSize: 14, color: "error.main" }} />;
      case "pending":
        return <ScheduleIcon sx={{ fontSize: 14 }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
      case "received":
        return theme.palette.success.main;
      case "sent":
        return theme.palette.info.main;
      case "failed":
        return theme.palette.error.main;
      case "pending":
        return theme.palette.warning.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  const filteredClients = clients.filter(
    (client) =>
      client.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.primary_phone?.includes(searchTerm),
  );

  // Group messages by date
  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};

    messages.forEach((message) => {
      const date = parseISO(message.created_at);
      let key: string;

      if (isToday(date)) {
        key = "Today";
      } else if (isYesterday(date)) {
        key = "Yesterday";
      } else {
        key = format(date, "MMMM d, yyyy");
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(message);
    });

    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <Layout>
      <Box sx={{ height: "calc(100vh - 100px)", display: "flex", gap: 3 }}>
        {/* Client List */}
        <Paper
          elevation={0}
          sx={{
            width: 350,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}
          >
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Messages
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
          </Box>

          <Box sx={{ flex: 1, overflow: "auto" }}>
            {loading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                <CircularProgress />
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {filteredClients.map((client) => {
                  const isSelected = selectedClient?.id === client.id;
                  const hasPhone = Boolean(client.primary_phone);

                  return (
                    <ListItem
                      key={client.id}
                      button
                      selected={isSelected}
                      onClick={() => hasPhone && handleSelectClient(client)}
                      disabled={!hasPhone}
                      sx={{
                        py: 2,
                        px: 2,
                        borderBottom: `1px solid ${alpha(
                          theme.palette.divider,
                          0.1,
                        )}`,
                        "&.Mui-selected": {
                          backgroundColor: alpha(
                            theme.palette.primary.main,
                            0.08,
                          ),
                          borderLeft: `3px solid ${theme.palette.primary.main}`,
                        },
                        "&:hover": {
                          backgroundColor: alpha(
                            theme.palette.action.hover,
                            0.5,
                          ),
                        },
                        opacity: hasPhone ? 1 : 0.5,
                      }}
                    >
                      <Avatar
                        sx={{
                          bgcolor: hasPhone
                            ? theme.palette.primary.main
                            : theme.palette.grey[400],
                          mr: 2,
                        }}
                      >
                        {client.first_name?.charAt(0)}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {client.first_name} {client.last_name}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <PhoneIcon sx={{ fontSize: 14 }} />
                          {client.primary_phone || "No phone number"}
                        </Typography>
                      </Box>
                      {hasPhone && (
                        <Badge
                          color="primary"
                          variant="dot"
                          invisible={!isSelected}
                        />
                      )}
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Box>
        </Paper>

        {/* Chat Area */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {selectedClient ? (
            <>
              {/* Chat Header */}
              <Box
                sx={{
                  p: 2,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.primary.main,
                    0.05,
                  )} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
                }}
              >
                <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                  {selectedClient.first_name?.charAt(0)}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight={600}>
                    {selectedClient.first_name} {selectedClient.last_name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                  >
                    <PhoneIcon sx={{ fontSize: 14 }} />
                    {selectedClient.primary_phone}
                  </Typography>
                </Box>
                <Chip
                  label={selectedClient.case_status}
                  size="small"
                  color={
                    selectedClient.case_status === "Active"
                      ? "success"
                      : selectedClient.case_status === "Pending"
                        ? "warning"
                        : "default"
                  }
                />
              </Box>

              {/* Messages Area */}
              <Box
                sx={{
                  flex: 1,
                  overflow: "auto",
                  p: 2,
                  backgroundColor: alpha(theme.palette.grey[100], 0.5),
                }}
              >
                {loadingMessages ? (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "100%",
                    }}
                  >
                    <CircularProgress />
                  </Box>
                ) : messages.length === 0 ? (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                      color: "text.secondary",
                    }}
                  >
                    <SmsIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
                    <Typography variant="h6" gutterBottom>
                      No messages yet
                    </Typography>
                    <Typography variant="body2">
                      Send a message to start the conversation
                    </Typography>
                  </Box>
                ) : (
                  <>
                    {Object.entries(messageGroups).map(
                      ([date, groupMessages]) => (
                        <Box key={date}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "center",
                              my: 2,
                            }}
                          >
                            <Chip
                              label={date}
                              size="small"
                              sx={{
                                backgroundColor: alpha(
                                  theme.palette.text.primary,
                                  0.08,
                                ),
                                fontWeight: 500,
                              }}
                            />
                          </Box>
                          {groupMessages.map((message) => (
                            <Box
                              key={message.id}
                              sx={{
                                display: "flex",
                                justifyContent:
                                  message.direction === "outbound"
                                    ? "flex-end"
                                    : "flex-start",
                                mb: 2,
                              }}
                            >
                              <Box
                                sx={{
                                  maxWidth: "70%",
                                  backgroundColor:
                                    message.direction === "outbound"
                                      ? theme.palette.primary.main
                                      : "white",
                                  color:
                                    message.direction === "outbound"
                                      ? "white"
                                      : "text.primary",
                                  borderRadius: 2,
                                  p: 2,
                                  boxShadow: 1,
                                  position: "relative",
                                }}
                              >
                                <Typography variant="body1">
                                  {message.content}
                                </Typography>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    mt: 1,
                                  }}
                                >
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      opacity: 0.7,
                                      fontSize: "0.75rem",
                                    }}
                                  >
                                    {formatMessageTime(message.created_at)}
                                  </Typography>
                                  {message.direction === "outbound" && (
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        color:
                                          message.status === "failed"
                                            ? theme.palette.error.main
                                            : "inherit",
                                      }}
                                    >
                                      {getStatusIcon(message.status)}
                                    </Box>
                                  )}
                                </Box>
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      ),
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </Box>

              {/* Message Input */}
              <Box
                sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}
              >
                {error && messages.length === 0 && (
                  <Alert
                    severity="error"
                    sx={{ mb: 2 }}
                    onClose={() => setError(null)}
                  >
                    {error}
                  </Alert>
                )}
                {!user?.phone_number ? (
                  <Alert severity="warning">
                    You cannot send messages because your account doesn't have a
                    phone number assigned. Please contact the administrator.
                  </Alert>
                ) : (
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <TextField
                      fullWidth
                      multiline
                      maxRows={4}
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={sending}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                        },
                      }}
                    />
                    <Tooltip title="Send message">
                      <span>
                        <IconButton
                          color="primary"
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() || sending}
                          sx={{
                            bgcolor: theme.palette.primary.main,
                            color: "white",
                            "&:hover": {
                              bgcolor: theme.palette.primary.dark,
                            },
                            "&.Mui-disabled": {
                              bgcolor: alpha(theme.palette.primary.main, 0.3),
                              color: alpha(theme.palette.common.white, 0.5),
                            },
                          }}
                        >
                          {sending ? (
                            <CircularProgress size={24} color="inherit" />
                          ) : (
                            <SendIcon />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
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
                color: "text.secondary",
              }}
            >
              <SmsIcon sx={{ fontSize: 80, mb: 2, opacity: 0.3 }} />
              <Typography variant="h5" gutterBottom>
                Select a client to start messaging
              </Typography>
              <Typography variant="body2">
                Choose a client from the list to view and send messages
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </Layout>
  );
}
