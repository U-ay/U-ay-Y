// src/components/FollowButton.js
import React, { useState, useEffect } from 'react';
import { Button } from '@mui/material';
import { db, auth } from '../firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

function FollowButton({ targetUserId }) {
  const [user] = useAuthState(auth);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const checkFollowing = async () => {
      if (!user) return;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const following = userSnap.data().following || [];
        setIsFollowing(following.includes(targetUserId));
      }
    };

    checkFollowing();
  }, [user, targetUserId]);

  const handleFollow = async () => {
    if (!user) {
      alert("Você precisa estar logado para seguir usuários.");
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);
      const targetUserRef = doc(db, "users", targetUserId);

      if (isFollowing) {
        // Deixar de seguir
        await updateDoc(userRef, {
          following: arrayRemove(targetUserId)
        });
        await updateDoc(targetUserRef, {
          followers: arrayRemove(user.uid)
        });
        setIsFollowing(false);
      } else {
        // Seguir
        await updateDoc(userRef, {
          following: arrayUnion(targetUserId)
        });
        await updateDoc(targetUserRef, {
          followers: arrayUnion(user.uid)
        });
        setIsFollowing(true);
      }
    } catch (error) {
      console.error("Erro ao seguir/deixar de seguir:", error);
      alert("Falha ao atualizar o seguimento.");
    }
  };

  return (
    <Button variant={isFollowing ? "outlined" : "contained"} onClick={handleFollow}>
      {isFollowing ? "Deixar de Seguir" : "Seguir"}
    </Button>
  );
}

export default FollowButton;
