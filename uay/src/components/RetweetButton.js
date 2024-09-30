// src/components/RetweetButton.js
import React, { useState } from 'react';
import { IconButton, Typography, Snackbar, Alert } from '@mui/material';
import RepeatIcon from '@mui/icons-material/Repeat';
import { db, auth } from '../firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

function RetweetButton({ tweet }) {
  const [user] = useAuthState(auth);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleRetweet = async () => {
    if (!user) {
      alert("Você precisa estar logado para retweetar.");
      return;
    }

    const tweetRef = doc(db, "tweets", tweet.id);
    const hasRetweeted = tweet.retweetedBy.includes(user.uid);

    try {
      if (hasRetweeted) {
        // Remover retweet
        await updateDoc(tweetRef, {
          retweets: increment(-1),
          retweetedBy: arrayRemove(user.uid),
        });
        setSnackbar({
          open: true,
          message: "Retweet removido!",
          severity: "info",
        });
      } else {
        // Adicionar retweet
        await updateDoc(tweetRef, {
          retweets: increment(1),
          retweetedBy: arrayUnion(user.uid),
        });
        setSnackbar({
          open: true,
          message: "Retweet adicionado!",
          severity: "success",
        });
      }
    } catch (error) {
      console.error("Erro ao retweetar:", error);
      setSnackbar({
        open: true,
        message: "Erro ao retweetar.",
        severity: "error",
      });
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <>
      <IconButton onClick={handleRetweet} className="retweet-button">
        <RepeatIcon color={(tweet.retweetedBy || []).includes(user?.uid) ? "success" : "inherit"} />
      </IconButton>
      <Typography variant="body2" className="action-count">{tweet.retweets}</Typography>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default RetweetButton;
