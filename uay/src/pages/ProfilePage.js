// src/pages/ProfilePage.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Box, Typography, CircularProgress, Avatar, Button } from '@mui/material';
import UaiList from '../components/UaiList';
import AvatarUploader from '../components/AvatarUploader'; // Componente para fazer upload de avatares
import defaultAvatar from '../assets/default-avatar.png'; // Avatar padrão
import './ProfilePage.css';

function ProfilePage() {
  const { userId } = useParams(); // Obtém o userId dos parâmetros da URL
  const [currentUser] = useAuthState(auth);
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false); // Estado de seguir
  const [followersCount, setFollowersCount] = useState(0); // Contagem de seguidores

  useEffect(() => {
    const fetchProfile = async () => {
      let targetUserId = userId;
      if (!targetUserId && currentUser) {
        // Se nenhum userId for fornecido, mostra o perfil do usuário logado
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

        // Verifica se o usuário atual está seguindo o perfil
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
        // Deixar de seguir o usuário
        await updateDoc(currentUserRef, {
          following: arrayRemove(profile.id)
        });
        await updateDoc(targetUserRef, {
          followers: arrayRemove(currentUser.uid)
        });
        setIsFollowing(false);
        setFollowersCount(followersCount - 1);
      } else {
        // Seguir o usuário
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
        {/* Exibe o avatar do perfil, usa defaultAvatar se não estiver disponível */}
        <Avatar src={profile.photoURL || defaultAvatar} alt={profile.username} className="profile-avatar" />
        <Typography variant="h4" color="text.primary" className="profile-username">{profile.username}</Typography>
        
        {/* Exibe o número de seguidores */}
        <Typography variant="body2" color="text.secondary" className="profile-followers">
          Seguidores: {followersCount}
        </Typography>

        {/* Mostra o botão de seguir/deixar de seguir se não for o próprio perfil do usuário logado */}
        {currentUser?.uid !== profile.id && (
          <Button variant={isFollowing ? "outlined" : "contained"} color="primary" onClick={handleFollow} className="profile-action-button">
            {isFollowing ? 'Deixar de seguir' : 'Seguir'}
          </Button>
        )}

        {/* Mostra o AvatarUploader apenas para o usuário logado visualizando seu próprio perfil */}
        {currentUser?.uid === profile.id && <AvatarUploader />}
      </Box>
      
      <Box className="profile-uais">
        <UaiList userId={profile.id} />
      </Box>
    </Box>
  );
}

export default ProfilePage;
