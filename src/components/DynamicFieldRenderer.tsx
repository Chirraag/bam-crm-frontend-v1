import React from 'react';
import {
  TextField,
  MenuItem,
  FormControlLabel,
  Switch,
  Grid,
  Typography
} from '@mui/material';
import { ColumnMetadata } from '../types/client';
import { columnService } from '../services/columnService';

interface DynamicFieldRendererProps {
  column: ColumnMetadata;
  value: any;
  onChange: (columnName: string, value: any) => void;
  disabled?: boolean;
}

const DynamicFieldRenderer: React.FC<DynamicFieldRendererProps> = ({
  column,
  value,
  onChange,
  disabled = false
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = columnService.parseValue(event.target.value, column.column_type);
    onChange(column.column_name, newValue);
  };

  const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(column.column_name, event.target.checked);
  };

  const formatDisplayValue = (val: any) => {
    if (val === null || val === undefined) return '';
    
    switch (column.column_type) {
      case 'date':
        if (val instanceof Date) return val.toISOString().split('T')[0];
        if (typeof val === 'string' && val.includes('T')) return val.split('T')[0];
        return val;
      case 'timestamp':
        if (val instanceof Date) return val.toISOString().slice(0, 16);
        if (typeof val === 'string' && val.includes('T')) return val.slice(0, 16);
        return val;
      default:
        return val;
    }
  };

  const getFieldLabel = () => {
    return columnService.formatDisplayName(column.column_name);
  };

  switch (column.column_type) {
    case 'boolean':
      return (
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(value)}
                onChange={handleSwitchChange}
                disabled={disabled}
              />
            }
            label={getFieldLabel()}
          />
        </Grid>
      );

    case 'dropdown':
      return (
        <Grid item xs={12} sm={6}>
          <TextField
            select
            fullWidth
            label={getFieldLabel()}
            value={value || ''}
            onChange={handleChange}
            disabled={disabled}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {column.dropdown_options?.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      );

    case 'integer':
      return (
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label={getFieldLabel()}
            type="number"
            value={value || ''}
            onChange={handleChange}
            disabled={disabled}
          />
        </Grid>
      );

    case 'date':
      return (
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label={getFieldLabel()}
            type="date"
            value={formatDisplayValue(value)}
            onChange={handleChange}
            disabled={disabled}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
      );

    case 'timestamp':
      return (
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label={getFieldLabel()}
            type="datetime-local"
            value={formatDisplayValue(value)}
            onChange={handleChange}
            disabled={disabled}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
      );

    default: // string
      return (
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label={getFieldLabel()}
            value={value || ''}
            onChange={handleChange}
            disabled={disabled}
          />
        </Grid>
      );
  }
};

export default DynamicFieldRenderer;