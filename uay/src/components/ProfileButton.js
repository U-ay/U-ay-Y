// src/components/ProfileButton.js
import React from 'react';
import { IconButton, Avatar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import logo from '../assets/logo192.png'; // Caminho corrigido

function ProfileButton() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const handleProfileClick = () => {
    if (user) {
      navigate(`/profile/${user.displayName}`);
    } else {
      navigate('/@login');
    }
  };

  return (
    <IconButton onClick={handleProfileClick}>
      <Avatar src={logo} alt="Logo" />
    </IconButton>
  );
}

export default ProfileButton;
