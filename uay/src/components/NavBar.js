import React, { useEffect, useState } from 'react';
import { AppBar, Toolbar, Typography, Box, Button, IconButton, Avatar } from '@mui/material';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore'; // To fetch the user data from Firestore
import { useNavigate } from 'react-router-dom';

function NavBar() {
  const [user] = useAuthState(auth);
  const [profilePic, setProfilePic] = useState('/default-avatar.png'); // Default avatar
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        // Fetch the user's profile info from Firestore
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setProfilePic(userData.photoURL || '/default-avatar.png');
        }
      }
    };
    fetchUserProfile();
  }, [user]); // Re-fetch user data when `user` changes

  const handleLogout = () => {
    auth.signOut();
    navigate('/login');
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  const handleProfileClick = () => {
    if (user) {
      navigate(`/profile/${user.uid}`); // Navigate to the user's profile page using their UID
    }
  };

  return (
    <AppBar position="static">
      <Toolbar>
        {/* Make the U-ay text clickable to navigate to the home page */}
        <Box sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={handleHomeClick}>
          <Typography variant="h6" component="div">
            U-ay
          </Typography>
        </Box>

        {user ? (
          <Box display="flex" alignItems="center">
            <IconButton color="inherit" onClick={handleProfileClick}>
              {/* Use the updated profile picture */}
              <Avatar alt={user.displayName || "Profile"} src={profilePic} />
            </IconButton>
            <Button color="inherit" onClick={handleLogout}>
              Sair
            </Button>
          </Box>
        ) : (
          <Box>
            <Button color="inherit" onClick={() => navigate('/login')}>
              Login
            </Button>
            <Button color="inherit" onClick={() => navigate('/register')}>
              Signup
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default NavBar;
