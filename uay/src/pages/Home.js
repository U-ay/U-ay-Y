// src/pages/Home.js
import React, { useState } from 'react';
import TweetBox from '../components/TweetBox';
import TweetList from '../components/TweetList';
import { Box, Typography, Button } from '@mui/material';
import SearchBar from '../components/SearchBar';
import './Home.css';

function Home() {
  const [view, setView] = useState('global'); // 'global' or 'following'

  const handleViewChange = (newView) => {
    console.log(`Changing view to: ${newView}`);
    setView(newView);
  };

  return (
    <Box className="home-container">
      <Typography variant="h4" color="text.primary" align="center" gutterBottom>
        Bem-vindo ao U-ay!
      </Typography>
      
      {/* Botões para alternar entre Global e Following */}
      <Box display="flex" justifyContent="center" alignItems="center" mb={2}>
        <Button
          variant={view === 'global' ? 'contained' : 'outlined'}
          color="primary"
          onClick={() => handleViewChange('global')}
          sx={{ mr: 2 }}
        >
          Global
        </Button>
        <Button
          variant={view === 'following' ? 'contained' : 'outlined'}
          color="primary"
          onClick={() => handleViewChange('following')}
        >
          Seguindo
        </Button>
      </Box>

      {/* Search Bar para procurar perfis de usuários */}
      <Box display="flex" justifyContent="center" mb={4}>
        <SearchBar />
      </Box>

      <TweetBox />

      {/* Lista de Tweets */}
      <TweetList followingOnly={view === 'following'} sortByWeight={view === 'global'} />
    </Box>
  );
}

export default Home;
