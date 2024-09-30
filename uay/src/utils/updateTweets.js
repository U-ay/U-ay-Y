// src/utils/updateTweets.js
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

const updateExistingTweets = async () => {
  const tweetsCollection = collection(db, 'tweets');
  const tweetsSnapshot = await getDocs(tweetsCollection);

  const updatePromises = tweetsSnapshot.docs.map(async (tweetDoc) => {
    const tweetData = tweetDoc.data();
    const tweetRef = doc(db, 'tweets', tweetDoc.id);

    // Verificar e adicionar likedBy se não existir
    if (!tweetData.likedBy) {
      await updateDoc(tweetRef, { likedBy: [] });
    }

    // Verificar e adicionar retweetedBy se não existir
    if (!tweetData.retweetedBy) {
      await updateDoc(tweetRef, { retweetedBy: [] });
    }

    // Opcional: Inicializar likes e retweets se não existirem
    if (tweetData.likes === undefined) {
      await updateDoc(tweetRef, { likes: 0 });
    }

    if (tweetData.retweets === undefined) {
      await updateDoc(tweetRef, { retweets: 0 });
    }
  });

  await Promise.all(updatePromises);
  console.log("Todos os tweets foram atualizados.");
};

// Execute a função (pode ser chamado de alguma forma, como um botão administrativo)
updateExistingTweets();
