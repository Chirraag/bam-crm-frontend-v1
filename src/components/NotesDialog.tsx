import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Typography,
  Box,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Client } from "../types/client";
import { api } from "../utils/api";

interface Note {
  id: string;
  client_id: string;
  created_by: string;
  content: string;
  updated_at?: string;
}

interface NotesDialogProps {
  open: boolean;
  onClose: () => void;
  client: Client | null;
}

const NotesDialog: React.FC<NotesDialogProps> = ({ open, onClose, client }) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        // console.log('Fetching notes for client:', client.id);
        if (!client.id) {
          throw new Error("Client ID is required to fetch notes");
        }
        const response = await api.get(`/api/notes/${client?.id}`);
        // console.log('Fetched notes:', response);
        setNotes(response ? response : []);
      } catch (error) {
        console.error("Failed to fetch notes:", error);
      }
    };

    if (open) {
      fetchNotes();
    }
  }, [open]);

  const handleAddOrUpdate = async () => {
    if (currentNote.trim() === "") return;

    if (editId !== null) {
      try {
        const response = await api.put(`/api/notes`, {
          id: editId,
          client_id: client.id,
          content: currentNote,
          created_by: user?.id,
          updated_at: new Date().toISOString(),
        });

        setNotes((prev) =>
          prev.map((note) => (note.id === editId ? response : note)),
        );
        setEditId(null);
      } catch (error) {
        console.error("Failed to update note", error);
      }
    } else {
      try {
        const response = await api.post(`/api/notes`, {
          client_id: client.id,
          created_by: user?.id,
          content: currentNote,
        });
        // console.log('Note added:', response);
        setNotes((prev) => [...prev, response]);
      } catch (error) {
        console.error("Failed to add note:", error);
      }
    }
    setCurrentNote("");
  };

  const handleEdit = (note: Note) => {
    setCurrentNote(note.content);
    setEditId(note.id);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/notes/${id}`);
      setNotes((prev) => prev.filter((note) => note.id !== id));
      if (editId === id) {
        setCurrentNote("");
        setEditId(null);
      }
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  };

  const handleClose = () => {
    setCurrentNote("");
    setEditId(null);
    onClose();
  };

  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>My Notes</DialogTitle>

      <DialogContent dividers>
        <List>
          {notes.length === 0 && <div>No notes yet.</div>}
          {notes.map((note) => (
            <ListItem
              key={note.id}
              secondaryAction={
                <>
                  <IconButton onClick={() => handleEdit(note)} edge="end">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(note.id)} edge="end">
                    <DeleteIcon />
                  </IconButton>
                </>
              }
              sx={{
                alignItems: "flex-start",
                borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
                py: 2,
              }}
            >
              <ListItemText
                primary={
                  <Box>
                    <Typography variant="body1" sx={{ mb: 0.5 }}>
                      {note.content}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Last updated: {formatDateTime(note.updated_at)}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>

        <TextField
          label={editId !== null ? "Update Note" : "New Note"}
          value={currentNote}
          onChange={(e) => setCurrentNote(e.target.value)}
          fullWidth
          margin="dense"
          multiline
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
        <Button onClick={handleAddOrUpdate} variant="contained">
          {editId !== null ? "Update" : "Add"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NotesDialog;
