// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ProfilePage from './pages/ProfilePage'; // Import the ProfilePage component
import NavBar from './components/NavBar';

function App() {
  return (
    <Router>
      <NavBar /> {/* Mover NavBar para fora das rotas para que apareça em todas as páginas */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile/:userId" element={<ProfilePage />} /> {/* Add dynamic userId */}
      </Routes>
    </Router>
  );
}

export default App;
