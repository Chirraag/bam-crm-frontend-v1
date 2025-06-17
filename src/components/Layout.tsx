import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Drawer,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  CalendarMonth as CalendarIcon,
  Message as MessageIcon,
  RecordVoiceOver as VoiceIcon,
  People as PeopleIcon,
  Sms as SmsIcon, // ← CHANGED: Use SmsIcon for messages
  Logout as LogoutIcon,
  Scale as ScaleIcon,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";

const drawerWidth = 280;

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/" },
    { text: "Calendar", icon: <CalendarIcon />, path: "/calendar" },
    { text: "Clients", icon: <PeopleIcon />, path: "/clients" },
    { text: "Messages", icon: <SmsIcon />, path: "/messages" }, // ← ADDED: Messages menu item
  ];

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          color: "white",
        }}
      >
        <ScaleIcon sx={{ fontSize: 28, mr: 1 }} />
        <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
          Legal CRM
        </Typography>
      </Box>
      <Divider />
      <Box sx={{ mt: 2, px: 2 }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 500,
            color: theme.palette.text.secondary,
            mb: 1,
            ml: 2,
          }}
        >
          MAIN MENU
        </Typography>
      </Box>
      <List sx={{ px: 1, flex: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              selected={location.pathname === item.path}
              sx={{
                borderRadius: "8px",
                mb: 0.5,
                "&.Mui-selected": {
                  backgroundColor: theme.palette.primary.light + "20",
                  "&:hover": {
                    backgroundColor: theme.palette.primary.light + "30",
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color:
                    location.pathname === item.path
                      ? theme.palette.primary.main
                      : "inherit",
                  minWidth: "40px",
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: location.pathname === item.path ? 500 : 400,
                  color:
                    location.pathname === item.path
                      ? theme.palette.primary.main
                      : "inherit",
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              mr: 2,
              bgcolor: theme.palette.primary.main,
            }}
          >
            {user?.email?.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
              {user?.name || user?.email?.split("@")[0]}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: "0.75rem" }}
            >
              {user?.email}
            </Typography>
          </Box>
        </Box>
        <ListItemButton
          onClick={handleSignOut}
          sx={{
            borderRadius: "8px",
            "&:hover": {
              backgroundColor: theme.palette.error.light + "20",
            },
          }}
        >
          <ListItemIcon
            sx={{ color: theme.palette.error.main, minWidth: "40px" }}
          >
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText
            primary="Sign out"
            primaryTypographyProps={{
              color: theme.palette.error.main,
              fontWeight: 500,
            }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      {isMobile && (
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{
            position: "fixed",
            left: 16,
            top: 16,
            zIndex: 1200,
            bgcolor: "background.paper",
            boxShadow: 1,
            "&:hover": {
              bgcolor: "background.paper",
            },
          }}
        >
          <MenuIcon />
        </IconButton>
      )}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              backgroundImage: "none",
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              border: "none",
              borderRight: `1px solid ${theme.palette.divider}`,
              backgroundImage: "none",
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          height: "100vh",
          overflow: "auto",
          bgcolor: "background.default",
          p: { xs: 2, sm: 3 },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
