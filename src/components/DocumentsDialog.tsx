import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Box,
  Typography,
  Link,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  FileUpload as FileUploadIcon,
  RemoveRedEye as PreviewIcon,
} from '@mui/icons-material';
import { supabase } from '../utils/supabaseClient';

interface DocumentsDialogProps {
  open: boolean;
  onClose: () => void;
  documents: Record<string, string>;
  onSave: (documents: Record<string, string>) => void;
  clientId: string;
}

const DocumentsDialog = ({ open, onClose, documents, onSave, clientId }: DocumentsDialogProps) => {
  const [clientDocuments, setClientDocuments] = useState<Record<string, string>>(documents || {});
  const [newDocName, setNewDocName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !newDocName.trim()) return;

    setIsUploading(true);

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const folderName = `client_${clientId}`;
      const fileName = `${folderName}/${Date.now()}.${fileExt}`;

      // For public buckets, we can upload without authentication
      const { data, error: uploadError } = await supabase.storage
        .from('client-documents')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw uploadError;
      }

      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('client-documents')
        .getPublicUrl(fileName);

      // Store the document reference
      setClientDocuments(prev => ({
        ...prev,
        [newDocName]: publicUrl
      }));

      setNewDocName('');
      setSelectedFile(null);
    } catch (error) {
      console.error('Error uploading document:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (docName: string) => {
    if (!clientId) {
      alert('Cannot delete documents - invalid client ID');
      return;
    }

    try {
      const url = clientDocuments[docName];
      
      // Extract the file path from the URL
      const urlParts = url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const folderName = `client_${clientId}`;
      const fullPath = `${folderName}/${fileName}`;

      // For public buckets, we can delete without authentication
      const { error: deleteError } = await supabase.storage
        .from('client-documents')
        .remove([fullPath]);

      if (deleteError) {
        console.error('Delete error details:', deleteError);
        throw deleteError;
      }

      const updatedDocs = { ...clientDocuments };
      delete updatedDocs[docName];
      setClientDocuments(updatedDocs);
    } catch (error) {
      console.error('Error deleting document:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete document');
    }
  };

  const handlePreview = (url: string) => {
    window.open(url, '_blank');
  };

  const handleSave = () => {
    onSave(clientDocuments);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Client Documents</DialogTitle>
      <DialogContent>
        <List>
          {Object.entries(clientDocuments).map(([name, url]) => (
            <ListItem key={name}>
              <ListItemText
                primary={name}
                secondary={
                  <Link href={url} target="_blank" rel="noopener noreferrer">
                    View Document
                  </Link>
                }
              />
              <ListItemSecondaryAction>
                <IconButton onClick={() => handlePreview(url)}>
                  <PreviewIcon />
                </IconButton>
                <IconButton edge="end" onClick={() => handleDeleteDocument(name)}>
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>

        <Box sx={{ mt: 2 }}>
          <TextField
            label="Document Name"
            value={newDocName}
            onChange={(e) => setNewDocName(e.target.value)}
            fullWidth
            margin="normal"
          />
          <input
            accept=".pdf,.doc,.docx,.csv,image/*"
            style={{ display: 'none' }}
            id="raised-button-file"
            type="file"
            onChange={handleFileSelect}
          />
          <label htmlFor="raised-button-file">
            <Button
              variant="outlined"
              component="span"
              startIcon={<FileUploadIcon />}
              sx={{ mt: 1, mb: 1 }}
              disabled={isUploading}
            >
              Select File
            </Button>
          </label>
          {selectedFile && (
            <Typography variant="body2" sx={{ ml: 1 }}>
              Selected: {selectedFile.name}
            </Typography>
          )}
          <Button
            startIcon={<AddIcon />}
            onClick={handleUpload}
            variant="contained"
            disabled={!selectedFile || !newDocName.trim() || isUploading}
            sx={{ mt: 1, ml: 1 }}
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DocumentsDialog;