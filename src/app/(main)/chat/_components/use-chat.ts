import { create } from "zustand";

import { type Conversation, conversations as defaultConversations } from "./data";

type Config = {
  selected: Conversation["id"] | null;
};

type ChatStore = {
  chat: Config;
  setChat: (chat: Config) => void;
  conversations: Conversation[];
  sendMessage: (conversationId: number, text: string) => void;
  togglePin: (conversationId: number) => void;
  markConversationRead: (conversationId: number) => void;
};

export const useChatStore = create<ChatStore>((set, get) => ({
  chat: {
    selected: defaultConversations[0].id,
  },
  setChat: (chat) => set({ chat }),
  conversations: defaultConversations,
  sendMessage: (conversationId, text) => {
    if (!text.trim()) return;

    const newMessage = {
      id: Date.now(),
      align: "end" as const,
      text: text.trim(),
      time: "Just now",
    };

    set((state) => ({
      conversations: state.conversations.map((c) => {
        if (c.id === conversationId) {
          return {
            ...c,
            preview: text.trim(),
            time: "Just now",
            messages: [...c.messages, newMessage],
          };
        }
        return c;
      }),
    }));

    // Simulate realistic inbound response after 1.5s
    setTimeout(() => {
      const activeConv = get().conversations.find((c) => c.id === conversationId);
      if (!activeConv) return;

      const automatedReplies = [
        "Thanks for the update! Reviewing the logs right now.",
        "Got it, that aligns with what our team is seeing. Proceeding with the fix.",
        "Understood. I will verify in staging and let you know as soon as checks pass.",
        "Appreciate the quick response! Everything looks good on our end now.",
      ];
      const replyText = automatedReplies[Math.floor(Math.random() * automatedReplies.length)];

      const inboundMessage = {
        id: Date.now() + 1,
        align: "start" as const,
        text: replyText,
        time: "Just now",
        reaction: "👍",
      };

      set((state) => ({
        conversations: state.conversations.map((c) => {
          if (c.id === conversationId) {
            return {
              ...c,
              preview: replyText,
              time: "Just now",
              messages: [...c.messages, inboundMessage],
            };
          }
          return c;
        }),
      }));
    }, 1500);
  },
  togglePin: (conversationId) => {
    set((state) => ({
      conversations: state.conversations.map((c) => {
        if (c.id === conversationId) {
          return {
            ...c,
            group: c.group === "Pinned" ? "Today" : "Pinned",
          };
        }
        return c;
      }),
    }));
  },
  markConversationRead: (conversationId) => {
    set((state) => ({
      conversations: state.conversations.map((c) => {
        if (c.id === conversationId) {
          return {
            ...c,
            isUnread: false,
            unreadCount: 0,
          };
        }
        return c;
      }),
    }));
  },
}));

export function useChat() {
  const chat = useChatStore((state) => state.chat);
  const setChat = useChatStore((state) => state.setChat);

  return [chat, setChat] as const;
}
