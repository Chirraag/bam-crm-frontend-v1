import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  CircularProgress,
  Snackbar,
} from "@mui/material";
import { Client } from "../types/client";
import { api } from "../utils/api";
import { Mail } from "../types/mail";

type elem = {
  subject: string;
  chain: Mail[];
  thread_id: string;
};

type EmailDialogProps = {
  open: boolean;
  onClose: () => void;
  client: Client;
  Mails: elem[];
  setMails: (mails: elem[]) => void;
};

const EmailDialog: React.FC<EmailDialogProps> = ({
  open,
  onClose,
  client,
  Mails,
  setMails,
}) => {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);
  const handleSend = async () => {
    if (!subject || !content) {
      alert("Subject and content cannot be empty");
      return;
    }
    setLoading(true);
    try {
      const emailData: Mail = {
        client_id: client.id,
        thread_id: "",
        direction: "outgoing",
        to_address: [client.primary_email || client.alternate_email || ""],
        subject: subject,
        raw_body: content,
        parsed_body: content,
      };
      console.log("Sending email with data:", emailData);
      const response = await api.post("/api/mail", emailData);
      if (!response) {
        throw new Error("Failed to send email");
      } else {
        setMails([
          {
            subject: response["subject"],
            chain: [response],
            thread_id: response["thread_id"],
          },
          ...Mails,
        ]);
        console.log("Email sent successfully:", response);
      }
    } catch (error) {
      alert("Failed to send email. Please try again.");
      console.error("Error sending email:", error);
      return;
    }
    setLoading(false);
    setSnackOpen(true);
    setTimeout(() => {
      setSubject("");
      setContent("");
      onClose();
    }, 2000);
  };

  const handleCancel = () => {
    setSubject("");
    setContent("");
    onClose();
  };

  return (
    <Dialog
      open={open && client != null}
      onClose={handleCancel}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Send Email</DialogTitle>
      <DialogContent>
        <TextField
          label="Subject"
          fullWidth
          variant="outlined"
          margin="dense"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <TextField
          label="Content"
          fullWidth
          variant="outlined"
          margin="dense"
          multiline
          minRows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} color="inherit">
          Cancel
        </Button>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
            <CircularProgress size={30} />
          </Box>
        ) : (
          <Button onClick={handleSend} color="primary" variant="contained">
            Send
          </Button>
        )}
      </DialogActions>
      <Snackbar
        open={snackOpen}
        autoHideDuration={3000}
        onClose={() => setSnackOpen(false)}
        message="Mail sent Successfully"
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Dialog>
  );
};

export default EmailDialog;
