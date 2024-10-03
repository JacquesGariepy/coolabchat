// src/components/Navbar.tsx
import React from 'react';
import { AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';

interface NavbarProps {
  roomName: string;
}

const Navbar: React.FC<NavbarProps> = ({ roomName }) => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" style={{ flexGrow: 1 }}>
          Chat Collaboratif - {roomName}
        </Typography>
        <IconButton color="inherit" href="/profile">
          <AccountCircle />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
