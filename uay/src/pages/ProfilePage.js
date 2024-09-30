import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Box, Typography, CircularProgress, Avatar, Button } from '@mui/material';
import TweetList from '../components/TweetList';
import AvatarUploader from '../components/AvatarUploader'; // Component for uploading avatars
import defaultAvatar from '../assets/default-avatar.png'; // Default avatar
import './ProfilePage.css';

function ProfilePage() {
  const { userId } = useParams(); // Get userId from URL params
  const [currentUser] = useAuthState(auth);
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false); // State for following
  const [followersCount, setFollowersCount] = useState(0); // Followers count

  useEffect(() => {
    const fetchProfile = async () => {
      let targetUserId = userId;
      if (!targetUserId && currentUser) {
        // If no userId is provided, show the logged-in user's profile
        targetUserId = currentUser.uid;
      }

      if (!targetUserId) {
        setLoadingProfile(false);
        return;
      }

      const userRef = doc(db, 'users', targetUserId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const profileData = userSnap.data();
        setProfile({ id: targetUserId, ...profileData });
        setFollowersCount(profileData.followers?.length || 0);

        // Check if current user is following the profile user
        if (currentUser && profileData.followers?.includes(currentUser.uid)) {
          setIsFollowing(true);
        }
      }
      setLoadingProfile(false);
    };

    fetchProfile();
  }, [userId, currentUser]);

  const handleFollow = async () => {
    if (!currentUser || !profile) return;

    const currentUserRef = doc(db, 'users', currentUser.uid);
    const targetUserRef = doc(db, 'users', profile.id);

    try {
      if (isFollowing) {
        // Unfollow the user
        await updateDoc(currentUserRef, {
          following: arrayRemove(profile.id)
        });
        await updateDoc(targetUserRef, {
          followers: arrayRemove(currentUser.uid)
        });
        setIsFollowing(false);
        setFollowersCount(followersCount - 1);
      } else {
        // Follow the user
        await updateDoc(currentUserRef, {
          following: arrayUnion(profile.id)
        });
        await updateDoc(targetUserRef, {
          followers: arrayUnion(currentUser.uid)
        });
        setIsFollowing(true);
        setFollowersCount(followersCount + 1);
      }
    } catch (error) {
      console.error("Erro ao seguir/deixar de seguir:", error);
    }
  };

  if (loadingProfile) {
    return (
      <Box className="profile-container" display="flex" justifyContent="center" alignItems="center">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box className="profile-container">
        <Typography variant="h6" color="text.secondary">
          Perfil não encontrado.
        </Typography>
      </Box>
    );
  }

  return (
    <Box className="profile-container">
      <Box className="profile-header">
        {/* Display the profile avatar, fallback to defaultAvatar if not available */}
        <Avatar src={profile.photoURL || defaultAvatar} alt={profile.username} className="profile-avatar" />
        <Typography variant="h4" color="text.primary">{profile.username}</Typography>
        
        {/* Display number of followers */}
        <Typography variant="body2" color="text.secondary">
          Seguidores: {followersCount}
        </Typography>

        {/* Show follow/unfollow button if not the logged-in user's own profile */}
        {currentUser?.uid !== profile.id && (
          <Button variant={isFollowing ? "outlined" : "contained"} color="primary" onClick={handleFollow}>
            {isFollowing ? 'Deixar de seguir' : 'Seguir'}
          </Button>
        )}

        {/* Show AvatarUploader only for the logged-in user viewing their own profile */}
        {currentUser?.uid === profile.id && <AvatarUploader />}
      </Box>
      
      <Box className="profile-tweets">
        <Typography variant="h5" color="text.primary">Tweets</Typography>
        <TweetList userId={profile.id} />
      </Box>
    </Box>
  );
}

export default ProfilePage;
