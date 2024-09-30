import React, { useState } from 'react';
import { storage, db, auth } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateDoc, doc } from 'firebase/firestore';
import { Button, Input } from '@mui/material';

function AvatarUploader() {
  const [avatarFile, setAvatarFile] = useState(null);

  const handleFileChange = (event) => {
    if (event.target.files[0]) {
      setAvatarFile(event.target.files[0]);
    }
  };

  const handleAvatarUpload = async () => {
    const user = auth.currentUser;
    if (!avatarFile || !user) return;

    const storageRef = ref(storage, `avatars/${user.uid}`);
    try {
      // Upload the file to Firebase Storage
      await uploadBytes(storageRef, avatarFile);

      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);

      // Update the user's Firestore profile with the new avatar URL
      await updateDoc(doc(db, 'users', user.uid), { photoURL: downloadURL });

      alert("Avatar atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao fazer upload do avatar:", error);
      alert("Falha ao atualizar o avatar.");
    }
  };

  return (
    <div>
      <Input type="file" onChange={handleFileChange} inputProps={{ accept: 'image/*' }} />
      {avatarFile && (
        <Button variant="contained" color="primary" onClick={handleAvatarUpload}>
          Atualizar Avatar
        </Button>
      )}
    </div>
  );
}

export default AvatarUploader;
