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
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const SendButton = styled.button`
  padding: 10px;
  margin-left: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #0056b3;
  }
`;

const EmojiButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  margin-left: 10px;
`;

const CommandSelect = styled.select`
  padding: 10px;
  margin-right: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
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
      // Si une commande est sélectionnée, la joindre au message
      if (selectedCommand) {
        sendMessage(`${selectedCommand}(${message})`);
      } else {
        sendMessage(message);
      }
      setMessage(''); // Réinitialiser le champ de message après l'envoi
      setSelectedCommand(''); // Réinitialiser la commande sélectionnée
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    if (onTyping) {
      onTyping(); // Notifier que l'utilisateur est en train de taper
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend(); // Envoyer le message lorsque la touche "Entrée" est pressée
    } else if (onTyping) {
      onTyping(); // Notifier que l'utilisateur est en train de taper
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setMessage(prevMessage => prevMessage + emojiData.emoji); // Ajouter l'emoji au message
  };

  return (
    <InputContainer>
      {/* Sélecteur de commandes actives, si nécessaire */}
      <CommandSelect 
        value={selectedCommand} 
        onChange={(e) => setSelectedCommand(e.target.value)}
      >
        <option value="">Select a command</option>
        {activeCommands.map((command: string) => (
          <option key={command} value={command}>{command}</option>
        ))}
      </CommandSelect>
      
      {/* Champ d'entrée de message */}
      <Input
        type="text"
        value={message}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
        placeholder="Type a message..."
      />

      {/* Bouton d'emoji */}
      <EmojiButton onClick={() => setShowEmojiPicker(!showEmojiPicker)}>😊</EmojiButton>
      {showEmojiPicker && (
        <EmojiPicker onEmojiClick={onEmojiClick} />
      )}

      {/* Bouton d'envoi */}
      <SendButton onClick={handleSend}>Send</SendButton>
    </InputContainer>
  );
};

export default MessageInput;
