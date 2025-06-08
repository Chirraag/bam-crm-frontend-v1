import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Box,
  Chip,
  Divider,
  useTheme,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { Description as DocumentIcon } from '@mui/icons-material';
import { Client, ColumnMetadata } from '../types/client';
import { columnService } from '../services/columnService';
import { useState, useEffect } from 'react';

interface ClientDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  client: Client | null;
}

const ClientDetailsDialog = ({ open, onClose, client }: ClientDetailsDialogProps) => {
  const theme = useTheme();
  const [dynamicColumns, setDynamicColumns] = useState<ColumnMetadata[]>([]);

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

  if (!client) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return {
          bg: '#E8F5E9',
          text: '#2E7D32'
        };
      case 'Pending':
        return {
          bg: '#FFF3E0',
          text: '#E65100'
        };
      case 'Closed':
        return {
          bg: '#FFEBEE',
          text: '#C62828'
        };
      default:
        return {
          bg: '#E8F5E9',
          text: '#2E7D32'
        };
    }
  };

  const DetailSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.secondary, fontSize: '0.875rem', fontWeight: 500 }}>
        {title}
      </Typography>
      <Box sx={{ pl: 0 }}>{children}</Box>
    </Box>
  );

  const DetailItem = ({ label, value }: { label: string; value: string | undefined }) => (
    <Grid item xs={12} sm={6}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
          {label}
        </Typography>
        <Typography variant="body1">{value || '—'}</Typography>
      </Box>
    </Grid>
  );

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const formatDynamicValue = (value: any, columnType: string) => {
    if (value === null || value === undefined) return '—';
    
    switch (columnType) {
      case 'boolean':
        return value ? 'Yes' : 'No';
      case 'date':
        return formatDate(value);
      case 'timestamp':
        try {
          return new Date(value).toLocaleString();
        } catch {
          return value;
        }
      default:
        return value.toString();
    }
  };

  const isViewableInBrowser = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    return ['pdf', 'jpg', 'jpeg', 'png', 'gif'].includes(ext || '');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 500 }}>Client Details</Typography>
          <Chip
            label={client.case_status || 'Active'}
            size="small"
            sx={{
              bgcolor: getStatusColor(client.case_status || '').bg,
              color: getStatusColor(client.case_status || '').text,
              fontWeight: 500,
              border: 'none',
              '& .MuiChip-label': {
                px: 2,
              },
            }}
          />
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <DetailSection title="BASIC INFORMATION">
          <Grid container>
            <DetailItem label="Client Number" value={client.client_number} />
            <DetailItem label="Name Prefix" value={client.name_prefix} />
            <DetailItem label="First Name" value={client.first_name} />
            <DetailItem label="Middle Name" value={client.middle_name} />
            <DetailItem label="Last Name" value={client.last_name} />
            <DetailItem label="Name Suffix" value={client.name_suffix} />
            <DetailItem label="Full Name" value={client.full_name} />
          </Grid>
        </DetailSection>

        <Divider sx={{ my: 3 }} />

        <DetailSection title="CONTACT INFORMATION">
          <Grid container>
            <DetailItem label="Primary Email" value={client.primary_email} />
            <DetailItem label="Alternate Email" value={client.alternate_email} />
            <DetailItem label="Primary Phone" value={client.primary_phone} />
            <DetailItem label="Mobile Phone" value={client.mobile_phone} />
            <DetailItem label="Alternate Phone" value={client.alternate_phone} />
            <DetailItem label="Home Phone" value={client.home_phone} />
            <DetailItem label="Work Phone" value={client.work_phone} />
            <DetailItem label="Fax" value={client.fax_phone} />
          </Grid>
        </DetailSection>

        <Divider sx={{ my: 3 }} />

        <DetailSection title="PRIMARY ADDRESS">
          <Grid container>
            <DetailItem label="Address Line 1" value={client.address_line1} />
            <DetailItem label="Address Line 2" value={client.address_line2} />
            <DetailItem label="City" value={client.city} />
            <DetailItem label="State" value={client.state} />
            <DetailItem label="ZIP Code" value={client.zip_code} />
            <DetailItem label="Country" value={client.country} />
          </Grid>
        </DetailSection>

        <Divider sx={{ my: 3 }} />

        <DetailSection title="HOME ADDRESS">
          <Grid container>
            <DetailItem label="Address Line 1" value={client.home_address_line1} />
            <DetailItem label="Address Line 2" value={client.home_address_line2} />
            <DetailItem label="City" value={client.home_city} />
            <DetailItem label="State" value={client.home_state} />
            <DetailItem label="ZIP Code" value={client.home_zip_code} />
            <DetailItem label="Country" value={client.home_country} />
          </Grid>
        </DetailSection>

        <Divider sx={{ my: 3 }} />

        <DetailSection title="PERSONAL DETAILS">
          <Grid container>
            <DetailItem label="Birth Date" value={formatDate(client.birth_date)} />
            <DetailItem label="Gender" value={client.gender} />
            <DetailItem label="Marital Status" value={client.marital_status} />
            <DetailItem label="Spouse Name" value={client.spouse_name} />
            <DetailItem label="Preferred Language" value={client.preferred_language} />
            <DetailItem label="Communication Preference" value={client.communication_preference} />
          </Grid>
        </DetailSection>

        <Divider sx={{ my: 3 }} />

        <DetailSection title="EMPLOYMENT INFORMATION">
          <Grid container>
            <DetailItem label="Company Name" value={client.company_name} />
            <DetailItem label="Job Title" value={client.job_title} />
          </Grid>
        </DetailSection>

        <Divider sx={{ my: 3 }} />

        <DetailSection title="CASE INFORMATION">
          <Grid container>
            <DetailItem label="Case Type" value={client.case_type} />
            <DetailItem label="Case Status" value={client.case_status} />
            <DetailItem label="Case Date" value={formatDate(client.case_date)} />
            <DetailItem label="Date of Injury" value={formatDate(client.date_of_injury)} />
          </Grid>
        </DetailSection>

        {/* Dynamic Columns */}
        {dynamicColumns.length > 0 && (
          <>
            <Divider sx={{ my: 3 }} />
            <DetailSection title="ADDITIONAL INFORMATION">
              <Grid container>
                {dynamicColumns.map((column) => (
                  <DetailItem
                    key={column.id}
                    label={columnService.formatDisplayName(column.column_name)}
                    value={formatDynamicValue(client[column.column_name], column.column_type)}
                  />
                ))}
              </Grid>
            </DetailSection>
          </>
        )}

        {client.user_defined_fields && Object.keys(client.user_defined_fields).length > 0 && (
          <>
            <Divider sx={{ my: 3 }} />
            <DetailSection title="CUSTOM FIELDS">
              <Grid container>
                {Object.entries(client.user_defined_fields).map(([key, value]) => (
                  <DetailItem key={key} label={key} value={value} />
                ))}
              </Grid>
            </DetailSection>
          </>
        )}

        {client.client_documents && Object.keys(client.client_documents).length > 0 && (
          <>
            <Divider sx={{ my: 3 }} />
            <DetailSection title="DOCUMENTS">
              <List>
                {Object.entries(client.client_documents).map(([name, url]) => (
                  <ListItem key={name} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <DocumentIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={name}
                      secondary={
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Link 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            sx={{ 
                              display: 'inline-flex', 
                              alignItems: 'center',
                              color: theme.palette.primary.main,
                              textDecoration: 'none',
                              '&:hover': {
                                textDecoration: 'underline'
                              }
                            }}
                          >
                            {isViewableInBrowser(url) ? 'View' : 'Download'}
                          </Link>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </DetailSection>
          </>
        )}

        <Divider sx={{ my: 3 }} />

        <DetailSection title="RECORD INFORMATION">
          <Grid container>
            <DetailItem label="Created At" value={formatDate(client.created_at)} />
            <DetailItem label="Updated At" value={formatDate(client.updated_at)} />
            <DetailItem label="Created By" value={client.created_by} />
            <DetailItem label="Active Status" value={client.is_active ? 'Active' : 'Inactive'} />
          </Grid>
        </DetailSection>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ClientDetailsDialog;