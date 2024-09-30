// src/components/TweetList.js
import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { 
  collection, query, orderBy, onSnapshot, doc, updateDoc, 
  arrayUnion, arrayRemove, increment, where, getDoc 
} from 'firebase/firestore';
import { Box, Typography, CircularProgress, Snackbar, Alert } from '@mui/material';
import './TweetList.css';
import Tweet from './Tweet';

function TweetList({ followingOnly = false, sortByWeight = false }) {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user] = useState(auth.currentUser); // Get current user
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [following, setFollowing] = useState([]);
  const [followingLoading, setFollowingLoading] = useState(false); // Track following fetch

  // Fetch the list of users the current user is following
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchFollowing = async () => {
      setFollowingLoading(true);
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const followingList = userSnap.data().following || [];
          setFollowing(followingList);
        } else {
          setFollowing([]);
        }
      } catch (error) {
        console.error("Erro ao buscar seguindo:", error);
        setSnackbar({
          open: true,
          message: "Erro ao buscar seguindo.",
          severity: "error",
        });
        setFollowing([]);
      } finally {
        setFollowingLoading(false);
      }
    };

    fetchFollowing();
  }, [user]);

  // Fetch tweets based on the current view (global or following)
  useEffect(() => {
    const fetchTweets = async () => {
      if (!user) {
        setTweets([]);
        setLoading(false);
        return;
      }

      setLoading(true); // Start loading

      const tweetsRef = collection(db, "tweets");
      let qRef;

      try {
        if (followingOnly) {
          if (following.length === 0) {
            // User is not following anyone
            setTweets([]);
            setLoading(false);
            return;
          }

          // Firestore allows a maximum of 10 items in 'in'
          const batches = [];
          const batchSize = 10;
          for (let i = 0; i < following.length; i += batchSize) {
            const batch = query(
              tweetsRef,
              where("userId", "in", following.slice(i, i + batchSize)),
              orderBy("timestamp", "desc")
            );
            batches.push(batch);
          }

          const unsubscribeFunctions = batches.map(batchQuery => {
            const unsubscribe = onSnapshot(batchQuery, (querySnapshot) => {
              const tweetsData = [];
              querySnapshot.forEach((doc) => {
                const data = doc.data();
                // Ensure fields exist
                data.likedBy = data.likedBy || [];
                data.retweetedBy = data.retweetedBy || [];
                data.likes = data.likes || 0;
                data.retweets = data.retweets || 0;
                tweetsData.push({ id: doc.id, ...data });
              });
              setTweets(prevTweets => {
                const combined = [...prevTweets, ...tweetsData];
                // Remove duplicates
                const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
                return unique;
              });
            }, (error) => {
              console.error("Erro ao escutar tweets seguindo:", error);
              setSnackbar({
                open: true,
                message: "Erro ao escutar tweets seguindo.",
                severity: "error",
              });
            });
            return unsubscribe;
          });

          // Cleanup subscriptions on unmount or when dependencies change
          return () => {
            unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
          };
        } else {
          // Fetch all global tweets ordered by timestamp descending
          qRef = query(collection(db, "tweets"), orderBy("timestamp", "desc"));
          const unsubscribe = onSnapshot(qRef, (querySnapshot) => {
            const tweetsData = [];
            querySnapshot.forEach((doc) => {
              const data = doc.data();
              // Ensure fields exist
              data.likedBy = data.likedBy || [];
              data.retweetedBy = data.retweetedBy || [];
              data.likes = data.likes || 0;
              data.retweets = data.retweets || 0;
              tweetsData.push({ id: doc.id, ...data });
            });
            setTweets(tweetsData);
            setLoading(false);
          }, (error) => {
            console.error("Erro ao escutar tweets globais:", error);
            setSnackbar({
              open: true,
              message: "Erro ao escutar tweets globais.",
              severity: "error",
            });
            setLoading(false);
          });

          return () => unsubscribe();
        }
      } catch (error) {
        console.error("Erro ao buscar tweets:", error);
        setSnackbar({
          open: true,
          message: "Erro ao buscar tweets.",
          severity: "error",
        });
        setLoading(false);
      }
    };

    // Only fetch tweets when 'following' list is fetched if 'followingOnly' is true
    if (!followingLoading) {
      fetchTweets();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [followingOnly, following, user]);

  // Function to calculate the weight of a tweet
  const calculateWeight = (tweet) => {
    const likes = tweet.likes || 0;
    const retweets = tweet.retweets || 0;
    const now = new Date();
    const tweetDate = tweet.timestamp ? tweet.timestamp.toDate() : now;
    const diffInHours = Math.abs(now - tweetDate) / 36e5; // Difference in hours

    // Decay: each hour reduces the weight by 0.1
    const decay = diffInHours * 0.1;

    // Bonus if the author is followed
    const isAuthorFollowed = following.includes(tweet.userId) ? 5 : 0;

    // Weight: Likes * 2 + Retweets * 1.5 + Bonus - Decay
    const weight = (likes * 2) + (retweets * 1.5) + isAuthorFollowed - decay;

    return weight;
  };

  // Sort tweets based on weight or timestamp
  const sortedTweets = [...tweets].sort((a, b) => {
    if (sortByWeight) {
      const weightA = calculateWeight(a);
      const weightB = calculateWeight(b);
      return weightB - weightA;
    } else {
      // Sort by timestamp descending
      const timeA = a.timestamp ? a.timestamp.toDate().getTime() : 0;
      const timeB = b.timestamp ? b.timestamp.toDate().getTime() : 0;
      return timeB - timeA;
    }
  });

  // Handle like functionality
  const handleLike = async (tweet) => {
    if (!user) {
      setSnackbar({
        open: true,
        message: "Você precisa estar logado para dar like.",
        severity: "warning",
      });
      return;
    }

    const tweetRef = doc(db, "tweets", tweet.id);
    const hasLiked = tweet.likedBy.includes(user.uid);

    try {
      if (hasLiked) {
        await updateDoc(tweetRef, {
          likes: increment(-1),
          likedBy: arrayRemove(user.uid)
        });
        setSnackbar({
          open: true,
          message: "Like removido!",
          severity: "info",
        });
      } else {
        await updateDoc(tweetRef, {
          likes: increment(1),
          likedBy: arrayUnion(user.uid)
        });
        setSnackbar({
          open: true,
          message: "Like adicionado!",
          severity: "success",
        });
      }
    } catch (error) {
      console.error("Erro ao dar like:", error);
      setSnackbar({
        open: true,
        message: "Erro ao dar like.",
        severity: "error",
      });
    }
  };

  // Handle retweet functionality
  const handleRetweet = async (tweet) => {
    if (!user) {
      setSnackbar({
        open: true,
        message: "Você precisa estar logado para retweetar.",
        severity: "warning",
      });
      return;
    }

    const tweetRef = doc(db, "tweets", tweet.id);
    const hasRetweeted = tweet.retweetedBy.includes(user.uid);

    try {
      if (hasRetweeted) {
        await updateDoc(tweetRef, {
          retweets: increment(-1),
          retweetedBy: arrayRemove(user.uid)
        });
        setSnackbar({
          open: true,
          message: "Retweet removido!",
          severity: "info",
        });
      } else {
        await updateDoc(tweetRef, {
          retweets: increment(1),
          retweetedBy: arrayUnion(user.uid)
        });
        setSnackbar({
          open: true,
          message: "Retweet adicionado!",
          severity: "success",
        });
      }
    } catch (error) {
      console.error("Erro ao retweetar:", error);
      setSnackbar({
        open: true,
        message: "Erro ao retweetar.",
        severity: "error",
      });
    }
  };

  // Close the snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Determine the appropriate empty state message
  const getEmptyStateMessage = () => {
    if (followingOnly) {
      if (followingLoading) {
        return "Carregando...";
      }
      if (following.length === 0) {
        return "Você ainda não está seguindo ninguém. Siga alguém para ver os tweets!";
      }
      return "Nenhum tweet para os usuários que você está seguindo.";
    } else {
      return "Não há tweets para mostrar. Seja o primeiro a tweetar!";
    }
  };

  if (loading) {
    return (
      <Box className="tweetlist-container" display="flex" justifyContent="center" alignItems="center">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box className="tweetlist-container">
      {sortedTweets.length === 0 ? (
        <Box className="empty-state">
          <Typography variant="h6" color="text.secondary">
            {getEmptyStateMessage()}
          </Typography>
        </Box>
      ) : (
        sortedTweets.map(tweet => (
          <Tweet 
            key={tweet.id} 
            tweet={tweet} 
            handleLike={handleLike} 
            handleRetweet={handleRetweet} 
          />
        ))
      )}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default TweetList;
