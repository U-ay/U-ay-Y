// src/theme.js
import { createTheme } from '@mui/material/styles';
import { blue, orange, grey } from '@mui/material/colors';

const theme = createTheme({
  palette: {
    primary: {
      main: orange[500], // Laranja
    },
    secondary: {
      main: blue[500], // Azul
    },
    background: {
      default: grey[100], // Fundo claro
      paper: '#FFFFFF', // Fundo branco para elementos
    },
    text: {
      primary: '#333333', // Texto principal
      secondary: '#555555', // Texto secundário
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
    h5: {
      fontWeight: 600,
    },
    body1: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 20,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            backgroundColor: grey[200],
            borderRadius: 10,
          },
          '& .MuiInputLabel-root': {
            color: grey[700],
          },
        },
      },
    },
  },
});

export default theme;
