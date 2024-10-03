import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Paper, Alert, Snackbar } from '@mui/material';
import styled from 'styled-components';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import ModeratorPanel from './ModeratorPanel';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import MessageInput from './MessageInput';

const ENDPOINT = 'http://localhost:8000';

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
  partial?: boolean;
}

const ChatWindow: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [activeAgents, setActiveAgents] = useState([]);
  const [activeCommands, setActiveCommands] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const navigate = useNavigate();
  const { roomName } = useParams<{ roomName: string }>();
  const username = localStorage.getItem('username') || '';
  const isModerator = localStorage.getItem('isModerator') === 'true';

  const isTokenExpired = (token: string | null) => {
    if (!token) return true;
    try {
      const { exp } = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= exp * 1000;
    } catch {
      return true;
    }
  };

  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(`${ENDPOINT}/token/refresh`, {
        refresh_token: refreshToken,
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      const newAccessToken = response.data.access_token;
      localStorage.setItem('token', newAccessToken);
      return newAccessToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      navigate('/login');  // Redirect to login if unable to refresh the token
    }
  };

  const connectWebSocket = useCallback(async (attempt = 0) => {
    if (attempt > 5) {
      setError("Unable to reconnect after multiple attempts. Please refresh the page.");
      return;
    }
  
    let token = localStorage.getItem('token');
    let validToken = token;
  
    if (isTokenExpired(token)) {
      validToken = await refreshAccessToken();
    }
    if (!validToken) {
      console.error('Failed to refresh token.');
      return;
    }
    
  
    const socket = new WebSocket(`${ENDPOINT}/ws/${roomName}?token=${validToken}`);
    socketRef.current = socket;
  
    socket.onopen = () => {
      console.log('WebSocket connection established');
    };
  
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Handle messages
    };
  
    socket.onclose = async (event) => {
      console.log('WebSocket connection closed:', event);
      if (event.code !== 1000) { // Not a normal closure
        setError('WebSocket connection lost. Attempting to reconnect...');
        setTimeout(() => connectWebSocket(attempt + 1), Math.min(10000, 1000 * (2 ** attempt)));
      }
    };
  
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Error in WebSocket connection');
    };
  }, [roomName]);
  

  useEffect(() => {
    (async () => {
      try {
        let token = localStorage.getItem('token');
        if (isTokenExpired(token)) {
          token = await refreshAccessToken();
        }

        if (!token) {
          navigate('/login');
          return;
        }

        await axios.get(`${ENDPOINT}/users/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(response => {
          localStorage.setItem('username', response.data.username);
          localStorage.setItem('isModerator', response.data.is_moderator.toString());
        }).catch(() => {
          navigate('/login');
        });

        if (roomName) {
          await axios.get(`${ENDPOINT}/rooms/${roomName}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }).then(response => {
            setActiveAgents(response.data.agents || []);
            setActiveCommands(response.data.active_commands || []);
          }).catch(() => {
            setError('Failed to load room data.');
          });
        }

        connectWebSocket();
      } catch (error) {
        console.error('Unexpected error:', error);
      }
    })();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connectWebSocket, navigate, roomName]);

  const handleTyping = () => {
    if (socketRef.current) {
      socketRef.current.send(JSON.stringify({ type: 'typing', isTyping: true }));
    }
  };

  const handleReaction = (messageId: string, reaction: string) => {
    // Reaction handling logic here
  };

  const toggleAgent = (agentId: number, isActive: boolean) => {
    // Toggle agent logic here
  };

  const toggleCommand = (command: string, isActive: boolean) => {
    // Toggle command logic here
  };

  return (
    <Container maxWidth="xl" disableGutters>
      <Navbar roomName={roomName || ""} />
      <div style={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
      <Sidebar username={username} />
        <ChatContainer elevation={3}>
          {isModerator && (
            <ModeratorPanel
              agents={activeAgents}
              commands={activeCommands}
              onToggleAgent={toggleAgent}
              onToggleCommand={toggleCommand}
            />
          )}
          <MessageContainer>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg.message}
                username={msg.username}
                isOwnMessage={msg.username === username}
                isAgent={msg.username !== username && msg.username.startsWith('Agent')}
                reactions={msg.reactions}
                onReaction={(reaction) => handleReaction(msg.id, reaction)}
              />
            ))}
            {Array.from(typingUsers).map((user) => (
              <TypingIndicator key={user} username={user} />
            ))}
          </MessageContainer>
          <MessageInput
            sendMessage={(message) => {
              if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({ type: 'message', message }));
              }
            }}
            onTyping={handleTyping}
            activeCommands={activeCommands}
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

