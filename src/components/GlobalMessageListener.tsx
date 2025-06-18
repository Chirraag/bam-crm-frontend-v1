import { useEffect, useRef } from "react";
import { supabase } from "../utils/supabaseClient";
import { useNotifications } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";
import { Message } from "../types/message";
import { Client } from "../types/client";

export default function GlobalMessageListener() {
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const subscriptionRef = useRef<any>(null);
  const clientsCache = useRef<Map<string, Client>>(new Map());

  useEffect(() => {
    if (!user) return;

    const setupGlobalSubscription = async () => {
      try {
        // Pre-fetch all clients for quick lookup
        const clients = await api.get("/api/clients");
        clientsCache.current.clear();
        clients.forEach((client: Client) => {
          if (client.id) {
            clientsCache.current.set(client.id.toString(), client);
          }
        });

        // Set up real-time subscription for ALL messages
        subscriptionRef.current = supabase
          .channel("global-messages")
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
            },
            async (payload) => {
              const newMessage = payload.new as Message;

              // Only show notifications for inbound messages
              if (newMessage.direction === "inbound") {
                // Try to get client from cache first
                let client = clientsCache.current.get(newMessage.client_id);

                // If not in cache, fetch from API
                if (!client) {
                  try {
                    const clients = await api.get("/api/clients");
                    const foundClient = clients.find(
                      (c: Client) => c.id?.toString() === newMessage.client_id,
                    );
                    if (foundClient) {
                      client = foundClient;
                      clientsCache.current.set(
                        newMessage.client_id,
                        foundClient,
                      );
                    }
                  } catch (error) {
                    console.error(
                      "Error fetching client for notification:",
                      error,
                    );
                  }
                }

                // Create notification
                addNotification({
                  id: newMessage.id,
                  clientId: newMessage.client_id,
                  clientName: client
                    ? `${client.first_name} ${client.last_name}`
                    : "Unknown Client",
                  message: newMessage.content,
                  timestamp: new Date(newMessage.created_at),
                });
              }
            },
          )
          .subscribe();

        console.log("Global message subscription established");
      } catch (error) {
        console.error("Error setting up global message subscription:", error);
      }
    };

    setupGlobalSubscription();

    // Cleanup subscription on unmount
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        console.log("Global message subscription cleaned up");
      }
    };
  }, [user, addNotification]);

  // This component doesn't render anything
  return null;
}
