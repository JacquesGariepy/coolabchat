import React, { useState } from 'react';
import styled from 'styled-components';
import { Popover, IconButton, Typography, Badge } from '@mui/material';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';

const Bubble = styled.div<{ isOwnMessage: boolean; isAgent: boolean; partial?: boolean }>`
  max-width: 60%;
  margin-bottom: 10px;
  padding: 10px;
  border-radius: 10px;
  background-color: ${({ isOwnMessage, isAgent }) =>
    isOwnMessage ? '#2f80ed' : isAgent ? '#FFD700' : '#e0e0e0'};
  color: ${({ isOwnMessage }) => (isOwnMessage ? '#fff' : '#000')};
  align-self: ${({ isOwnMessage }) => (isOwnMessage ? 'flex-end' : 'flex-start')};
  opacity: ${({ partial }) => partial ? 0.7 : 1};
`;

const Username = styled(Typography)`
  font-weight: bold;
  margin-bottom: 5px;
`;

const ReactionContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-top: 5px;
`;

interface MessageBubbleProps {
  message: string;
  username: string;
  isOwnMessage: boolean;
  isAgent: boolean;
  reactions: { [key: string]: string[] };
  onReaction: (reaction: string) => void;
  partial?: boolean;
}

const availableReactions = ['👍', '❤️', '😂', '😮', '😢', '😡'];

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  username,
  isOwnMessage,
  isAgent,
  reactions,
  onReaction,
  partial,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpenReactions = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseReactions = () => {
    setAnchorEl(null);
  };

  const handleAddReaction = (reaction: string) => {
    onReaction(reaction);
    handleCloseReactions();
  };

  return (
    <Bubble isOwnMessage={isOwnMessage} isAgent={isAgent} partial={partial}>
      {!isOwnMessage && <Username variant="subtitle2">{isAgent ? `🤖 ${username}` : username}</Username>}
      <Typography variant="body1">{message}</Typography>
      {!partial && (
        <ReactionContainer>
          {Object.entries(reactions).map(([reaction, users]) => (
            <Badge key={reaction} badgeContent={users.length} color="primary" sx={{ margin: '0 2px' }}>
              <IconButton size="small" onClick={() => handleAddReaction(reaction)}>
                <span style={{ fontSize: '16px' }}>{reaction}</span>
              </IconButton>
            </Badge>
          ))}
          <IconButton size="small" onClick={handleOpenReactions}>
            <EmojiEmotionsIcon fontSize="small" />
          </IconButton>
        </ReactionContainer>
      )}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleCloseReactions}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <div style={{ display: 'flex', padding: '5px' }}>
          {availableReactions.map((reaction) => (
            <IconButton key={reaction} onClick={() => handleAddReaction(reaction)}>
              <span style={{ fontSize: '24px' }}>{reaction}</span>
            </IconButton>
          ))}
        </div>
      </Popover>
    </Bubble>
  );
};

export default MessageBubble;
