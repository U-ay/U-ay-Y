// src/components/UaiList.js
import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import {
  collection, query, orderBy, onSnapshot, doc, updateDoc,
  arrayUnion, arrayRemove, increment, where, getDoc, getDocs, limit, startAfter, serverTimestamp, addDoc
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Box, Typography, CircularProgress, Snackbar, Alert, Button } from '@mui/material';
import './UaiList.css';
import Uai from './Uai';

function UaiList({ followingOnly = false, sortByWeight = false, userId = null }) {
  const [uais, setUais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user] = useAuthState(auth);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [following, setFollowing] = useState([]);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Fetch user data (username and avatar)
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUsername(userSnap.data().username);
          setAvatarUrl(userSnap.data().photoURL || '/default-avatar.png');
        } else {
          console.error("User document does not exist");
        }
      }
    };
    fetchUserData();
  }, [user]);

  // Fetch the list of users the current user is following
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchFollowing = async () => {
      setFollowingLoading(true);
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const followingList = userSnap.data().following || [];
          setFollowing(followingList);
        } else {
          setFollowing([]);
        }
      } catch (error) {
        console.error('Erro ao buscar seguindo:', error);
        setSnackbar({
          open: true,
          message: 'Erro ao buscar seguindo.',
          severity: 'error',
        });
        setFollowing([]);
      } finally {
        setFollowingLoading(false);
      }
    };

    fetchFollowing();
  }, [user]);

  // Fetch uais based on the current view (global, following, or user profile) with pagination
  useEffect(() => {
    const fetchUais = async () => {
      if (!user) {
        setUais([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      const uaisRef = collection(db, 'uais');
      let q;

      try {
        if (userId) {
          // Fetch uais from a specific user
          q = query(uaisRef, where('userId', '==', userId), orderBy('timestamp', 'desc'), limit(10));
        } else if (followingOnly) {
          if (following.length === 0) {
            setUais([]);
            setLoading(false);
            return;
          }

          q = query(
            uaisRef,
            where('userId', 'in', following),
            orderBy('timestamp', 'desc'),
            limit(10)
          );
        } else {
          // Fetch global uais
          q = query(uaisRef, orderBy('timestamp', 'desc'), limit(10));
        }

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const uaisData = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            data.likedBy = data.likedBy || [];
            data.reuaiedBy = data.reuaiedBy || [];
            data.likes = data.likes || 0;
            data.reuais = data.reuais || 0;
            data.comments = data.comments || [];
            uaisData.push({ id: doc.id, ...data });
          });
          setUais(uaisData);
          setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
          setLoading(false);
        }, (error) => {
          console.error('Erro ao escutar uais:', error);
          setSnackbar({
            open: true,
            message: 'Erro ao escutar uais.',
            severity: 'error',
          });
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Erro ao buscar uais:', error);
        setSnackbar({
          open: true,
          message: 'Erro ao buscar uais.',
          severity: 'error',
        });
        setLoading(false);
      }
    };

    if (!followingLoading) {
      fetchUais();
    }

  }, [followingOnly, following, userId, user]);

  // Fetch more uais for pagination
  const fetchMoreUais = async () => {
    if (!hasMore || loading) return;

    setLoading(true);
    try {
      const uaisRef = collection(db, 'uais');
      let q;

      if (userId) {
        q = query(
          uaisRef,
          where('userId', '==', userId),
          orderBy('timestamp', 'desc'),
          startAfter(lastVisible),
          limit(10)
        );
      } else if (followingOnly) {
        q = query(
          uaisRef,
          where('userId', 'in', following),
          orderBy('timestamp', 'desc'),
          startAfter(lastVisible),
          limit(10)
        );
      } else {
        q = query(
          uaisRef,
          orderBy('timestamp', 'desc'),
          startAfter(lastVisible),
          limit(10)
        );
      }

      const querySnapshot = await getDocs(q);
      const uaisData = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        data.likedBy = data.likedBy || [];
        data.reuaiedBy = data.reuaiedBy || [];
        data.likes = data.likes || 0;
        data.reuais = data.reuais || 0;
        data.comments = data.comments || [];
        uaisData.push({ id: doc.id, ...data });
      });

      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setUais((prevUais) => [...prevUais, ...uaisData]);
      setHasMore(querySnapshot.docs.length === 10);
    } catch (error) {
      console.error('Erro ao buscar mais uais:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao buscar mais uais.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle like functionality
  const handleLike = async (uai) => {
    if (!user) {
      setSnackbar({
        open: true,
        message: 'Você precisa estar logado para dar like.',
        severity: 'warning',
      });
      return;
    }

    const uaiRef = doc(db, 'uais', uai.id);
    const hasLiked = uai.likedBy.includes(user.uid);

    try {
      if (hasLiked) {
        await updateDoc(uaiRef, {
          likes: increment(-1),
          likedBy: arrayRemove(user.uid)
        });
      } else {
        await updateDoc(uaiRef, {
          likes: increment(1),
          likedBy: arrayUnion(user.uid)
        });
      }
    } catch (error) {
      console.error('Erro ao dar like:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao dar like.',
        severity: 'error',
      });
    }
  };

  // Handle re-uai functionality (retweet)
  const handleReuai = async (uai, reuaiComment) => {
    if (!user) {
      setSnackbar({
        open: true,
        message: 'Você precisa estar logado para re-uai.',
        severity: 'warning',
      });
      return;
    }

    try {
      // Create a new uai document representing the re-uai
      await addDoc(collection(db, 'uais'), {
        content: reuaiComment || '',
        user: username,
        userAvatar: avatarUrl,
        userId: user.uid,
        timestamp: serverTimestamp(),
        fileUrls: uai.fileUrls || [],
        originalUaiId: uai.id,
        originalUserId: uai.userId,
        originalContent: uai.content,
        originalUser: uai.user,
        likes: 0,
        reuais: 0,
        likedBy: [],
        reuaiedBy: [],
        comments: []
      });

      // Update the original uai's re-uai count
      const uaiRef = doc(db, 'uais', uai.id);
      await updateDoc(uaiRef, {
        reuais: increment(1),
        reuaiedBy: arrayUnion(user.uid)
      });
    } catch (error) {
      console.error('Erro ao re-uai:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao re-uai.',
        severity: 'error',
      });
    }
  };

  // Handle comment functionality
  const handleComment = async (uai, commentText, parentCommentId = null) => {
    if (!user) {
      setSnackbar({
        open: true,
        message: 'Você precisa estar logado para comentar.',
        severity: 'warning',
      });
      return;
    }

    try {
      const newComment = {
        commentId: `comment-${Date.now()}`,
        userId: user.uid,
        username: username,
        userAvatar: avatarUrl,
        content: commentText.trim(),
        timestamp: serverTimestamp(),
        subComments: [],
      };

      const uaiRef = doc(db, 'uais', uai.id);

      const uaiSnapshot = await getDoc(uaiRef);
      let comments = uaiSnapshot.data().comments || [];

      if (parentCommentId) {
        // Add subcomment to the parent comment
        const updateComments = (commentsList) => {
          return commentsList.map((comment) => {
            if (comment.commentId === parentCommentId) {
              return {
                ...comment,
                subComments: [...(comment.subComments || []), newComment],
              };
            } else if (comment.subComments && comment.subComments.length > 0) {
              return {
                ...comment,
                subComments: updateComments(comment.subComments),
              };
            } else {
              return comment;
            }
          });
        };

        comments = updateComments(comments);
      } else {
        // Add as a new comment
        comments.push(newComment);
      }

      await updateDoc(uaiRef, {
        comments: comments,
      });

      // Update local state
      setUais((prevUais) =>
        prevUais.map((t) =>
          t.id === uai.id
            ? { ...t, comments: comments }
            : t
        )
      );
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao adicionar comentário.',
        severity: 'error',
      });
    }
  };

  // Function to calculate the weight of a uai
  const calculateWeight = (uai) => {
    const likes = uai.likes || 0;
    const reuais = uai.reuais || 0;
    const now = new Date();
    const uaiDate = uai.timestamp ? uai.timestamp.toDate() : now;
    const diffInHours = Math.abs(now - uaiDate) / 36e5;

    // Decay: each hour reduces the weight by 0.1
    const decay = diffInHours * 0.1;

    // Bonus if the author is followed
    const isAuthorFollowed = following.includes(uai.userId) ? 5 : 0;

    // Weight: Likes * 2 + Reuais * 1.5 + Bonus - Decay
    const weight = (likes * 2) + (reuais * 1.5) + isAuthorFollowed - decay;

    return weight;
  };

  // Sort uais based on weight or timestamp
  const sortedUais = [...uais].sort((a, b) => {
    if (sortByWeight) {
      const weightA = calculateWeight(a);
      const weightB = calculateWeight(b);
      return weightB - weightA;
    } else {
      const timeA = a.timestamp ? a.timestamp.toDate().getTime() : 0;
      const timeB = b.timestamp ? b.timestamp.toDate().getTime() : 0;
      return timeB - timeA;
    }
  });

  // Determine the appropriate empty state message
  const getEmptyStateMessage = () => {
    if (followingOnly) {
      if (followingLoading) {
        return 'Carregando...';
      }
      if (following.length === 0) {
        return 'Você ainda não está seguindo ninguém. Siga alguém para ver os uais!';
      }
      return 'Nenhum uai para os usuários que você está seguindo.';
    } else {
      return 'Não há uais para mostrar. Seja o primeiro a uaiar!';
    }
  };

  if (loading) {
    return (
      <Box className="uailist-container" display="flex" justifyContent="center" alignItems="center">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box className="uailist-container">
      {sortedUais.length === 0 ? (
        <Box className="empty-state">
          <Typography variant="h6" color="text.secondary">
            {getEmptyStateMessage()}
          </Typography>
        </Box>
      ) : (
        sortedUais.map(uai => (
          <Uai
            key={uai.id}
            uai={uai}
            handleLike={handleLike}
            handleReuai={handleReuai}
            handleComment={handleComment}
            currentUser={user}
          />
        ))
      )}

      {hasMore && (
        <Button onClick={fetchMoreUais} disabled={loading}>
          {loading ? 'Carregando...' : 'Carregar mais'}
        </Button>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default UaiList;
