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
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { CustomField } from '../types/client';

interface CustomFieldsDialogProps {
  open: boolean;
  onClose: () => void;
  fields: Record<string, any>;
  onSave: (fields: Record<string, any>) => void;
}

const CustomFieldsDialog = ({ open, onClose, fields, onSave }: CustomFieldsDialogProps) => {
  const [customFields, setCustomFields] = useState<Record<string, any>>(fields || {});
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'number' | 'date' | 'boolean'>('text');

  const handleAddField = () => {
    if (newFieldName.trim()) {
      let value = newFieldValue;
      
      // Convert value based on type
      switch (newFieldType) {
        case 'number':
          value = Number(newFieldValue);
          break;
        case 'date':
          value = new Date(newFieldValue).toISOString();
          break;
        case 'boolean':
          value = newFieldValue === 'true';
          break;
      }

      setCustomFields(prev => ({
        ...prev,
        [newFieldName]: value
      }));
      
      setNewFieldName('');
      setNewFieldValue('');
      setNewFieldType('text');
    }
  };

  const handleDeleteField = (fieldName: string) => {
    const updatedFields = { ...customFields };
    delete updatedFields[fieldName];
    setCustomFields(updatedFields);
  };

  const handleSave = () => {
    onSave(customFields);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Custom Fields</DialogTitle>
      <DialogContent>
        <List>
          {Object.entries(customFields).map(([name, value]) => (
            <ListItem key={name}>
              <ListItemText
                primary={name}
                secondary={value}
              />
              <ListItemSecondaryAction>
                <IconButton edge="end" onClick={() => handleDeleteField(name)}>
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
        
        <TextField
          label="Field Name"
          value={newFieldName}
          onChange={(e) => setNewFieldName(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Field Value"
          value={newFieldValue}
          onChange={(e) => setNewFieldValue(e.target.value)}
          fullWidth
          margin="normal"
        />
        <Button
          startIcon={<AddIcon />}
          onClick={handleAddField}
          variant="outlined"
          sx={{ mt: 1 }}
        >
          Add Field
        </Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomFieldsDialog;