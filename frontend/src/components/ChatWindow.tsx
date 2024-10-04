// ChatWindow.tsx
"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Container,
  Snackbar,
  Alert,
  Fab,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import styled from "styled-components";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import MessageInput from "./MessageInput";
import Avatar from "@mui/material/Avatar";
import GroupIcon from "@mui/icons-material/Group";
import { Send, Bot, X, AlertTriangle } from "lucide-react";

interface Message {
  id: string;
  message: string;
  username: string;
  reactions: { [key: string]: string[] };
}

const AppLayout = styled.div`
  display: flex;
  height: 100vh;
  overflow: hidden;
`;

const ChatContainer = styled(Paper)`
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-top: 64px;
  background-color: #f0f2f5;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 15px;
  overflow: hidden;
  margin-left: 1px;
`;

const MessageContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  scroll-behavior: smooth;
  background: linear-gradient(to bottom, #ffffff, #e6e9f0);
`;

const RoomInfoContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  background-color: #007bff;
  color: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-top-left-radius: 15px;
  border-top-right-radius: 15px;
`;

const RoomInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const TypingIndicatorContainer = styled.div`
  opacity: 0.5;
  animation: typingFade 1.5s infinite;
  margin-top: 10px;

  @keyframes typingFade {
    0%, 100% {
      opacity: 0.5;
    }
    50% {
      opacity: 1;
    }
  }
`;

const MessageInputContainer = styled.div`
  display: flex;
  align-items: center;
  background-color: #ffffff;
  padding: 10px;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  border-top: 1px solid #e0e0e0;
`;

const ChatWindow: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showSecurityWarning, setShowSecurityWarning] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const { roomName } = useParams<{ roomName: string }>();
  const username = localStorage.getItem("username") || `User_${Math.floor(Math.random() * 1000)}`;
  const chatEndRef = useRef<HTMLDivElement>(null);

  const connectWebSocket = useCallback(() => {
    if (!roomName) return;

    const socket = new WebSocket(`ws://localhost:8000/ws/${roomName}`);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("WebSocket connection established");
      setError(null);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received message:", data);
        if (data.event === "typing") {
          setTypingUsers((prev) => new Set(prev.add(data.username)));
          setTimeout(() => {
            setTypingUsers((prev) => {
              const newSet = new Set(prev);
              newSet.delete(data.username);
              return newSet;
            });
          }, 3000);
        } else if (data.event === "message" && data.message && data.username) {
          setMessages((prevMessages) => {
            if (!prevMessages.some((msg) => msg.id === data.id)) {
              return [
                ...prevMessages,
                { id: data.id || `${Date.now()}`, message: data.message, username: data.username, reactions: {} },
              ];
            }
            return prevMessages;
          });
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
        setError("Error parsing message from server. Please try again.");
      }
    };

    socket.onclose = (event) => {
      console.log("WebSocket connection closed:", event);
      if (event.code !== 1000) {
        setError("WebSocket connection lost. Attempting to reconnect...");
        setTimeout(connectWebSocket, 3000);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setError("Error in WebSocket connection");
    };
  }, [roomName]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (socketRef.current) {
        socketRef.current.close(1000);
      }
    };
  }, [connectWebSocket]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (message: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const payload = JSON.stringify({ event: "message", message, username });
      socketRef.current.send(payload);
    }
  };

  const handleTyping = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ event: "typing", username }));
    }
  };

  return (
    <Container maxWidth="xl" disableGutters>
      <Navbar roomName={roomName || ""} />
      <AppLayout>
        <Sidebar username={username} />
        <ChatContainer elevation={3}>
          <RoomInfoContainer>
            <RoomInfo>
              <Avatar>
                <GroupIcon />
              </Avatar>
              <Typography variant="h6">{roomName}</Typography>
            </RoomInfo>
            <Tooltip title="Ask AI">
              <Fab color="primary" size="small" onClick={() => setShowAIAssistant(true)}>
                <Bot className="text-white" />
              </Fab>
            </Tooltip>
          </RoomInfoContainer>
          <MessageContainer>
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={msg.username === username ? "text-right self-end" : "text-left self-start"}
                >
                  <MessageBubble
                    key={msg.id}
                    message={msg.message}
                    username={msg.username}
                    isOwnMessage={msg.username === username}
                    isAgent={msg.username.startsWith("Agent")}
                    reactions={msg.reactions}
                    onReaction={(reaction: string) => {}}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            {Array.from(typingUsers).map((user) => (
              <TypingIndicatorContainer key={user}>
                <TypingIndicator username={user} />
              </TypingIndicatorContainer>
            ))}
            <div ref={chatEndRef} />
          </MessageContainer>
          <MessageInputContainer>
            <Avatar src="/placeholder.svg?height=40&width=40" alt="User Avatar" className="mr-3" />
            <MessageInput
              sendMessage={handleSendMessage}
              onTyping={handleTyping}
              activeCommands={[]}
            />
            <motion.button
              className="ml-3 text-blue-500"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSendMessage("Hi, I need assistance!")}
            >
              <Send className="w-6 h-6" />
            </motion.button>
          </MessageInputContainer>
        </ChatContainer>
      </AppLayout>
      {showAIAssistant && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-lg p-6 w-2/3 max-w-2xl"
            initial={{ scale: 0.9, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 50 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">AI Assistant</h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowAIAssistant(false)}
              >
                <X className="w-6 h-6" />
              </motion.button>
            </div>
            <textarea
              className="w-full h-32 p-2 border rounded-lg mb-4"
              placeholder="Type your question for the AI Assistant..."
            />
            <motion.button
              className="bg-blue-500 text-white px-4 py-2 rounded"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {/* Send to AI Assistant */}}
            >
              Send
            </motion.button>
          </motion.div>
        </motion.div>
      )}
      {showSecurityWarning && (
        <AnimatePresence>
          <motion.div
            className="fixed bottom-8 right-8 bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded shadow-lg"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
          >
            <div className="flex items-center">
              <AlertTriangle className="w-6 h-6 text-yellow-500 mr-2" />
              <p className="text-sm">
                Potential sensitive information detected. Be cautious about sharing personal data in chat.
                <motion.button
                  className="ml-2 text-blue-500 underline"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSecurityWarning(false)}
                >
                  Dismiss
                </motion.button>
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </Container>
  );
};

export default ChatWindow;