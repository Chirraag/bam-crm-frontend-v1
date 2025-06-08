export interface Message {
  id: string;
  client_id: string;
  phone_number: string;
  content: string;
  direction: 'inbound' | 'outbound';
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'received';
  telnyx_message_id?: string;
  created_at: string;
}

export interface ClientMessages {
  client_id: string;
  client_phone: string;
  messages: Message[];
}

export interface PhoneNumber {
  type: string;
  number: string;
}

export interface ClientPhoneNumbers {
  client_id: string;
  phone_numbers: PhoneNumber[];
}

export interface SendMessageRequest {
  client_id: string;
  content: string;
  phone_number?: string; // Optional override for client's phone
}

export interface SendMessageResponse extends Message {
  // Response includes the created message
}