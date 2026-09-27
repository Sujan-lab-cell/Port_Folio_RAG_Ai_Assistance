"use client";

import React, { createContext, useContext, useState } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/src/i18n";
import { ChatMessage } from "./types";
import { AIButton } from "./AIButton";
import { AIChatWindow } from "./AIChatWindow";
import { AnimatePresence } from "framer-motion";

interface AIAssistantContextType {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isExpanded: boolean;
  setIsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (prompt: string) => Promise<void>;
  clearMessages: () => void;
  openAssistant: () => void;
}

const AIAssistantContext = createContext<AIAssistantContextType | undefined>(undefined);

export const AIAssistantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { lang } = useLanguage();

  const openAssistant = () => setIsOpen(true);
  const clearMessages = () => setMessages([]);

  const sendMessage = async (userPrompt: string) => {
    if (!userPrompt.trim() || isLoading) return;
    const questionText = userPrompt.trim();
    const msgId = Date.now().toString() + Math.random().toString(36).substring(2, 5);

    // Ensure panel is open when sending a message
    setIsOpen(true);
    setIsLoading(true);

    setMessages((prev) => [
      ...prev,
      {
        id: msgId,
        question: questionText,
        answer: null,
        isLoading: true,
      },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: questionText, language: lang }),
      });

      if (!res.ok) {
        throw new Error(`Server error ${res.status}`);
      }

      const data = await res.json();
      if (data.answer) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === msgId
              ? {
                  ...msg,
                  answer: data.answer,
                  navAction: data.navAction || null,
                  isLoading: false,
                }
              : msg
          )
        );
      } else if (data.error) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === msgId ? { ...msg, error: data.error, isLoading: false } : msg
          )
        );
      }
    } catch (err: any) {
      console.error("Robot API chat error:", err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === msgId
            ? { ...msg, error: err.message || "Failed to fetch response.", isLoading: false }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AIAssistantContext.Provider
      value={{
        isOpen,
        setIsOpen,
        isExpanded,
        setIsExpanded,
        messages,
        isLoading,
        sendMessage,
        clearMessages,
        openAssistant,
      }}
    >
      {children}
      <AIAssistantRoot />
    </AIAssistantContext.Provider>
  );
};

export const useAIAssistant = (): AIAssistantContextType => {
  const context = useContext(AIAssistantContext);
  if (!context) {
    return {
      isOpen: false,
      setIsOpen: () => {},
      isExpanded: false,
      setIsExpanded: () => {},
      messages: [],
      isLoading: false,
      sendMessage: async () => {},
      clearMessages: () => {},
      openAssistant: () => {},
    };
  }
  return context;
};

function AIAssistantRoot() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const {
    isOpen,
    setIsOpen,
    isExpanded,
    setIsExpanded,
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  } = useAIAssistant();

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <AIChatWindow
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            isExpanded={isExpanded}
            onToggleExpand={() => setIsExpanded((prev) => !prev)}
            messages={messages}
            isLoading={isLoading}
            onSendMessage={sendMessage}
            onClearMessages={clearMessages}
          />
        )}
      </AnimatePresence>

      {/* Show floating button only on non-Home pages */}
      {!isHomePage && (
        <AIButton isOpen={isOpen} onClick={() => setIsOpen((prev) => !prev)} />
      )}
    </>
  );
}

export { AIAssistantProvider as AIAssistant };
