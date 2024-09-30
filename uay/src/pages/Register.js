// src/pages/Register.js
import React, { useState } from 'react';
import './Register.css';
import { 
  Avatar, Button, TextField, Link, Grid, Box, Typography, Container, CssBaseline 
} from '@mui/material';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import logo from './logo192.png'; // Correct logo path

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Basic username validation
    if (!username.startsWith('@')) {
      alert("O nome de usuário deve começar com '@'.");
      return;
    }

    const trimmedUsername = username.trim();

    // Check if username already exists in Firestore
    const q = query(collection(db, "users"), where("username", "==", trimmedUsername));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      alert("Nome de usuário já está em uso. Por favor, escolha outro.");
      return;
    }

    try {
      // Create the user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Wait for the user to be authenticated and update the profile
      await updateProfile(user, {
        displayName: trimmedUsername,
      });

      // Ensure the user is authenticated before writing to Firestore
      if (auth.currentUser) {
        // Write additional user data to Firestore
        await setDoc(doc(db, "users", auth.currentUser.uid), {
          email: email,
          username: trimmedUsername,
          createdAt: new Date(),
          likedTweets: [], // Optional: Store liked tweets
          retweetedTweets: [], // Optional: Store retweeted tweets
        });

        // Redirect after successful registration
        navigate('/');
      } else {
        throw new Error("User not authenticated after registration.");
      }

    } catch (error) {
      console.error("Erro ao registrar:", error);
      alert("Falha no registro. Verifique suas informações.");
    }
  };

  return (
    <Container component="main" maxWidth="xs" className="register-container">
      <CssBaseline />
      <Box className="register-box">
        <Avatar src={logo} alt="Logo" className="register-logo">
          <PersonAddOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5" color="text.primary">
          @Register
        </Typography>
        <Box component="form" onSubmit={handleSubmit} className="register-form">
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Nome de Usuário (@username)"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e)=> setUsername(e.target.value)}
            className="register-textfield"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Endereço de Email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e)=> setEmail(e.target.value)}
            className="register-textfield"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Senha"
            type="password"
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={(e)=> setPassword(e.target.value)}
            className="register-textfield"
            InputLabelProps={{ shrink: true }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            className="register-button"
          >
            Registrar
          </Button>
          <Grid container justifyContent="flex-end">
            <Grid item>
              <Link href="/login" variant="body2" className="register-link">
                {"Já tem uma conta? Entre"}
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
}

export default Register;
