// src/components/Login.tsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Container, Typography, Alert } from '@mui/material';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://localhost:8000/token', 
        new URLSearchParams({
          username: username,
          password: password
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      console.log('Token stored:', access_token); // Debug log
      navigate('/rooms'); // Redirect to room list after successful login
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail || 'Login failed. Please try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      console.error('Login failed:', err);
    }
  };

  return (
    <Container maxWidth="sm" style={{ marginTop: '50px' }}>
      <Typography variant="h4" gutterBottom>
        Connexion
      </Typography>
      {error && <Alert severity="error" style={{ marginBottom: '20px' }}>{error}</Alert>}
      <TextField
        label="Nom d'utilisateur"
        fullWidth
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        margin="normal"
      />
      <TextField
        label="Mot de passe"
        type="password"
        fullWidth
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        margin="normal"
      />
      <Button 
        variant="contained" 
        color="primary" 
        onClick={handleLogin} 
        fullWidth 
        style={{ marginTop: '20px' }}
      >
        Se connecter
      </Button>
      <Button 
        color="secondary" 
        onClick={() => navigate('/register')} 
        fullWidth 
        style={{ marginTop: '10px' }}
      >
        Créer un compte
      </Button>
    </Container>
  );
};

export default Login;