export interface Mail{
    message_id? : string;
    in_reply_to? : string;
    thread_id? : string;
    client_id? : string|number;
    direction : string;
    from_address? : string;
    to_address : [string];
    subject : string;
    raw_body : string;
    parsed_body : string | null;
    received_at? : string; 
    sent_at? : string;
    attachments? : { [key: string]: string }[];
}