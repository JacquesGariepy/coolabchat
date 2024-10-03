import React, { useEffect, useState } from 'react';
import axios, { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { List, ListItem, ListItemText, ListItemButton, Button, TextField, Container, Typography, CircularProgress, Alert } from '@mui/material';

interface Room {
  id: number;
  name: string;
}

const RoomList: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
  }, [navigate]);

  const fetchRooms = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('http://localhost:8000/rooms');
      setRooms(response.data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        console.error('Error fetching rooms:', err.message);
      } else {
        console.error('Unexpected error:', err);
      }
      setError('Failed to load rooms. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:8000/rooms', {
        name: newRoomName,
        is_public: true
      });
      setNewRoomName(''); // Clear input
      fetchRooms(); // Refresh the room list
    } catch (err) {
      if (axios.isAxiosError(err)) {
        console.error('Error creating room:', err.response?.data);
        setError(`Failed to create room: ${err.response?.data.detail || 'Unknown error'}`);
      } else {
        console.error('Unexpected error:', err);
        setError('Failed to create room. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = (roomName: string) => {
    navigate(`/chat/${roomName}`);
  };

  return (
    <Container maxWidth="sm" style={{ marginTop: '50px' }}>
      <Typography variant="h4" gutterBottom>
        Salons de Chat
      </Typography>
      {error && (
        <Alert severity="error" style={{ marginBottom: '20px' }}>
          {error}
        </Alert>
      )}
      {loading && (
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <CircularProgress />
        </div>
      )}
      {!loading && (
        <>
          <List>
            {rooms.map((room) => (
              <ListItem key={room.id} disablePadding>
                <ListItemButton onClick={() => handleJoinRoom(room.name)}>
                  <ListItemText primary={room.name} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <TextField
            label="Nom du nouveau salon"
            fullWidth
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            margin="normal"
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateRoom}
            fullWidth
            style={{ marginTop: '20px' }}
            disabled={!newRoomName.trim() || loading}
          >
            Créer un Salon
          </Button>
        </>
      )}
    </Container>
  );
};

export default RoomList;
