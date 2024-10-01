import React, { useState } from 'react';
import { Box, Typography, IconButton, Avatar, Button } from '@mui/material';
import { useAuthState } from 'react-firebase-hooks/auth';
import { db, auth } from '../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import './Comment.css'; // Estilos opcionais

function Comment({ comment, tweetId, handleReply }) {
  const [expanded, setExpanded] = useState(false);
  const [reply, setReply] = useState('');
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [user] = useAuthState(auth);

  const handleExpand = () => {
    setExpanded(!expanded);
  };

  const handleAddReply = async () => {
    if (!user) return;

    const tweetRef = doc(db, 'tweets', tweetId);
    const newReply = {
      commentId: `${comment.commentId}-${new Date().getTime()}`,
      userId: user.uid,
      content: reply.trim(),
      timestamp: new Date(),
    };

    await updateDoc(tweetRef, {
      [`comments.${comment.commentId}.subComments`]: arrayUnion(newReply),
    });

    setReply('');
    setShowReplyInput(false);
  };

  return (
    <Box className="comment">
      <Box className="comment-header">
        <Avatar src={comment.userAvatar || '/default-avatar.png'} alt={comment.userId} />
        <Typography variant="body2">{comment.content}</Typography>
        <Typography variant="caption">{new Date(comment.timestamp).toLocaleString()}</Typography>
      </Box>

      <Button onClick={() => setShowReplyInput(!showReplyInput)}>Responder</Button>

      {showReplyInput && (
        <Box className="reply-input">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Escreva sua resposta"
          />
          <Button onClick={handleAddReply}>Enviar</Button>
        </Box>
      )}

      {comment.subComments && comment.subComments.length > 0 && (
        <Box>
          <Button onClick={handleExpand}>
            {expanded ? 'Ver menos' : `Ver ${comment.subComments.length} respostas`}
          </Button>
          {expanded && (
            <Box className="sub-comments">
              {comment.subComments.map((subComment) => (
                <Comment key={subComment.commentId} comment={subComment} tweetId={tweetId} />
              ))}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

export default Comment;
