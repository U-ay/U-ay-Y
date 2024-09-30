import React from 'react';
import { Box, Typography, IconButton, Avatar } from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import RepeatIcon from '@mui/icons-material/Repeat';
import { useNavigate } from 'react-router-dom';
import './Tweet.css';

function Tweet({ tweet, handleLike, handleRetweet }) {
  const navigate = useNavigate();

  // Function to navigate to user profile page
  const handleUserClick = () => {
    navigate(`/profile/${tweet.userId}`);
  };

  // Function to determine if the uploaded file is an image or video
  const renderMedia = () => {
    if (tweet.fileUrls && tweet.fileUrls.length > 0) {
      // Select the last uploaded file (assuming fileUrls is an array of media URLs)
      const lastFileUrl = tweet.fileUrls[tweet.fileUrls.length - 1];
      const fileExtension = lastFileUrl.split('.').pop().toLowerCase();
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif'];
      const videoExtensions = ['mp4', 'webm', 'ogg'];

      if (imageExtensions.includes(fileExtension)) {
        return <img src={lastFileUrl} alt="Uploaded media" className="tweet-media" />;
      } else if (videoExtensions.includes(fileExtension)) {
        return (
          <video controls className="tweet-media">
            <source src={lastFileUrl} type={`video/${fileExtension}`} />
            Your browser does not support the video tag.
          </video>
        );
      }
    }
    return null; // Return nothing if no media is present
  };

  return (
    <Box className="tweet">
      <Box className="tweet-header">
        {/* Use tweet.userAvatar if available, otherwise fall back to a default avatar */}
        <Avatar 
          src={tweet.userAvatar || '/default-avatar.png'} 
          alt={tweet.user} 
          className="tweet-avatar" 
        />
        <Box className="tweet-header-info">
          {/* Clicking on the username navigates to the user's profile */}
          <Typography 
            variant="body1" 
            className="tweet-user" 
            onClick={handleUserClick}
            style={{ cursor: 'pointer' }}
          >
            {tweet.user.replace('@', '')}
          </Typography>
          <Typography variant="caption" className="tweet-timestamp">
            @{tweet.user.replace('@', '')} · {tweet.timestamp?.toDate().toLocaleString()}
          </Typography>
        </Box>
      </Box>

      <Typography variant="body1" className="tweet-content">{tweet.content}</Typography>

      {/* Render last uploaded image or video */}
      {renderMedia()}

      <Box className="tweet-actions">
        <IconButton onClick={() => handleLike(tweet)} className="like-button">
          {tweet.likedBy.includes(tweet.currentUserUid) ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
        </IconButton>
        <Typography variant="body2" className="action-count">{tweet.likes}</Typography>

        <IconButton onClick={() => handleRetweet(tweet)} className="retweet-button">
          <RepeatIcon color={(tweet.retweetedBy || []).includes(tweet.currentUserUid) ? "success" : "inherit"} />
        </IconButton>
        <Typography variant="body2" className="action-count">{tweet.retweets}</Typography>
      </Box>
    </Box>
  );
}

export default Tweet;
