// src/components/MessageInput.tsx
import React, { useState } from 'react';
import styled from 'styled-components';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

const InputContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 10px;
  background-color: #fff;
  border-top: 1px solid #ccc;
`;

const Input = styled.input`
  flex: 1;
  padding: 10px;
  font-size: 1rem;
`;

const SendButton = styled.button`
  padding: 10px;
  margin-left: 10px;
`;

const EmojiButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
`;

const CommandSelect = styled.select`
  padding: 10px;
  margin-right: 10px;
`;

interface MessageInputProps {
  sendMessage: (message: string) => void;
  onTyping?: () => void;
  activeCommands: string[];
}

const MessageInput: React.FC<MessageInputProps> = ({ sendMessage, onTyping, activeCommands }) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedCommand, setSelectedCommand] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      if (selectedCommand) {
        sendMessage(`${selectedCommand}(${message})`);
      } else {
        sendMessage(message);
      }
      setMessage('');
      setSelectedCommand('');
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    if (onTyping) {
      onTyping();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    } else if (onTyping) {
      onTyping();
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setMessage(prevMessage => prevMessage + emojiData.emoji);
  };

  return (
    <InputContainer>
      <CommandSelect 
        value={selectedCommand} 
        onChange={(e) => setSelectedCommand(e.target.value)}
      >
        <option value="">Select a command</option>
        {activeCommands.map((command: string) => (
          <option key={command} value={command}>{command}</option>
        ))}
      </CommandSelect>
      <Input
        type="text"
        value={message}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
        placeholder="Type a message..."
      />
      <EmojiButton onClick={() => setShowEmojiPicker(!showEmojiPicker)}>😊</EmojiButton>
      {showEmojiPicker && (
        <EmojiPicker onEmojiClick={onEmojiClick} />
      )}
      <SendButton onClick={handleSend}>Send</SendButton>
    </InputContainer>
  );
};

export default MessageInput;