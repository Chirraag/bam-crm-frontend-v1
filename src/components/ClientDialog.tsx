import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  MenuItem,
  Typography,
  Divider,
  Box,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Link,
  Chip
} from '@mui/material';
import { Delete as DeleteIcon, RemoveRedEye as PreviewIcon } from '@mui/icons-material';
import { Client, ColumnMetadata } from '../types/client';
import { columnService } from '../services/columnService';
import CustomFieldsDialog from './CustomFieldsDialog';
import DocumentsDialog from './DocumentsDialog';
import DynamicFieldRenderer from './DynamicFieldRenderer';

interface ClientDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (client: Partial<Client>) => void;
  client?: Client;
  mode: 'create' | 'edit';
}

const ClientDialog = ({ open, onClose, onSave, client, mode }: ClientDialogProps) => {
  const [formData, setFormData] = useState<Partial<Client>>({});
  const [customFieldsOpen, setCustomFieldsOpen] = useState(false);
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [tempClientId, setTempClientId] = useState<string>('');
  const [dynamicColumns, setDynamicColumns] = useState<ColumnMetadata[]>([]);

  useEffect(() => {
    if (client && mode === 'edit') {
      setFormData(client);
    } else {
      // Generate a temporary ID for new clients to use for document uploads
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setTempClientId(tempId);
      setFormData({
        case_status: 'Active' // Set default case status to Active
      });
    }
  }, [client, mode]);

  useEffect(() => {
    if (open) {
      fetchDynamicColumns();
    }
  }, [open]);

  const fetchDynamicColumns = async () => {
    try {
      const columns = await columnService.getColumnMetadata();
      setDynamicColumns(columns);
    } catch (error) {
      console.error('Error fetching dynamic columns:', error);
    }
  };

  const handleChange = (field: keyof Client) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData({ ...formData, [field]: value });
  };

  const handleDynamicFieldChange = (columnName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [columnName]: value
    }));
  };

  const handleCustomFieldsSave = (fields: Record<string, any>) => {
    setFormData(prev => ({
      ...prev,
      user_defined_fields: {
        ...(prev.user_defined_fields || {}),
        ...fields
      }
    }));
  };

  const handleDocumentsSave = (documents: Record<string, string>) => {
    setFormData(prev => ({
      ...prev,
      client_documents: {
        ...(prev.client_documents || {}),
        ...documents
      }
    }));
  };

  const handleDeleteCustomField = (fieldName: string) => {
    const updatedFields = { ...formData.user_defined_fields };
    delete updatedFields[fieldName];
    setFormData(prev => ({
      ...prev,
      user_defined_fields: updatedFields
    }));
  };

  const handleDeleteDocument = (docName: string) => {
    const updatedDocs = { ...formData.client_documents };
    delete updatedDocs[docName];
    setFormData(prev => ({
      ...prev,
      client_documents: updatedDocs
    }));
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  // Get the client ID to use for document operations
  const getClientIdForDocuments = () => {
    if (mode === 'edit' && client?.id) {
      return client.id.toString();
    }
    return tempClientId;
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {mode === 'create' ? 'Add New Client' : 'Edit Client'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Personal Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight={500} gutterBottom>
                Personal Information
              </Typography>
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                select
                fullWidth
                label="Prefix"
                value={formData.name_prefix || ''}
                onChange={handleChange('name_prefix')}
              >
                <MenuItem value="Mr.">Mr.</MenuItem>
                <MenuItem value="Mrs.">Mrs.</MenuItem>
                <MenuItem value="Ms.">Ms.</MenuItem>
                <MenuItem value="Dr.">Dr.</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                required
                fullWidth
                label="First Name"
                value={formData.first_name || ''}
                onChange={handleChange('first_name')}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Middle Name"
                value={formData.middle_name || ''}
                onChange={handleChange('middle_name')}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                required
                fullWidth
                label="Last Name"
                value={formData.last_name || ''}
                onChange={handleChange('last_name')}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Suffix"
                value={formData.name_suffix || ''}
                onChange={handleChange('name_suffix')}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                select
                fullWidth
                label="Gender"
                value={formData.gender || ''}
                onChange={handleChange('gender')}
              >
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Birth Date"
                type="date"
                value={formData.birth_date || ''}
                onChange={handleChange('birth_date')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                select
                fullWidth
                label="Marital Status"
                value={formData.marital_status || ''}
                onChange={handleChange('marital_status')}
              >
                <MenuItem value="single">Single</MenuItem>
                <MenuItem value="married">Married</MenuItem>
                <MenuItem value="divorced">Divorced</MenuItem>
                <MenuItem value="widowed">Widowed</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Spouse Name"
                value={formData.spouse_name || ''}
                onChange={handleChange('spouse_name')}
              />
            </Grid>

            {/* Contact Information */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" fontWeight={500} gutterBottom>
                Contact Information
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Primary Email"
                type="email"
                value={formData.primary_email || ''}
                onChange={handleChange('primary_email')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Alternate Email"
                type="email"
                value={formData.alternate_email || ''}
                onChange={handleChange('alternate_email')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Primary Phone"
                value={formData.primary_phone || ''}
                onChange={handleChange('primary_phone')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Mobile Phone"
                value={formData.mobile_phone || ''}
                onChange={handleChange('mobile_phone')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Home Phone"
                value={formData.home_phone || ''}
                onChange={handleChange('home_phone')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Work Phone"
                value={formData.work_phone || ''}
                onChange={handleChange('work_phone')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Fax"
                value={formData.fax_phone || ''}
                onChange={handleChange('fax_phone')}
              />
            </Grid>

            {/* Primary Address */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" fontWeight={500} gutterBottom>
                Primary Address
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address Line 1"
                value={formData.address_line1 || ''}
                onChange={handleChange('address_line1')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address Line 2"
                value={formData.address_line2 || ''}
                onChange={handleChange('address_line2')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                value={formData.city || ''}
                onChange={handleChange('city')}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="State"
                value={formData.state || ''}
                onChange={handleChange('state')}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="ZIP Code"
                value={formData.zip_code || ''}
                onChange={handleChange('zip_code')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Country"
                value={formData.country || ''}
                onChange={handleChange('country')}
              />
            </Grid>

            {/* Home Address */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" fontWeight={500} gutterBottom>
                Home Address
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Home Address Line 1"
                value={formData.home_address_line1 || ''}
                onChange={handleChange('home_address_line1')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Home Address Line 2"
                value={formData.home_address_line2 || ''}
                onChange={handleChange('home_address_line2')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Home City"
                value={formData.home_city || ''}
                onChange={handleChange('home_city')}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Home State"
                value={formData.home_state || ''}
                onChange={handleChange('home_state')}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Home ZIP Code"
                value={formData.home_zip_code || ''}
                onChange={handleChange('home_zip_code')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Home Country"
                value={formData.home_country || ''}
                onChange={handleChange('home_country')}
              />
            </Grid>

            {/* Case Information */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" fontWeight={500} gutterBottom>
                Case Information
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Case Type"
                value={formData.case_type || ''}
                onChange={handleChange('case_type')}
              >
                <MenuItem value="Corporate">Corporate</MenuItem>
                <MenuItem value="Criminal">Criminal</MenuItem>
                <MenuItem value="Family">Family</MenuItem>
                <MenuItem value="Immigration">Immigration</MenuItem>
                <MenuItem value="Real Estate">Real Estate</MenuItem>
                <MenuItem value="Tax">Tax</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Case Status"
                value={formData.case_status || ''}
                onChange={handleChange('case_status')}
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Closed">Closed</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Case Date"
                type="date"
                value={formData.case_date || ''}
                onChange={handleChange('case_date')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date of Injury"
                type="date"
                value={formData.date_of_injury || ''}
                onChange={handleChange('date_of_injury')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Professional Information */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" fontWeight={500} gutterBottom>
                Professional Information
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Company Name"
                value={formData.company_name || ''}
                onChange={handleChange('company_name')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Job Title"
                value={formData.job_title || ''}
                onChange={handleChange('job_title')}
              />
            </Grid>

            {/* Preferences */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" fontWeight={500} gutterBottom>
                Preferences
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Preferred Language"
                value={formData.preferred_language || ''}
                onChange={handleChange('preferred_language')}
              >
                <MenuItem value="English">English</MenuItem>
                <MenuItem value="Spanish">Spanish</MenuItem>
                <MenuItem value="French">French</MenuItem>
                <MenuItem value="German">German</MenuItem>
                <MenuItem value="Chinese">Chinese</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Communication Preference"
                value={formData.communication_preference || ''}
                onChange={handleChange('communication_preference')}
              >
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="phone">Phone</MenuItem>
                <MenuItem value="text">Text</MenuItem>
                <MenuItem value="mail">Mail</MenuItem>
              </TextField>
            </Grid>

            {/* Dynamic Columns */}
            {dynamicColumns.length > 0 && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" fontWeight={500} gutterBottom>
                    Additional Information
                  </Typography>
                </Grid>
                {dynamicColumns.map((column) => (
                  <DynamicFieldRenderer
                    key={column.id}
                    column={column}
                    value={formData[column.column_name]}
                    onChange={handleDynamicFieldChange}
                  />
                ))}
              </>
            )}

            {/* Custom Fields */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" fontWeight={500} gutterBottom>
                Custom Fields
              </Typography>
              {formData.user_defined_fields && Object.keys(formData.user_defined_fields).length > 0 ? (
                <List>
                  {Object.entries(formData.user_defined_fields).map(([name, value]) => (
                    <ListItem key={name}>
                      <ListItemText
                        primary={name}
                        secondary={value}
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => handleDeleteCustomField(name)}>
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No custom fields added
                </Typography>
              )}
              <Button
                variant="outlined"
                onClick={() => setCustomFieldsOpen(true)}
                sx={{ mt: 2 }}
              >
                Manage Custom Fields
              </Button>
            </Grid>

            {/* Documents - Now available for both create and edit modes */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" fontWeight={500} gutterBottom>
                Documents
              </Typography>
              {formData.client_documents && Object.keys(formData.client_documents).length > 0 ? (
                <List>
                  {Object.entries(formData.client_documents).map(([name, url]) => (
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
                        <IconButton onClick={() => window.open(url, '_blank')}>
                          <PreviewIcon />
                        </IconButton>
                        <IconButton edge="end" onClick={() => handleDeleteDocument(name)}>
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No documents uploaded
                </Typography>
              )}
              <Button
                variant="outlined"
                onClick={() => setDocumentsOpen(true)}
                sx={{ mt: 2 }}
              >
                Manage Documents
              </Button>
              {mode === 'create' && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Note: Documents uploaded during client creation will be associated with the client once saved.
                </Typography>
              )}
            </Grid>

            {/* Management */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" fontWeight={500} gutterBottom>
                Management
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active ?? true}
                    onChange={handleChange('is_active')}
                  />
                }
                label="Active Client"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {mode === 'create' ? 'Create Client' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      <CustomFieldsDialog
        open={customFieldsOpen}
        onClose={() => setCustomFieldsOpen(false)}
        fields={formData.user_defined_fields || {}}
        onSave={handleCustomFieldsSave}
      />

      <DocumentsDialog
        open={documentsOpen}
        onClose={() => setDocumentsOpen(false)}
        documents={formData.client_documents || {}}
        onSave={handleDocumentsSave}
        clientId={getClientIdForDocuments()}
      />
    </>
  );
};

export default ClientDialog;