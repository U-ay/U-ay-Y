// src/pages/Home.js
import React, { useState } from 'react';
import UaiBox from '../components/UaiBox';
import UaiList from '../components/UaiList';
import { Box, Typography } from '@mui/material';
import './Home.css';

function Home() {
  const [view, setView] = useState('global'); // 'global' or 'following'

  const handleViewChange = (newView) => {
    setView(newView);
  };

  return (
    <Box className="home-container">
      <Box className="home-header">
        <Typography variant="h4" color="text.primary" align="center" gutterBottom>
          U-ay
        </Typography>
        <Box className="view-toggle-buttons">
          <button
            className={view === 'global' ? 'active' : ''}
            onClick={() => handleViewChange('global')}
          >
            Global
          </button>
          <button
            className={view === 'following' ? 'active' : ''}
            onClick={() => handleViewChange('following')}
          >
            Seguindo
          </button>
        </Box>
      </Box>
      <UaiBox />

      {/* Lista de Uais */}
      <UaiList followingOnly={view === 'following'} sortByWeight={view === 'global'} />
    </Box>
  );
}

export default Home;
