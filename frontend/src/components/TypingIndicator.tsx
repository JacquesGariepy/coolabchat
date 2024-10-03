// src/components/TypingIndicator.tsx
import React from 'react';
import styled from 'styled-components';

const Indicator = styled.div`
  font-style: italic;
  margin-bottom: 10px;
`;

interface TypingIndicatorProps {
  username: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ username }) => {
  return <Indicator>{username} est en train d'écrire...</Indicator>;
};

export default TypingIndicator;
