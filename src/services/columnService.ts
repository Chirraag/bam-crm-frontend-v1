import { ColumnMetadata } from '../types/client';
import { supabase } from '../utils/supabaseClient';

class ColumnService {
  async getColumnMetadata(): Promise<ColumnMetadata[]> {
    try {
      const { data, error } = await supabase
        .from('column_metadata')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching column metadata:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching column metadata:', error);
      return [];
    }
  }

  async createColumn(columnData: Omit<ColumnMetadata, 'id' | 'created_at'>): Promise<ColumnMetadata> {
    try {
      const { data, error } = await supabase
        .from('column_metadata')
        .insert([columnData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating column:', error);
      throw error;
    }
  }

  async updateColumn(id: string, columnData: Partial<ColumnMetadata>): Promise<ColumnMetadata> {
    try {
      const { data, error } = await supabase
        .from('column_metadata')
        .update(columnData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating column:', error);
      throw error;
    }
  }

  async deleteColumn(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('column_metadata')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error deleting column:', error);
      throw error;
    }
  }

  // Get display name by removing 'custom_' prefix
  getDisplayName(columnName: string): string {
    if (columnName.startsWith('custom_')) {
      return columnName.substring(7); // Remove 'custom_' prefix
    }
    return columnName;
  }

  // Format display name for UI (capitalize words, replace underscores with spaces)
  formatDisplayName(columnName: string): string {
    const displayName = this.getDisplayName(columnName);
    return displayName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Get the fixed columns that are part of the Client interface
  getFixedColumns(): string[] {
    return [
      'id', 'client_number', 'first_name', 'last_name', 'middle_name', 'name_prefix', 'name_suffix',
      'full_name', 'primary_phone', 'mobile_phone', 'alternate_phone', 'home_phone', 'work_phone',
      'fax_phone', 'primary_email', 'alternate_email', 'address_line1', 'address_line2', 'city',
      'state', 'zip_code', 'country', 'home_address_line1', 'home_address_line2', 'home_city',
      'home_state', 'home_zip_code', 'home_country', 'birth_date', 'gender', 'marital_status',
      'spouse_name', 'case_type', 'case_status', 'case_date', 'date_of_injury', 'company_name',
      'job_title', 'preferred_language', 'communication_preference', 'created_by', 'created_at',
      'updated_at', 'is_active', 'user_defined_fields', 'client_documents', 'client_notes',
      'client_tasks', 'client_billing', 'client_preferences'
    ];
  }

  // Check if a column name is a fixed column
  isFixedColumn(columnName: string): boolean {
    return this.getFixedColumns().includes(columnName);
  }

  // Format value based on column type
  formatValue(value: any, columnType: string): any {
    if (value === null || value === undefined) return '';
    
    switch (columnType) {
      case 'integer':
        return parseInt(value) || 0;
      case 'boolean':
        return Boolean(value);
      case 'date':
      case 'timestamp':
        return value instanceof Date ? value.toISOString() : value;
      default:
        return value;
    }
  }

  // Parse value from form input based on column type
  parseValue(value: any, columnType: string): any {
    if (value === '' || value === null || value === undefined) return null;
    
    switch (columnType) {
      case 'integer':
        return parseInt(value) || null;
      case 'boolean':
        return value === 'true' || value === true;
      case 'date':
      case 'timestamp':
        return value;
      default:
        return value;
    }
  }
}

export const columnService = new ColumnService();