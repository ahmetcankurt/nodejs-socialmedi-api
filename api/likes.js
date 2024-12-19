const express = require('express');
const router = express.Router();
const { Like, Post, User } = require('../index');
const { verifyToken } = require('./auth');

// Beğeniyi Ekle
router.post('/', verifyToken, async (req, res) => {
  const { userId: tokenUserId } = req.user; // Token'dan gelen kullanıcı ID'si
  const { postId } = req.body; // İstekten gelen post ID'si

  try {
    const [like, created] = await Like.findOrCreate({ where: { userId: tokenUserId, postId } });
    if (!created) {
      await like.destroy(); // Zaten beğenilmişse beğeniyi kaldır
      return res.status(200).json({ message: 'Like removed' });
    }
    res.status(201).json(like);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Kullanıcının Beğendiği Postları Getir
router.get('/:userId', verifyToken, async (req, res) => {
  const userId = req.params.userId;
  try {
    const likes = await Like.findAll({ where: { userId }, include: [Post] });
    res.status(200).json(likes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bir Postu Beğenen Kullanıcıları Getir
router.get('/post/:postId', async (req, res) => {
  const postId = req.params.postId;
  try {
    const likes = await Like.findAll({ where: { postId }, include: [User] });
    res.status(200).json(likes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }

});

module.exports = router;
