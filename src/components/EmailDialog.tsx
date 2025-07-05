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
  IconButton,
} from "@mui/material";

import { Client } from "../types/client";
import { api } from "../utils/api";
import { Mail } from "../types/mail";
import { supabase } from "../utils/supabaseClient";
import CloseIcon from "@mui/icons-material/Close";

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
  const [attachments, setAttachments] = useState<{ [key: string]: string }[]>([]);

  const handleUploads = async (file: File) => {
    try {
      const clientId = client.id;
      const fileExt = file.name.split(".").pop();
      const folderName = `client_${clientId}`;
      const fileName = `${folderName}/${Date.now()}.${fileExt}`;

      // For public buckets, we can upload without authentication
      const { data, error: uploadError } = await supabase.storage
        .from("client-documents")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error details:", uploadError);
        throw uploadError;
      }

      // Get the public URL for the uploaded file
      const {
        data: { publicUrl },
      } = supabase.storage.from("client-documents").getPublicUrl(fileName);
      const newAttachments = [
        ...attachments,
        {
          name: file.name,
          url: publicUrl,
        },
      ];
      setAttachments(newAttachments);
      console.log("File uploaded successfully:", newAttachments);

    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Failed to upload files. Please try again.");
      return;
    }
  };

  const handleDeleteDocument = async (docName: string) => {
    const clientId = client.id;
    if (!clientId) {
      alert("Cannot delete documents - invalid client ID");
      return;
    }

    try {
      const url = docName;

      const urlParts = url.split("/");
      const fileName = urlParts[urlParts.length - 1];
      const folderName = `client_${clientId}`;
      const fullPath = `${folderName}/${fileName}`;

      // For public buckets, we can delete without authentication
      const { error: deleteError } = await supabase.storage
        .from("client-documents")
        .remove([fullPath]);

      if (deleteError) {
        console.error("Delete error details:", deleteError);
        throw deleteError;
      }
      // Remove the file from the attachments state
      setAttachments((prev) => prev.filter((att) => att.url !== url));

      console.log("File deleted successfully:", url);
    } catch (error) {
      console.error("Error deleting document:", error);
      alert(
        error instanceof Error ? error.message : "Failed to delete document"
      );
    }
  };

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
        attachments: attachments
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

  const handleCancel = async () => {
    try {
      for (const file of attachments) {
        await handleDeleteDocument(file.url);
      }
      setSubject("");
      setContent("");
      onClose();
    } catch (error) {
      console.error("Error during cancel operation:", error);
    }
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

        {/* File Attachment Section */}
        <Box sx={{ mt: 2 }}>
          <input
            type="file"
            multiple
            id="file-input"
            style={{ display: "none" }}
            onChange={async (e) => {
              e.stopPropagation();
              if (e.target.files && e.target.files[0]) {
                await handleUploads(e.target.files[0]);
              }
            }}
          />
          <label htmlFor="file-input">
            <Button variant="outlined" component="span">
              Attach Files
            </Button>
          </label>

          {/* Show file list with preview + delete */}
          {attachments?.length > 0 && (
            <Box sx={{ mt: 2 }}>
              {attachments.map((file, index) => (
                <Box
                  key={index}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: "#f5f5f5",
                    p: 1,
                    borderRadius: 1,
                    mb: 1,
                  }}
                >
                  {/* Preview link */}
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: "none", color: "#1976d2" }}
                  >
                    {file.name}
                  </a>

                  {/* Delete icon */}
                  <IconButton
                    size="small"
                    onClick={async (e) => {
                      e.stopPropagation();
                      await handleDeleteDocument(file.url);
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
        </Box>
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
