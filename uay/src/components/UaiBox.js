// src/components/UaiBox.js
import React, { useState, useEffect } from 'react';
import { Button, Box, Avatar, IconButton } from '@mui/material';
import { Typography } from '@mui/material';
import { db, auth, storage } from '../firebase';
import { collection, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useAuthState } from 'react-firebase-hooks/auth';
import './UaiBox.css';
import UploadIcon from '@mui/icons-material/Upload';

function UaiBox() {
  const [uaiContent, setUaiContent] = useState('');
  const [user] = useAuthState(auth);
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState({});
  const [fileUrls, setFileUrls] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(0);

  useEffect(() => {
    const fetchUsername = async () => {
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
    fetchUsername();
  }, [user]);

  const sendUai = async (e) => {
    e.preventDefault();

    if (uploadingFiles > 0) {
      alert('Por favor, aguarde o upload dos arquivos antes de enviar o uai.');
      return;
    }

    if (uaiContent.trim() === '' && fileUrls.length === 0) {
      alert("O conteúdo do uai está vazio e nenhum arquivo foi carregado.");
      return;
    }

    try {
      await addDoc(collection(db, "uais"), {
        content: uaiContent,
        user: username,
        userAvatar: avatarUrl,
        userId: user.uid,
        timestamp: serverTimestamp(),
        fileUrls: fileUrls,
        likes: 0,
        reuais: 0,
        likedBy: [],
        reuaiedBy: [],
        comments: []
      });
      setUaiContent('');
      setFileUrls([]);
      setUploadProgress({});
    } catch (error) {
      console.error("Erro ao enviar uai:", error);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = selectedFiles.filter(file => file.size <= 50 * 1024 * 1024);

    if (validFiles.length !== selectedFiles.length) {
      alert('Alguns arquivos excedem o limite de 50MB e não serão carregados.');
    }

    if (validFiles.length + fileUrls.length > 4) {
      alert('Você pode enviar no máximo 4 arquivos por uai.');
      return;
    }

    validFiles.forEach(file => {
      uploadFile(file);
    });
  };

  const uploadFile = (file) => {
    const storageRef = ref(storage, `uploads/${user.uid}/${Date.now()}-${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    setUploadingFiles(prev => prev + 1);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
      },
      (error) => {
        console.error('Erro no upload do arquivo:', error);
        alert('Erro ao carregar o arquivo. Por favor, tente novamente.');
        setUploadingFiles(prev => prev - 1);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setFileUrls((prevUrls) => [...prevUrls, downloadURL]);
        setUploadingFiles(prev => prev - 1);
      }
    );
  };

  return (
    <Box component="form" onSubmit={sendUai} className="uaibox-container">
      <Avatar src={avatarUrl} alt={username} className="uaibox-avatar" />
      <Box className="uaibox-content">
        <textarea
          className="uaibox-textfield"
          placeholder="O que está acontecendo?"
          value={uaiContent}
          onChange={(e) => setUaiContent(e.target.value)}
        />
        <Box className="uaibox-actions">
          <IconButton component="label">
            <UploadIcon />
            <input type="file" hidden onChange={handleFileChange} accept="image/*,video/*" multiple />
          </IconButton>

          {Object.keys(uploadProgress).map((fileName) => (
            <Typography key={fileName} variant="body2" color="text.secondary">
              {fileName} - {Math.round(uploadProgress[fileName])}% carregado
            </Typography>
          ))}

          {fileUrls.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              {fileUrls.length} arquivo(s) carregado(s) com sucesso.
            </Typography>
          )}

          <Button
            type="submit"
            className="uaibox-button"
            disabled={!username || (!uaiContent && fileUrls.length === 0) || uploadingFiles > 0}
          >
            Uaiar
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default UaiBox;
