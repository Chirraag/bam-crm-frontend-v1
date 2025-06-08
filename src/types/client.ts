export interface Client {
  id?: string | number;
  client_number?: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  name_prefix?: string;
  name_suffix?: string;
  full_name?: string;
  primary_phone?: string;
  mobile_phone?: string;
  alternate_phone?: string;
  home_phone?: string;
  work_phone?: string;
  fax_phone?: string;
  primary_email?: string;
  alternate_email?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  home_address_line1?: string;
  home_address_line2?: string;
  home_city?: string;
  home_state?: string;
  home_zip_code?: string;
  home_country?: string;
  birth_date?: string;
  gender?: string;
  marital_status?: string;
  spouse_name?: string;
  case_type?: string;
  case_status?: string;
  case_date?: string;
  date_of_injury?: string;
  company_name?: string;
  job_title?: string;
  preferred_language?: string;
  communication_preference?: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
  is_active: boolean;
  user_defined_fields?: Record<string, any>;
  client_documents?: Record<string, string>;
  client_notes?: Record<string, any>;
  client_tasks?: Record<string, any>;
  client_billing?: Record<string, any>;
  client_preferences?: Record<string, any>;
  // Dynamic columns will be added at runtime
  [key: string]: any;
}

export interface ColumnMetadata {
  id: string;
  column_name: string;
  column_type: 'string' | 'integer' | 'date' | 'timestamp' | 'boolean' | 'dropdown';
  dropdown_options?: string[];
  created_at: string;
}

export interface CustomField {
  name: string;
  value: any;
}

export interface ClientNote {
  id: string;
  content: string;
  created_at: string;
  created_by: string;
  category?: string;
}

export interface ClientTask {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  status: 'pending' | 'in_progress' | 'completed';
  assigned_to?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface ClientBilling {
  id: string;
  amount: number;
  description: string;
  date: string;
  status: 'pending' | 'paid' | 'overdue';
  payment_method?: string;
}

export interface ClientPreference {
  key: string;
  value: any;
  category: string;
}