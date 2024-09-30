import React, { useState, useEffect } from 'react';
import { Button, TextField, Box, Avatar, Typography, IconButton } from '@mui/material';
import { db, auth, storage } from '../firebase';
import { collection, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useAuthState } from 'react-firebase-hooks/auth';
import './TweetBox.css';
import UploadIcon from '@mui/icons-material/Upload';

function TweetBox() {
  const [tweet, setTweet] = useState('');
  const [user] = useAuthState(auth);
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [file, setFile] = useState(null); // Store uploaded file
  const [uploadProgress, setUploadProgress] = useState(0); // Track file upload progress
  const [fileUrls, setFileUrls] = useState([]); // Store array of file URLs after upload

  useEffect(() => {
    const fetchUsername = async () => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUsername(userSnap.data().username);
          setAvatarUrl(userSnap.data().photoURL || '/default-avatar.png'); // Get user avatar
        } else {
          console.error("User document does not exist");
        }
      }
    };
    fetchUsername();
  }, [user]);

  const sendTweet = async (e) => {
    e.preventDefault();
    if (tweet.trim() === '' && fileUrls.length === 0) {
      console.error("Tweet content is empty and no file uploaded");
      return;
    }

    try {
      await addDoc(collection(db, "tweets"), {
        content: tweet,
        user: username,
        userAvatar: avatarUrl,
        userId: user.uid,
        timestamp: serverTimestamp(),
        fileUrls: fileUrls, // Store uploaded file URLs with the tweet
        likes: 0,
        retweets: 0,
        likedBy: [],
        retweetedBy: []
      });
      setTweet(''); // Reset tweet input
      setFile(null); // Reset file input
      setFileUrls([]); // Reset file URLs array
      setUploadProgress(0); // Reset upload progress
    } catch (error) {
      console.error("Erro ao enviar tweet:", error);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.size <= 50 * 1024 * 1024) { // Check if file size is <= 50MB
      setFile(selectedFile);
      uploadFile(selectedFile);
    } else {
      alert('File size should not exceed 50MB.');
    }
  };

  const uploadFile = (file) => {
    const storageRef = ref(storage, `uploads/${user.uid}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error('File upload error:', error);
        alert('Error uploading file. Please try again.');
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setFileUrls((prevUrls) => [...prevUrls, downloadURL]); // Append the new URL to the fileUrls array
      }
    );
  };

  return (
    <Box component="form" onSubmit={sendTweet} className="tweetbox-container">
      <Box className="tweetbox-header">
        <Avatar src={avatarUrl} alt={username} className="tweetbox-avatar" /> {/* Display user's avatar */}
        <Typography variant="h6" color="text.primary">
          {username || "Carregando..."} {/* Show a loading placeholder if username isn't ready */}
        </Typography>
      </Box>

      <TextField
        fullWidth
        multiline
        minRows={3}
        variant="filled"
        placeholder="O que está acontecendo?"
        value={tweet}
        onChange={(e) => setTweet(e.target.value)}
        className="tweetbox-textfield"
        InputProps={{
          disableUnderline: true,
        }}
      />

      <Box className="tweetbox-file-upload">
        <IconButton component="label">
          <UploadIcon />
          <input type="file" hidden onChange={handleFileChange} accept="image/*,video/*" />
        </IconButton>

        {file && (
          <Typography variant="body2" color="text.secondary">
            {file.name} - {Math.round(uploadProgress)}% uploaded
          </Typography>
        )}

        {fileUrls.length > 0 && (
          <Typography variant="body2" color="text.secondary">
            File uploaded successfully.
          </Typography>
        )}
      </Box>

      <Button 
        type="submit" 
        variant="contained" 
        className="tweetbox-button"
        disabled={!username || (!tweet && fileUrls.length === 0)} // Disable button if no content or file uploaded
      >
        Enviar Uay
      </Button>
    </Box>
  );
}

export default TweetBox;
