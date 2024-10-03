import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import ChatWindow from './components/ChatWindow';
import AgentManager from './components/AgentManager';
import UserProfile from './components/UserProfile';
import RoomList from './components/RoomList';
import './index.css';

const App: React.FC = () => {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/rooms" element={<RoomList />} />
          <Route path="/chat/:roomName" element={<ChatWindow />} />
          <Route path="/chat" element={<RoomList />} /> {/* Route générique pour /chat */}
          <Route path="/agents" element={<AgentManager />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/" element={<Login />} />
          <Route path="*" element={<div>Page non trouvée. Veuillez vérifier l'URL.</div>} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
