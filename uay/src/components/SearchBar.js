// src/components/SearchBar.js
import React, { useState } from 'react';
import {
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Paper,
  InputAdornment, // Added InputAdornment here
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './SearchBar.css';

function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (term.length < 2) {
      setResults([]);
      return;
    }

    const q = query(
      collection(db, 'users'),
      where('username', '>=', term),
      where('username', '<=', term + '\uf8ff')
    );

    try {
      const querySnapshot = await getDocs(q);
      const users = [];
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });
      setResults(users);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    }
  };

  const handleSelectUser = (userId) => {
    setSearchTerm('');
    setResults([]);
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="searchbar-container">
      <TextField
        label="Buscar Usuário"
        variant="outlined"
        value={searchTerm}
        onChange={handleSearch}
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
      {results.length > 0 && (
        <Paper className="search-results">
          <List>
            {results.map((user) => (
              <ListItem button key={user.id} onClick={() => handleSelectUser(user.id)}>
                <ListItemAvatar>
                  <Avatar src={user.avatar || '/default-avatar.png'} alt={user.username} />
                </ListItemAvatar>
                <ListItemText primary={user.username} secondary={user.email} />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </div>
  );
}

export default SearchBar;
