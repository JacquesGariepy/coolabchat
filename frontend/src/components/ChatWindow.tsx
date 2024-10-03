import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Paper, Snackbar, Alert } from '@mui/material';
import styled from 'styled-components';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import MessageInput from './MessageInput';

const ChatContainer = styled(Paper)`
  flex: 1;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px);
  margin-top: 64px;
`;

const MessageContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
`;

interface Message {
  id: string;
  message: string;
  username: string;
  reactions: { [key: string]: string[] };
}

const ChatWindow: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const { roomName } = useParams<{ roomName: string }>();
  const username = localStorage.getItem('username') || `User_${Math.floor(Math.random() * 1000)}`;

  const connectWebSocket = useCallback(() => {
    if (!roomName) return;

    const socket = new WebSocket(`ws://localhost:8000/ws/${roomName}`);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connection established');
      setError(null);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received message:', data); // Log received message for debugging
        if (data.event === 'typing') {
          setTypingUsers((prev) => new Set(prev.add(data.username)));
          setTimeout(() => {
            setTypingUsers((prev) => {
              const newSet = new Set(prev);
              newSet.delete(data.username);
              return newSet;
            });
          }, 3000);
        } else if (data.event === 'message' && data.message && data.username) {
          setMessages((prevMessages) => {
            // Check if the message already exists to prevent duplicates
            if (!prevMessages.some(msg => msg.id === data.id)) {
              return [
                ...prevMessages,
                { id: data.id || `${Date.now()}`, message: data.message, username: data.username, reactions: {} },
              ];
            }
            return prevMessages;
          });
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
        console.log('Received data:', event.data);
        setError('Error parsing message from server. Please try again.');
      }
    };

    socket.onclose = (event) => {
      console.log('WebSocket connection closed:', event);
      if (event.code !== 1000) {
        setError('WebSocket connection lost. Attempting to reconnect...');
        setTimeout(connectWebSocket, 3000);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Error in WebSocket connection');
    };
  }, [roomName]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (socketRef.current) {
        socketRef.current.close(1000); // Normal closure
      }
    };
  }, [connectWebSocket]);

  const handleSendMessage = (message: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const payload = JSON.stringify({ event: 'message', message, username });
      socketRef.current.send(payload);
    }
  };

  const handleTyping = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ event: 'typing', username }));
    }
  };

  const handleReaction = (messageId: string, reaction: string) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              reactions: {
                ...msg.reactions,
                [reaction]: [...(msg.reactions[reaction] || []), username],
              },
            }
          : msg
      )
    );
  };

  return (
    <Container maxWidth="xl" disableGutters>
      <Navbar roomName={roomName || ""} />
      <div style={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
        <Sidebar username={username} />
        <ChatContainer elevation={3}>
          <MessageContainer>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg.message}
                username={msg.username}
                isOwnMessage={msg.username === username}
                isAgent={msg.username.startsWith('Agent')}
                reactions={msg.reactions}
                onReaction={(reaction: string) => handleReaction(msg.id, reaction)}
              />
            ))}
            {Array.from(typingUsers).map((user) => (
              <TypingIndicator key={user} username={user} />
            ))}
          </MessageContainer>
          <MessageInput
            sendMessage={handleSendMessage}
            onTyping={handleTyping}
            activeCommands={[]} // Commandes non utilisées pour le moment
          />
        </ChatContainer>
      </div>
      {error && (
        <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
          <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      )}
    </Container>
  );
};

export default ChatWindow;