import React, { useState } from 'react';
import { Modal, Box, Typography, TextField, Button } from '@mui/material';
import { db, auth } from '../firebase';
import { doc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  borderRadius: 2,
  boxShadow: 24,
  p: 4,
};

function RetweetModal({ open, handleClose, tweetId }) {
  const [comment, setComment] = useState('');
  const [user] = useAuthState(auth);

  const handleRetweet = async () => {
    if (!user) {
      alert("Você precisa estar logado para retweetar.");
      return;
    }

    const tweetRef = doc(db, "tweets", tweetId);

    try {
      await updateDoc(tweetRef, {
        retweets: increment(1),
        retweetedBy: arrayUnion(user.uid),
        retweetsData: arrayUnion({
          retweetUserId: user.uid,
          retweetUsername: user.displayName,
          comment: comment.trim() || null,
          retweetTimestamp: new Date()
        })
      });
      handleClose();
    } catch (error) {
      console.error("Erro ao retweetar:", error);
      alert("Erro ao retweetar.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="retweet-modal-title"
      aria-describedby="retweet-modal-description"
    >
      <Box sx={style}>
        <Typography id="retweet-modal-title" variant="h6" component="h2">
          Retweetar
        </Typography>
        <TextField
          id="retweet-comment"
          label="Adicionar um comentário (opcional)"
          multiline
          rows={4}
          fullWidth
          variant="outlined"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          sx={{ mt: 2, mb: 2 }}
        />
        <Button variant="contained" color="primary" onClick={handleRetweet}>
          Retweetar
        </Button>
      </Box>
    </Modal>
  );
}

export default RetweetModal;
