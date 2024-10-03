// src/components/Login.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Container, Typography } from '@mui/material';

const Login: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const navigate = useNavigate();

  const handleLogin = () => {
    if (username.trim()) {
      navigate(`/chat/${username}`);
    }
  };

  return (
    <Container maxWidth="sm" style={{ marginTop: '50px' }}>
      <Typography variant="h4" gutterBottom>
        Connexion au Chat
      </Typography>
      <TextField
        label="Nom d'utilisateur"
        fullWidth
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        margin="normal"
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleLogin}
        fullWidth
        style={{ marginTop: '20px' }}
      >
        Rejoindre le Chat
      </Button>
    </Container>
  );
};

export default Login;
