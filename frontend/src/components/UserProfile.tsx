// src/components/UserProfile.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TextField, Button, Avatar } from '@mui/material';

const UserProfile: React.FC = () => {
  const [username, setUsername] = useState('');
  const [isModerator, setIsModerator] = useState(false);
  const [avatar, setAvatar] = useState('');
  const [status, setStatus] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    axios
      .get('http://localhost:8000/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setUsername(response.data.username);
        setIsModerator(response.data.is_moderator);
        setAvatar(response.data.avatar || '');
        setStatus(response.data.status || '');
      })
      .catch((error) => {
        console.error('Erreur lors de la récupération du profil utilisateur', error);
      });
  }, [token]);

  const handleSave = () => {
    axios
      .put(
        'http://localhost:8000/users/me',
        { avatar, status },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then((response) => {
        alert('Profil enregistré avec succès');
      })
      .catch((error) => {
        alert('Erreur lors de la mise à jour du profil');
      });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Profil Utilisateur</h2>
      <Avatar src={avatar} style={{ width: '100px', height: '100px' }} />
      <br />
      <TextField
        label="Nom d'utilisateur"
        value={username}
        disabled
        style={{ marginBottom: '10px' }}
      />
      <br />
      <TextField
        label="Statut"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        style={{ marginBottom: '10px' }}
      />
      <br />
      <TextField
        label="URL de l'Avatar"
        value={avatar}
        onChange={(e) => setAvatar(e.target.value)}
        style={{ marginBottom: '10px' }}
      />
      <br />
      <Button variant="contained" color="primary" onClick={handleSave}>
        Enregistrer
      </Button>
    </div>
  );
};

export default UserProfile;
