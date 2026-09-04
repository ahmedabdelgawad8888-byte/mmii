import { create } from "zustand";

import { mails as initialMails, type Mail } from "./data";

type Config = {
  selected: Mail["id"] | null;
};

type MailStore = {
  mail: Config;
  setMail: (mail: Config) => void;
  mails: Mail[];
  searchQuery: string;
  activeFolder: string;
  setSearchQuery: (query: string) => void;
  setActiveFolder: (folder: string) => void;
  togglePinMail: (id: string) => void;
  archiveMail: (id: string) => void;
  deleteMail: (id: string) => void;
  markMailUnread: (id: string) => void;
  navigateMail: (direction: "prev" | "next") => void;
  sendReply: (mailId: string, replyText: string) => void;
  composeMail: (newMail: { to: string; subject: string; body: string }) => void;
};

export const useMailStore = create<MailStore>((set, get) => ({
  mail: {
    selected: initialMails[0].id,
  },
  setMail: (mail) => set({ mail }),
  mails: initialMails,
  searchQuery: "",
  activeFolder: "inbox",
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setActiveFolder: (activeFolder) => set({ activeFolder }),
  togglePinMail: (id) => {
    set((state) => ({
      mails: state.mails.map((m) => (m.id === id ? { ...m, isPinned: !m.isPinned } : m)),
    }));
  },
  archiveMail: (id) => {
    const { mails } = get();
    const currentList = mails.filter((m) => m.folder === "inbox");
    const currentIndex = currentList.findIndex((m) => m.id === id);
    const nextMail = currentList[currentIndex + 1] || currentList[currentIndex - 1] || null;

    set((state) => ({
      mails: state.mails.map((m) => (m.id === id ? { ...m, folder: "archive" as const } : m)),
      mail: { selected: nextMail ? nextMail.id : null },
    }));
  },
  deleteMail: (id) => {
    const { mails } = get();
    const currentList = mails.filter((m) => m.folder === "inbox");
    const currentIndex = currentList.findIndex((m) => m.id === id);
    const nextMail = currentList[currentIndex + 1] || currentList[currentIndex - 1] || null;

    set((state) => ({
      mails: state.mails.map((m) => (m.id === id ? { ...m, folder: "trash" as const } : m)),
      mail: { selected: nextMail ? nextMail.id : null },
    }));
  },
  markMailUnread: (id) => {
    set((state) => ({
      mails: state.mails.map((m) => (m.id === id ? { ...m, isRead: false } : m)),
    }));
  },
  navigateMail: (direction) => {
    const { mails, mail, searchQuery, activeFolder } = get();
    const visibleMails = mails.filter((m) => {
      if (activeFolder && m.folder !== activeFolder && activeFolder !== "all") return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.subject.toLowerCase().includes(q) ||
          m.body.toLowerCase().includes(q) ||
          m.from.name.toLowerCase().includes(q)
        );
      }
      return true;
    });

    if (visibleMails.length === 0) return;

    const currentIndex = visibleMails.findIndex((m) => m.id === mail.selected);
    let nextIndex: number;
    if (direction === "prev") {
      nextIndex = currentIndex <= 0 ? visibleMails.length - 1 : currentIndex - 1;
    } else {
      nextIndex = currentIndex >= visibleMails.length - 1 ? 0 : currentIndex + 1;
    }

    set({ mail: { selected: visibleMails[nextIndex].id } });
  },
  sendReply: (mailId, replyText) => {
    if (!replyText.trim()) return;
    set((state) => ({
      mails: state.mails.map((m) => {
        if (m.id === mailId) {
          return {
            ...m,
            body: `${m.body}\n\n--- Reply (${new Date().toLocaleTimeString()}) ---\n${replyText.trim()}`,
            messageCount: (m.messageCount || 1) + 1,
          };
        }
        return m;
      }),
    }));
  },
  composeMail: ({ to, subject, body }) => {
    const newId = `mail-${Date.now()}`;
    const newMailItem: Mail = {
      id: newId,
      accountId: 1,
      from: {
        name: "You",
        email: "me@company.com",
      },
      to: [
        {
          name: to.split("@")[0] || to,
          email: to,
        },
      ],
      subject: subject || "(No subject)",
      body: body || "",
      receivedAt: new Date().toISOString(),
      folder: "sent",
      isRead: true,
      isPinned: false,
      isPriority: false,
      labels: ["Sent"],
    };

    set((state) => ({
      mails: [newMailItem, ...state.mails],
      mail: { selected: newId },
    }));
  },
}));

export function useMail() {
  const mail = useMailStore((state) => state.mail);
  const setMail = useMailStore((state) => state.setMail);

  return [mail, setMail] as const;
}
