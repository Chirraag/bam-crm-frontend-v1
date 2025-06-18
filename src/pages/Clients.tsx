import { useState, useEffect } from "react";
import {
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Comment as EditNoteIcon,
} from "@mui/icons-material";
import Layout from "../components/Layout";
import { Client, ColumnMetadata } from "../types/client";
import ClientDialog from "../components/ClientDialog";
import ClientDetailsDialog from "../components/ClientDetailsDialog";
import { api } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { columnService } from "../services/columnService";
import NotesDialog from "../components/NotesDialog";

const Clients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [dynamicColumns, setDynamicColumns] = useState<ColumnMetadata[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    fetchClients();
    fetchDynamicColumns();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await api.get("/api/clients");
      setClients(response);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching clients:", error);
      setLoading(false);
    }
  };

  const fetchDynamicColumns = async () => {
    try {
      const columns = await columnService.getColumnMetadata();
      setDynamicColumns(columns);
    } catch (error) {
      console.error("Error fetching dynamic columns:", error);
    }
  };

  const handleCreateClient = () => {
    setDialogMode("create");
    setSelectedClient(null);
    setDialogOpen(true);
  };

  const handleSaveClient = async (clientData: Partial<Client>) => {
    try {
      // Prepare the data to send to backend - include all dynamic column values
      const dataToSend = { ...clientData };

      // Add dynamic column values to the main object
      dynamicColumns.forEach((column) => {
        if (clientData[column.column_name] !== undefined) {
          dataToSend[column.column_name] = clientData[column.column_name];
        }
      });

      if (dialogMode === "create") {
        const clientWithCreator = {
          ...dataToSend,
          created_by: user?.id,
        };
        await api.post("/api/clients", clientWithCreator);
        console.log("Client created successfully");
      } else {
        await api.put(`/api/clients/${selectedClient?.id}`, dataToSend);
        console.log("Client updated successfully");
      }
      await fetchClients();
      setDialogOpen(false);
    } catch (error) {
      console.error("Error saving client:", error);
      alert("Failed to save client. Please try again.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedClient) {
      try {
        await api.delete(`/api/clients/${selectedClient.id}`);
        setDeleteDialogOpen(false);
        setSelectedClient(null);
        await fetchClients(); // Refresh the client list after successful deletion
      } catch (error) {
        console.error("Error deleting client:", error);
        // Since 204 is a success status, we still want to refresh and close
        setDeleteDialogOpen(false);
        setSelectedClient(null);
        await fetchClients();
      }
    }
  };

  const handleOpenMenu = (
    event: React.MouseEvent<HTMLElement>,
    client: Client,
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedClient(client);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleViewClient = () => {
    handleCloseMenu();
    setDetailsDialogOpen(true);
  };

  const handleEditClient = () => {
    setDialogMode("edit");
    setDialogOpen(true);
    handleCloseMenu();
  };

  const handleDeleteClient = () => {
    handleCloseMenu();
    setDeleteDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return {
          bg: "#E8F5E9",
          text: "#2E7D32",
        };
      case "Pending":
        return {
          bg: "#FFF3E0",
          text: "#E65100",
        };
      case "Closed":
        return {
          bg: "#FFEBEE",
          text: "#C62828",
        };
      default:
        return {
          bg: "#E8F5E9",
          text: "#2E7D32",
        };
    }
  };

  const formatDynamicValue = (value: any, columnType: string) => {
    if (value === null || value === undefined) return "—";

    switch (columnType) {
      case "boolean":
        return value ? "Yes" : "No";
      case "date":
        try {
          return new Date(value).toLocaleDateString();
        } catch {
          return value;
        }
      case "timestamp":
        try {
          return new Date(value).toLocaleDateString();
        } catch {
          return value;
        }
      default:
        return value.toString();
    }
  };

  const filteredClients = clients.filter((client) => {
    const searchLower = searchTerm.toLowerCase();

    // Search in fixed fields
    const fixedFieldsMatch =
      client.first_name?.toLowerCase().includes(searchLower) ||
      client.last_name?.toLowerCase().includes(searchLower) ||
      client.primary_email?.toLowerCase().includes(searchLower) ||
      client.primary_phone?.includes(searchTerm) ||
      client.case_type?.toLowerCase().includes(searchLower);

    // Search in dynamic fields
    const dynamicFieldsMatch = dynamicColumns.some((column) => {
      const value = client[column.column_name];
      if (value === null || value === undefined) return false;
      return value.toString().toLowerCase().includes(searchLower);
    });

    return fixedFieldsMatch || dynamicFieldsMatch;
  });

  return (
    <Layout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="500" sx={{ mb: 1 }}>
          Clients
        </Typography>
        <Typography color="text.secondary">
          Manage your client information and cases
        </Typography>
      </Box>

      <Card
        elevation={0}
        sx={{ borderRadius: 2, border: "1px solid rgba(0, 0, 0, 0.12)" }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <TextField
              placeholder="Search clients..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ width: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateClient}
              sx={{ textTransform: "none" }}
            >
              Add New Client
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 2 }}
              >
                Tip: Click on any row to view full client details
              </Typography>
              <TableContainer component={Paper} elevation={0}>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Primary Email</TableCell>
                      <TableCell>Primary Phone</TableCell>
                      <TableCell>Case Type</TableCell>
                      <TableCell>Case Status</TableCell>
                      <TableCell>Created At</TableCell>
                      <TableCell align="left">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow
                        key={client.id}
                        sx={{
                          "&:last-child td, &:last-child th": { border: 0 },
                          cursor: "pointer",
                          "&:hover": {
                            backgroundColor: "action.hover",
                          },
                        }}
                        onClick={(e) => {
                          // Don't open details if clicking on action buttons
                          const target = e.target as HTMLElement;
                          if (
                            !target.closest(".MuiIconButton-root") &&
                            !target.closest(".MuiListItemIcon-root")
                          ) {
                            setSelectedClient(client);
                            setDetailsDialogOpen(true);
                          }
                        }}
                      >
                        <TableCell component="th" scope="row">
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Avatar
                              sx={{
                                bgcolor: "primary.main",
                                width: 36,
                                height: 36,
                                mr: 2,
                              }}
                            >
                              {client.first_name?.charAt(0)}
                            </Avatar>
                            {`${client.first_name} ${client.last_name}`}
                          </Box>
                        </TableCell>
                        <TableCell>{client.primary_email}</TableCell>
                        <TableCell>{client.primary_phone}</TableCell>
                        <TableCell>{client.case_type}</TableCell>
                        <TableCell>
                          <Chip
                            label={client.case_status}
                            size="small"
                            sx={{
                              bgcolor: getStatusColor(client.case_status || "")
                                .bg,
                              color: getStatusColor(client.case_status || "")
                                .text,
                              fontWeight: 500,
                              border: "none",
                              "& .MuiChip-label": {
                                px: 2,
                              },
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(client.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="left">
                          <Tooltip title="View/Edit Notes">
                            <ListItemIcon
                              className="MuiListItemIcon-root"
                              style={{ minWidth: "40px", cursor: "pointer" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedClient(client);
                                setNotesDialogOpen(true);
                              }}
                            >
                              <EditNoteIcon fontSize="medium" />
                            </ListItemIcon>
                          </Tooltip>
                          <Tooltip title="Edit Client">
                            <ListItemIcon
                              className="MuiListItemIcon-root"
                              style={{ minWidth: "40px", cursor: "pointer" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedClient(client);
                                handleEditClient();
                              }}
                            >
                              <EditIcon fontSize="medium" />
                            </ListItemIcon>
                          </Tooltip>
                          <Tooltip title="Delete Client">
                            <ListItemIcon
                              className="MuiListItemIcon-root"
                              sx={{ color: "error.main" }}
                              style={{ minWidth: "40px", cursor: "pointer" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedClient(client);
                                handleDeleteClient();
                              }}
                            >
                              <DeleteIcon fontSize="medium" />
                            </ListItemIcon>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </CardContent>
      </Card>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem onClick={handleViewClient}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          View Details
        </MenuItem>
        <MenuItem onClick={handleEditClient}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteClient} sx={{ color: "error.main" }}>
          <ListItemIcon sx={{ color: "error.main" }}>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Client</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedClient?.first_name}{" "}
            {selectedClient?.last_name}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <ClientDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveClient}
        client={selectedClient}
        mode={dialogMode}
      />

      <ClientDetailsDialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        client={selectedClient}
      />

      <NotesDialog
        open={notesDialogOpen}
        onClose={() => setNotesDialogOpen(false)}
        client={selectedClient}
      />
    </Layout>
  );
};

export default Clients;
