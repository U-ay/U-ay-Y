// src/components/Uai.js
import React, { useState } from 'react';
import { Box, Typography, IconButton, Avatar, Modal, TextField, Button } from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import RepeatIcon from '@mui/icons-material/Repeat';
import CommentIcon from '@mui/icons-material/Comment';
import { useNavigate } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
import './Uai.css';
import Linkify from 'react-linkify';

function Uai({ uai, handleLike, handleReuai, handleComment, currentUser }) {
  const navigate = useNavigate();
  const [openCommentModal, setOpenCommentModal] = useState(false);
  const [comment, setComment] = useState('');
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const [openReuaiModal, setOpenReuaiModal] = useState(false);
  const [reuaiComment, setReuaiComment] = useState('');

  // Function to format the timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';

    let date;
    if (timestamp instanceof Timestamp) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }

    return date.toLocaleString();
  };

  // Function to navigate to user profile page
  const handleUserClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  // Function to render media (images or videos)
  const renderMedia = () => {
    if (uai.fileUrls && uai.fileUrls.length > 0) {
      return (
        <Box className="uai-media">
          {uai.fileUrls.map((fileUrl, index) => {
            const fileExtension = fileUrl.split('.').pop().toLowerCase();
            const imageExtensions = ['jpg', 'jpeg', 'png', 'gif'];
            const videoExtensions = ['mp4', 'webm', 'ogg'];

            if (imageExtensions.includes(fileExtension)) {
              return <img key={index} src={fileUrl} alt="Uploaded media" />;
            } else if (videoExtensions.includes(fileExtension)) {
              return (
                <video key={index} controls>
                  <source src={fileUrl} type={`video/${fileExtension}`} />
                  Seu navegador não suporta a tag de vídeo.
                </video>
              );
            }
            return null;
          })}
        </Box>
      );
    }
    return null;
  };

  // Function to toggle comment display
  const handleCommentIconClick = () => {
    setCommentsExpanded(prev => !prev);
  };

  // Functions to open and close the comment modal
  const handleOpenCommentModal = () => setOpenCommentModal(true);
  const handleCloseCommentModal = () => setOpenCommentModal(false);

  // Functions to open and close the re-uai modal
  const handleOpenReuaiModal = () => setOpenReuaiModal(true);
  const handleCloseReuaiModal = () => setOpenReuaiModal(false);

  // Function to post a comment
  const handlePostComment = () => {
    if (comment.trim() !== '') {
      handleComment(uai, comment);
      setComment('');
      handleCloseCommentModal();
    }
  };

  // Function to post a subcomment (reply to a comment)
  const handlePostSubComment = (parentCommentId, subCommentText) => {
    if (subCommentText.trim() !== '') {
      handleComment(uai, subCommentText, parentCommentId);
    }
  };

  // Function to post a re-uai
  const handlePostReuai = () => {
    handleReuai(uai, reuaiComment);
    setReuaiComment('');
    handleCloseReuaiModal();
  };

  // Function to render comments recursively
  const renderComments = (commentsList) => {
    return commentsList.map((commentItem, index) => (
      <Box key={index} className="uai-comment">
        <Avatar
          src={commentItem.userAvatar || '/default-avatar.png'}
          alt={commentItem.username}
          className="uai-comment-avatar"
          onClick={() => handleUserClick(commentItem.userId)}
          style={{ cursor: 'pointer' }}
        />
        <Box className="uai-comment-content">
          <Typography
            variant="body2"
            className="uai-comment-user"
            onClick={() => handleUserClick(commentItem.userId)}
            style={{ cursor: 'pointer' }}
          >
            {commentItem.username || commentItem.userId}
          </Typography>
          <Typography variant="body2" className="uai-comment-text">
            <Linkify>{commentItem.content}</Linkify>
          </Typography>
          <Typography variant="caption" className="uai-comment-timestamp">
            {formatTimestamp(commentItem.timestamp)}
          </Typography>
          {/* Button to reply to this comment */}
          <Button
            variant="text"
            size="small"
            onClick={() => handleReplyClick(commentItem.commentId)}
          >
            Responder
          </Button>
          {/* If replying to this comment, show input field */}
          {commentReplies[commentItem.commentId]?.isReplying && (
            <Box className="uai-subcomment-input">
              <TextField
                label="Escreva sua resposta"
                multiline
                rows={2}
                fullWidth
                variant="outlined"
                value={commentReplies[commentItem.commentId]?.replyText || ''}
                onChange={(e) => handleSubCommentChange(commentItem.commentId, e.target.value)}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={() => handlePostSubComment(commentItem.commentId, commentReplies[commentItem.commentId]?.replyText)}
              >
                Responder
              </Button>
            </Box>
          )}
          {/* Render subcomments recursively */}
          {commentItem.subComments && commentItem.subComments.length > 0 && (
            <Box className="uai-subcomments">
              {renderComments(commentItem.subComments)}
            </Box>
          )}
        </Box>
      </Box>
    ));
  };

  // State management for replying to comments
  const [commentReplies, setCommentReplies] = useState({});

  const handleReplyClick = (commentId) => {
    setCommentReplies((prev) => ({
      ...prev,
      [commentId]: { isReplying: true, replyText: '' },
    }));
  };

  const handleSubCommentChange = (commentId, text) => {
    setCommentReplies((prev) => ({
      ...prev,
      [commentId]: { ...prev[commentId], replyText: text },
    }));
  };

  return (
    <Box className="uai">
      <Avatar
        src={uai.userAvatar || '/default-avatar.png'}
        alt={uai.user}
        className="uai-avatar"
        onClick={() => handleUserClick(uai.userId)}
        style={{ cursor: 'pointer' }}
      />
      <Box className="uai-content">
        <Box className="uai-header-info">
          <Typography
            variant="body1"
            className="uai-user"
            onClick={() => handleUserClick(uai.userId)}
            style={{ cursor: 'pointer' }}
          >
            {uai.user}
          </Typography>
          <Typography variant="body2" className="uai-username">
            @{uai.user.replace('@', '')}
          </Typography>
          <Typography variant="caption" className="uai-timestamp">
            · {formatTimestamp(uai.timestamp)}
          </Typography>
        </Box>

        <Typography variant="body1" className="uai-text">
          <Linkify>{uai.content}</Linkify>
        </Typography>

        {/* If this is a re-uai, display the original uai */}
        {uai.originalUaiId && (
          <Box className="uai-original">
            <Typography variant="body2" color="text.secondary">
              Re-uai de @{uai.originalUser.replace('@', '')}:
            </Typography>
            <Typography variant="body2">
              {uai.originalContent}
            </Typography>
          </Box>
        )}

        {renderMedia()}

        {/* Ações do uai */}
        <Box className="uai-actions">
          <IconButton onClick={() => handleLike(uai)} className="like-button">
            {uai.likedBy.includes(currentUser?.uid) ? (
              <FavoriteIcon color="error" />
            ) : (
              <FavoriteBorderIcon />
            )}
          </IconButton>
          <Typography variant="body2" className="action-count">{uai.likes}</Typography>

          <IconButton onClick={handleOpenReuaiModal} className="reuai-button">
            <RepeatIcon
              color={uai.reuaiedBy.includes(currentUser?.uid) ? 'success' : 'inherit'}
            />
          </IconButton>
          <Typography variant="body2" className="action-count">{uai.reuais}</Typography>

          {/* Comment button to toggle comments */}
          <IconButton onClick={handleCommentIconClick} className="comment-button">
            <CommentIcon />
          </IconButton>
          <Typography variant="body2" className="action-count">
            {uai.comments?.length || 0}
          </Typography>
        </Box>

        {/* Display comments if expanded */}
        {commentsExpanded && (
          <Box className="uai-comments">
            {uai.comments && uai.comments.length > 0 ? (
              renderComments(uai.comments)
            ) : (
              <Typography variant="body2" color="text.secondary">
                Nenhum comentário ainda.
              </Typography>
            )}
            {/* Button to open the add comment modal */}
            <Button variant="text" onClick={handleOpenCommentModal} className="add-comment-button">
              Adicionar comentário
            </Button>
          </Box>
        )}

        {/* Comment modal */}
        <Modal
          open={openCommentModal}
          onClose={handleCloseCommentModal}
          aria-labelledby="comment-modal-title"
          aria-describedby="comment-modal-description"
        >
          <Box
            className="modal-box"
            sx={{
              width: 400,
              padding: 4,
              margin: 'auto',
              marginTop: '10%',
              backgroundColor: 'white',
              borderRadius: 4,
            }}
          >
            <Typography id="comment-modal-title" variant="h6" component="h2">
              Comentar
            </Typography>
            <TextField
              id="comment-modal-description"
              label="Escreva seu comentário"
              multiline
              rows={4}
              fullWidth
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              variant="outlined"
              sx={{ mt: 2, mb: 2 }}
            />
            <Button variant="contained" color="primary" onClick={handlePostComment}>
              Comentar
            </Button>
          </Box>
        </Modal>

        {/* Re-uai modal */}
        <Modal
          open={openReuaiModal}
          onClose={handleCloseReuaiModal}
          aria-labelledby="reuai-modal-title"
          aria-describedby="reuai-modal-description"
        >
          <Box
            className="modal-box"
            sx={{
              width: 500,
              padding: 4,
              margin: 'auto',
              marginTop: '10%',
              backgroundColor: 'white',
              borderRadius: 4,
            }}
          >
            <Typography id="reuai-modal-title" variant="h6" component="h2">
              Re-uai
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Re-uaiando o uai de @{uai.user.replace('@', '')}:
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {uai.content}
            </Typography>
            <TextField
              id="reuai-modal-description"
              label="Adicione um comentário (opcional)"
              multiline
              rows={4}
              fullWidth
              value={reuaiComment}
              onChange={(e) => setReuaiComment(e.target.value)}
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <Button variant="contained" color="primary" onClick={handlePostReuai}>
              Re-uai
            </Button>
          </Box>
        </Modal>
      </Box>
    </Box>
  );
}

export default Uai;
