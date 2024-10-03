// src/components/Sidebar.tsx
import React from 'react';
import styled from 'styled-components';

const SidebarContainer = styled.div`
  width: 250px;
  background-color: #f2f2f2;
  padding: 20px;
`;

const SectionTitle = styled.h3`
  margin-top: 0;
`;

const ListItem = styled.div`
  padding: 10px;
  cursor: pointer;
  &:hover {
    background-color: #ddd;
  }
`;

interface SidebarProps {
  username: string;
}

const Sidebar: React.FC<SidebarProps> = ({ username }) => {
  // Pour l'instant, utilisons des données statiques
  const rooms = ['general', 'random', 'support'];
  const users = ['Alice', 'Bob', 'ChatGPT'];

  return (
    <SidebarContainer>
      <SectionTitle>Salons</SectionTitle>
      {rooms.map((room) => (
        <ListItem key={room}>{room}</ListItem>
      ))}

      <SectionTitle>Utilisateurs en ligne</SectionTitle>
      {users.map((user) => (
        <ListItem key={user}>
          {user} {user === 'ChatGPT' && <span>🤖</span>}
        </ListItem>
      ))}
    </SidebarContainer>
  );
};

export default Sidebar;
