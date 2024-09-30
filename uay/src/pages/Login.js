// src/pages/Login.js
import React, { useState } from 'react';
import './Login.css';
import { Avatar, Button, TextField, Link, Grid, Box, Typography, Container, CssBaseline } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import logo from '../assets/logo192.png'; // Correct path

function Login() {
  const [identifier, setIdentifier] = useState(''); // Email ou @username
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      let emailToUse = identifier;

      // Se o identificador começa com @, buscar o email correspondente no Firestore
      if (identifier.startsWith('@')) {
        const username = identifier.trim();
        const q = query(collection(db, "users"), where("username", "==", username));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          alert("Nome de usuário não encontrado.");
          return;
        }
        // Obtém o email associado ao nome de usuário
        const userDoc = querySnapshot.docs[0];
        emailToUse = userDoc.data().email;
      }

      // Realiza o login com email e senha
      await signInWithEmailAndPassword(auth, emailToUse, password);
      navigate('/');
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      alert("Falha no login. Verifique suas credenciais.");
    }
  };

  return (
    <Container component="main" maxWidth="xs" className="login-container">
      <CssBaseline />
      <Box className="login-box">
        <Avatar src={logo} alt="Logo" className="login-logo">
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5" color="text.primary">
          @Login
        </Typography>
        <Box component="form" onSubmit={handleSubmit} className="login-form">
          <TextField
            margin="normal"
            required
            fullWidth
            id="identifier"
            label="Email ou Nome de Usuário (@username)"
            name="identifier"
            autoComplete="email"
            autoFocus
            value={identifier}
            onChange={(e)=> setIdentifier(e.target.value)}
            className="login-textfield"
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
            autoComplete="current-password"
            value={password}
            onChange={(e)=> setPassword(e.target.value)}
            className="login-textfield"
            InputLabelProps={{ shrink: true }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            className="login-button"
          >
            Entrar
          </Button>
          <Grid container justifyContent="flex-end">
            <Grid item>
              <Link href="/@register" variant="body2" className="login-link">
                {"Não tem uma conta? Registre-se"}
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
}

export default Login;
