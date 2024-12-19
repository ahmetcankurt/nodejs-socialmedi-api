const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { Post, io, User } = require("../index");
const verifyToken = require("./login").verifyToken;

// Multer ayarları
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads/posts'; 
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileName = 'image-' + uniqueSuffix + path.extname(file.originalname);
    cb(null, fileName);
  }
});

const upload = multer({ storage: storage });

// Post ekleme (POST)
router.post("/", verifyToken, upload.single("image"), async (req, res) => {
  const userId = req.user.userId;
  const { content } = req.body; // title kaldırıldı
  const image = req.file ? 'uploads/posts/' + req.file.filename : null;
  try {
    // Kullanıcı bilgilerini al
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı" });
    }

    // Post oluştur ve kullanıcı bilgilerini dönüş değerine ekle
    const post = await Post.create({ content, image, userId }); // title kaldırıldı
    const postData = post.toJSON();
    postData.user = {
      name: user.name,
      surname: user.surname,
      username: user.username,
      profileImage: user.profileImage
    };

    // Sokete postAdded olayı gönder
    io.emit("postAdded", postData);

    // Post verisini dön
    res.status(201).json(postData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Post güncelleme (PUT)
router.put("/:postId", verifyToken, upload.single("image"), async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body; // title kaldırıldı
  const image = req.file ? 'uploads/posts/' + req.file.filename : null;
  try {
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ error: "Post bulunamadı" });
    }
    if (post.userId !== req.user.userId) {
      return res.status(403).send("Bu postu güncelleme yetkiniz yok");
    }
    post.content = content; // title kaldırıldı
    if (image) {
      post.image = image;
    }
    await post.save();
    io.emit("postUpdated", post); 
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Post silme (DELETE)
router.delete("/:postId", verifyToken, async (req, res) => {
  const { postId } = req.params;
  try {
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ error: "Post bulunamadı" });
    }
    if (post.userId !== req.user.userId) {
      return res.status(403).send("Bu postu silme yetkiniz yok");
    }
    await post.destroy();
    io.emit("postDeleted", postId); 
    res.json({ message: "Post silindi" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Kullanıcının tüm postlarını ve profil bilgilerini getirme (GET)
router.get("/:userId/posts", async (req, res) => {
  const userId = req.params.userId;
  try {
    const userPosts = await Post.findAll({
      where: { userId: userId },
      include: {
        model: User,
        attributes: ['name', 'surname', 'username', 'profileImage']
      },
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json(userPosts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tüm postları getirme (GET)
router.get("/", async (req, res) => {
  try {
    const allPosts = await Post.findAll({
      include: {
        model: User,
        attributes: ['name', 'surname', 'username', 'profileImage']
      },
      order: [['createdAt', 'DESC']]
    });
    res.json(allPosts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
