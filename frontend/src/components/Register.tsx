// src/components/Register.tsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Container, Typography, Alert } from '@mui/material';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRegister = () => {
    if (!username || !password) {
      setError("Le nom d'utilisateur et le mot de passe sont requis");
      return;
    }
  
    console.log("Sending registration request...");
    axios.post('http://localhost:8000/register', { username, password }, {
      headers: {
        'Content-Type': 'application/json',
      }
    })
    .then((response) => {
      console.log("Registration successful:", response.data);
      alert('Compte créé avec succès');
      navigate('/login');
    })
    .catch((error) => {
      console.error("Registration failed:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
        console.error("Response headers:", error.response.headers);
      } else if (error.request) {
        console.error("No response received:", error.request);
      } else {
        console.error("Error setting up request:", error.message);
      }
      setError('Erreur lors de la création du compte. Veuillez réessayer plus tard.');
    });
  };

  return (
    <Container maxWidth="sm" style={{ marginTop: '50px' }}>
      <Typography variant="h4" gutterBottom>
        Créer un compte
      </Typography>
      {error && (
        <Alert severity="error" style={{ marginBottom: '20px' }}>
          {error}
        </Alert>
      )}
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
        onClick={handleRegister}
        fullWidth
        style={{ marginTop: '20px' }}
      >
        S'inscrire
      </Button>
      <Button
        color="secondary"
        href="/login"
        fullWidth
        style={{ marginTop: '10px' }}
      >
        Déjà un compte ? Se connecter
      </Button>
    </Container>
  );
};

export default Register;
