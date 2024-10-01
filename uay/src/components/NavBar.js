import React, { useEffect, useState } from 'react';
import { AppBar, Toolbar, Typography, Box, Button, IconButton, Avatar, TextField } from '@mui/material';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

function NavBar() {
  const [user] = useAuthState(auth);
  const [profilePic, setProfilePic] = useState('/default-avatar.png');
  const [searchTerm, setSearchTerm] = useState(''); // Termo de busca do usuário
  const [searchResults, setSearchResults] = useState([]); // Resultados da busca
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setProfilePic(userData.photoURL || '/default-avatar.png');
        }
      }
    };
    fetchUserProfile();
  }, [user]);

  const handleLogout = () => {
    auth.signOut();
    navigate('/login');
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  const handleProfileClick = () => {
    if (user) {
      navigate(`/profile/${user.uid}`);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Função para buscar usuários no Firestore
  const handleSearch = async () => {
    if (searchTerm.trim() === '') {
      setSearchResults([]); // Limpar resultados se a barra de busca estiver vazia
      return;
    }

    // Consultar Firestore para usuários cujo nome de usuário contenha o termo de busca
    const q = query(collection(db, 'users'), where('username', '>=', searchTerm), where('username', '<=', searchTerm + '\uf8ff'));
    const querySnapshot = await getDocs(q);

    const results = [];
    querySnapshot.forEach((doc) => {
      results.push({ id: doc.id, ...doc.data() });
    });
    setSearchResults(results);
  };

  const handleResultClick = (resultId) => {
    navigate(`/profile/${resultId}`);
    setSearchResults([]); // Limpar resultados após clicar em um resultado
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Box sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={handleHomeClick}>
          <Typography variant="h6" component="div">
            U-ay
          </Typography>
        </Box>

        {/* Barra de Pesquisa de Usuários */}
        <Box sx={{ position: 'relative', flexGrow: 2 }}>
          <TextField
            label="Buscar usuário"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()} // Buscar ao pressionar Enter
            sx={{ backgroundColor: 'white', borderRadius: '8px', width: '100%' }}
          />
          {searchResults.length > 0 && (
            <Box
              sx={{
                position: 'absolute',
                top: '100%',
                left: 0,
                width: '100%',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
                zIndex: 2,
                maxHeight: '200px',
                overflowY: 'auto',
              }}
            >
              {searchResults.map((result) => (
                <Box
                  key={result.id}
                  onClick={() => handleResultClick(result.id)}
                  sx={{
                    padding: '8px',
                    borderBottom: '1px solid #e6ecf0',
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: '#f5f8fa' },
                  }}
                >
                  <Typography>{result.username}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {user ? (
          <Box display="flex" alignItems="center" ml={2}>
            <IconButton color="inherit" onClick={handleProfileClick}>
              <Avatar alt={user.displayName || "Profile"} src={profilePic} />
            </IconButton>
            <Button color="inherit" onClick={handleLogout}>
              Sair
            </Button>
          </Box>
        ) : (
          <Box>
            <Button color="inherit" onClick={() => navigate('/login')}>
              Login
            </Button>
            <Button color="inherit" onClick={() => navigate('/register')}>
              Signup
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default NavBar;
