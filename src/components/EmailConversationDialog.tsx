import React, { useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { api } from "../utils/api";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { Fab } from "@mui/material";
import EmailDialog from "./EmailDialog";
import { Client } from "../types/client";
import { Mail } from "../types/mail";

interface MailConversationDialogProps {
  open: boolean;
  onClose: () => void;
  client: Client | null;
}
type elem = {
  subject: string;
  chain: Mail[];
  thread_id: string;
};

const MailConversationDialog: React.FC<MailConversationDialogProps> = ({
  open,
  onClose,
  client,
}) => {
  const [Mails, setMails] = React.useState<Array<elem>>([]);
  const [openConversation, setOpenConversation] =
    React.useState<boolean>(false);
  const [composeOpen, setComposeOpen] = React.useState<boolean>(false);
  const [_mails, setMailsData] = React.useState<Mail[]>([]);
  const [content, setContent] = React.useState<string>("");
  const [messageIndex, setMessageIndex] = React.useState<number>(-1);

  const [loadMails, setLoadMails] = React.useState<Boolean>(false);
  const [mailSend, setMailSend] = React.useState<Boolean>(false);

  useEffect(() => {
    async function groupConversationsByParentSubject() {
      if (!open || !client || composeOpen || openConversation) return;
      try {
        setLoadMails(true);
        const mails: Mail[] = await api.get(`/api/mail/${client?.id}`);
        // Find parent messages (no in_reply_to)
        const parents = mails.filter((m) => m.in_reply_to === null);

        const result: Array<elem> = [];

        for (const parent of parents) {
          const chain: Mail[] = [parent];

          // Build the chain by following in_reply_to links
          let cursor = parent;
          while (true) {
            // find the next message whose in_reply_to === cursor.message_id
            const next = mails.find((m) => m.in_reply_to === cursor.message_id);
            if (!next) break;
            chain.push(next);
            cursor = next;
          }

          result.push({
            subject: parent.subject || "",
            chain,
            thread_id: parent.thread_id || "",
          });
        }
        const sortedResult = result.sort((a, b) => {
          const aLast = mails
            .filter((m) => m.thread_id === a.thread_id)
            .sort(
              (x, y) =>
                new Date(y.sent_at || y.received_at || "").getTime() -
                new Date(x.sent_at || x.received_at || "").getTime()
            )[0];
          const bLast = mails
            .filter((m) => m.thread_id === b.thread_id)
            .sort(
              (x, y) =>
                new Date(y.sent_at || y.received_at || "").getTime() -
                new Date(x.sent_at || x.received_at || "").getTime()
            )[0];

          const aTime = new Date(
            aLast.sent_at || aLast.received_at || ""
          ).getTime();
          const bTime = new Date(
            bLast.sent_at || bLast.received_at || ""
          ).getTime();
          return bTime - aTime;
        });
        setMails(sortedResult);
        setLoadMails(false);
      } catch (error) {
        alert("Failed to load conversations. Please try again.");
        console.error("Error grouping conversations:", error);
      }
    }
    groupConversationsByParentSubject();
  }, [client]);

  const handleSend = async () => {
    setMailSend(true);
    setContent(content.trim());
    if (!content) {
      alert("Content cannot be empty");
      return;
    }
    try {
      const emailData: Mail = _mails[0];
      emailData.direction = "outgoing";
      emailData.parsed_body = content;
      emailData.raw_body = content;
      emailData.in_reply_to = _mails[_mails.length - 1].message_id;
      emailData.message_id = "";
      console.log("Sending email with data:", emailData);
      const response = await api.post("/api/mail", emailData);
      if (!response) {
        throw new Error("Failed to send email");
      } else {
        const updatedMails = [..._mails, response];
        setMailsData(updatedMails);
        const tempMails = [...Mails];
        tempMails[messageIndex]["chain"] = updatedMails;
        setMails(tempMails);
        console.log("Email sent successfully:", response);
      }
    } catch (error) {
      console.error("Error sending email:", error);
      return;
    }
    setContent("");
    setMailSend(false);
  };

  return (
    <>
      <Dialog
        open={client != null && open && !openConversation && !composeOpen}
        onClose={onClose}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle
          sx={{ position: "relative", fontWeight: "bold", fontSize: "1.25rem" }}
        >
          Conversation with{" "}
          {client?.primary_email || client?.alternate_email || ""}
          <IconButton
            onClick={onClose}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: "grey.500",
              transition: "color 0.3s",
              "&:hover": { color: "red.500" },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        {loadMails ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 20 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <DialogContent
              dividers
              sx={{
                backgroundColor: "#f9f9fb",
                px: 3,
                position: "relative",
                pb: "20px",
              }}
            >
              {Mails.length === 0 ? (
                <Typography align="center" color="textSecondary" sx={{ py: 5 }}>
                  No conversation yet.
                </Typography>
              ) : (
                Mails.map((mail, index) => {
                  const lastMsg = mail["chain"][mail["chain"].length - 1];
                  return (
                    <Box
                      key={index}
                      display="flex"
                      flexDirection="column"
                      mb={3}
                      sx={{
                        backgroundColor: "white",
                        borderRadius: 2,
                        boxShadow: 1,
                        p: 2,
                        justifyContent: "space-between",
                        transition: "box-shadow 0.3s",
                        "&:hover": {
                          boxShadow: 3,
                          cursor: "pointer",
                        },
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMailsData(mail?.chain);
                        setMessageIndex(index);
                        setOpenConversation(true);
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        color="black"
                        gutterBottom
                        sx={{ wordBreak: "break-word" }}
                      >
                        {mail.subject}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="textSecondary"
                        sx={{ fontStyle: "italic", fontSize: "0.75rem" }}
                      >
                        {new Date(
                          lastMsg?.sent_at || lastMsg?.received_at || ""
                        ).toLocaleString()}
                      </Typography>
                    </Box>
                  );
                })
              )}
            </DialogContent>

            {/* Floating Compose Button */}
            <Fab
              color="primary"
              aria-label="compose"
              onClick={() => {
                // Call your compose logic here
                setComposeOpen(true); // Example state to open compose dialog
              }}
              sx={{
                position: "absolute",
                bottom: 16,
                right: 16,
                zIndex: 10,
              }}
            >
              <AddIcon />
            </Fab>
          </>
        )}
      </Dialog>

      <EmailDialog
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        client={client}
        Mails={Mails}
        setMails={setMails}
      />

      <Dialog
        open={openConversation}
        onClose={() => {
          setOpenConversation(false);
          setMailsData([]);
        }}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Conversation with{" "}
          {client?.primary_email || client?.alternate_email || ""}
          <IconButton
            onClick={() => {
              setOpenConversation(false);
              setMailsData([]);
            }}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ minHeight: "450px" }}>
          {_mails.length === 0 ? (
            <Typography>No conversation yet.</Typography>
          ) : (
            _mails.map((mail) => {
              const isOutgoing = mail.direction === "outgoing";
              const timestamp = mail.sent_at || mail.received_at;
              return (
                <Box
                  key={mail.message_id}
                  display="flex"
                  flexDirection="column"
                  alignItems={isOutgoing ? "flex-end" : "flex-start"}
                  mb={3}
                >
                  <Box
                    sx={{
                      backgroundColor: isOutgoing ? "#e3f2fd" : "#f3f3f3",
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      maxWidth: "75%",
                      boxShadow: 1,
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      sx={{ fontWeight: "bold" }}
                    >
                      {isOutgoing ? "You" : mail.from_address}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ whiteSpace: "pre-wrap", mt: 0.5 }}
                    >
                      {mail.parsed_body || mail.raw_body}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      sx={{ mt: 0.5, display: "block", textAlign: "right" }}
                    >
                      {new Date(timestamp || "").toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              );
            })
          )}
        </DialogContent>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            px: 3,
            py: 2,
            borderTop: "1px solid #ddd",
            backgroundColor: "#fafafa",
          }}
        >
          {/* Attachment input */}
          <IconButton component="label" size="small">
            <input
              type="file"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // handle your upload logic here
                  console.log("Attachment selected:", file);
                }
              }}
            />
            <AttachFileIcon />
          </IconButton>

          {/* Message input */}
          <Box sx={{ flexGrow: 1 }}>
            <textarea
              placeholder="Type your message..."
              rows={2}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                resize: "none",
                fontSize: "0.875rem",
                fontFamily: "sans-serif",
              }}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </Box>

          {/* Send button */}
          {mailSend ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
              <CircularProgress size={35} />
            </Box>
          ) : (
            <IconButton
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                handleSend();
              }}
            >
              <SendIcon />
            </IconButton>
          )}
        </Box>
      </Dialog>
    </>
  );
};

export default MailConversationDialog;
