// src/components/AgentManager.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { TextField, Button, List, ListItem, ListItemText, Switch } from '@mui/material';

interface Agent {
  id: number;
  name: string;
  personality: string;
  context: string;
  is_active: boolean;
}

const AgentManager: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [name, setName] = useState('');
  const [personality, setPersonality] = useState('');
  const [context, setContext] = useState('');

  useEffect(() => {
    // Récupérer la liste des agents depuis le backend
    axios.get('http://localhost:8000/agents')
      .then(response => {
        setAgents(response.data);
      })
      .catch(error => {
        console.error('Erreur lors de la récupération des agents', error);
      });
  }, []);

  const handleCreateAgent = () => {
    axios.post('http://localhost:8000/agents', {
      name,
      personality,
      context,
    })
      .then(response => {
        setAgents([...agents, response.data]);
        setName('');
        setPersonality('');
        setContext('');
      })
      .catch(error => {
        console.error('Erreur lors de la création de l\'agent', error);
      });
  };

  const handleToggleActive = (agent: Agent) => {
    axios.patch(`http://localhost:8000/agents/${agent.id}`, {
      is_active: !agent.is_active,
    })
      .then(response => {
        setAgents(agents.map(a => a.id === agent.id ? response.data : a));
      })
      .catch(error => {
        console.error('Erreur lors de la mise à jour de l\'agent', error);
      });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Gestion des Agents IA</h2>
      <div>
        <TextField
          label="Nom de l'agent"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ marginRight: '10px' }}
        />
        <TextField
          label="Personnalité"
          value={personality}
          onChange={(e) => setPersonality(e.target.value)}
          style={{ marginRight: '10px' }}
        />
        <TextField
          label="Contexte"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          style={{ marginRight: '10px' }}
        />
        <Button variant="contained" color="primary" onClick={handleCreateAgent}>
          Créer un Agent
        </Button>
      </div>
      <List>
        {agents.map(agent => (
          <ListItem key={agent.id}>
            <ListItemText
              primary={agent.name}
              secondary={`Personnalité: ${agent.personality}, Contexte: ${agent.context}`}
            />
            <Switch
              checked={agent.is_active}
              onChange={() => handleToggleActive(agent)}
              color="primary"
            />
          </ListItem>
        ))}
      </List>
    </div>
  );
};

export default AgentManager;
