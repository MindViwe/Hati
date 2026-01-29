import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { api } from "@shared/routes";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: number;
  title: string;
}

export function useConversations() {
  return useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
    queryFn: async () => {
      const res = await fetch("/api/conversations");
      if (!res.ok) throw new Error("Failed to fetch conversations");
      return await res.json();
    },
  });
}

export function useConversation(id: number | null) {
  return useQuery<{ id: number; title: string; messages: Message[] }>({
    queryKey: ["/api/conversations", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await fetch(`/api/conversations/${id}`);
      if (!res.ok) throw new Error("Failed to fetch conversation");
      return await res.json();
    },
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("Failed to create conversation");
      return await res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/conversations"] }),
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/conversations/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete conversation");
      return await res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/conversations"] }),
  });
}

export function useChatStream(conversationId: number) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const queryClient = useQueryClient();

  // Load initial messages
  const { data } = useConversation(conversationId);
  
  useEffect(() => {
    if (data?.messages) {
      setMessages(data.messages);
    }
  }, [data?.messages]);

  const sendMessage = async (content: string) => {
    // Optimistically add user message
    const userMsg: Message = { role: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) throw new Error("Failed to send message");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let assistantMsg: Message = { role: "assistant", content: "" };
      
      // Add empty assistant message to start streaming into
      setMessages((prev) => [...prev, assistantMsg]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.content) {
                assistantMsg.content += data.content;
                setMessages((prev) => {
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1] = { ...assistantMsg };
                  return newMsgs;
                });
              }
              
              if (data.done) {
                setIsStreaming(false);
                queryClient.invalidateQueries({ queryKey: ["/api/conversations", conversationId] });
              }
            } catch (e) {
              console.error("Error parsing SSE chunk", e);
            }
          }
        }
      }
    } catch (err) {
      console.error("Stream error", err);
      setIsStreaming(false);
    }
  };

  return { messages, sendMessage, isStreaming };
}
