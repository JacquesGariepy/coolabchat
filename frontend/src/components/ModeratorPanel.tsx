// src/components/ModeratorPanel.tsx
import React from 'react';
import { Switch, FormControlLabel, Typography } from '@mui/material';

interface Agent {
  id: number;
  name: string;
  is_active: boolean;
}

interface ModeratorPanelProps {
  agents: Agent[];
  commands: string[];
  onToggleAgent: (agentId: number, isActive: boolean) => void;
  onToggleCommand: (command: string, isActive: boolean) => void;
}

const ModeratorPanel: React.FC<ModeratorPanelProps> = ({ agents, commands, onToggleAgent, onToggleCommand }) => {
  return (
    <div>
      <Typography variant="h6">Moderator Controls</Typography>
      <div>
        <Typography variant="subtitle1">Agents</Typography>
        {agents.map(agent => (
          <FormControlLabel
            key={agent.id}
            control={
              <Switch
                checked={agent.is_active}
                onChange={(e) => onToggleAgent(agent.id, e.target.checked)}
              />
            }
            label={agent.name}
          />
        ))}
      </div>
      <div>
        <Typography variant="subtitle1">Commands</Typography>
        {['iask', 'iatranslate', 'isummarize'].map(command => (
          <FormControlLabel
            key={command}
            control={
              <Switch
                checked={commands.includes(command)}
                onChange={(e) => onToggleCommand(command, e.target.checked)}
              />
            }
            label={command}
          />
        ))}
      </div>
    </div>
  );
};

export default ModeratorPanel;