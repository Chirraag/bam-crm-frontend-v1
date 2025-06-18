import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Slide,
  Stack,
  Avatar,
  alpha,
  useTheme,
} from "@mui/material";
import {
  Close as CloseIcon,
  Message as MessageIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";

export default function NotificationPopup() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { notifications, removeNotification } = useNotifications();

  const handleClick = (notification: any) => {
    // Navigate to messages page with the specific client
    navigate("/messages", {
      state: { selectedClientId: notification.clientId },
    });
    removeNotification(notification.id);
  };

  return (
    <Box
      sx={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 9999,
        maxWidth: 400,
      }}
    >
      <Stack spacing={2}>
        {notifications.map((notification) => (
          <Slide
            key={notification.id}
            direction="left"
            in={true}
            mountOnEnter
            unmountOnExit
          >
            <Paper
              elevation={6}
              sx={{
                p: 2,
                cursor: "pointer",
                backgroundColor: "white",
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                borderRadius: 2,
                minWidth: 350,
                "&:hover": {
                  backgroundColor: alpha(theme.palette.primary.main, 0.02),
                  transform: "translateX(-4px)",
                  transition: "all 0.2s ease",
                },
              }}
              onClick={() => handleClick(notification)}
            >
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    width: 40,
                    height: 40,
                  }}
                >
                  <MessageIcon fontSize="small" />
                </Avatar>

                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    New message from {notification.clientName}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: "250px",
                    }}
                  >
                    {notification.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </Typography>
                </Box>

                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeNotification(notification.id);
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            </Paper>
          </Slide>
        ))}
      </Stack>
    </Box>
  );
}
