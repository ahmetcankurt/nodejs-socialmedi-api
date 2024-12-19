const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { User, io } = require("../index");
const verifyToken = require("./login").verifyToken;

// Multer ayarları
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads/users";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileName = "profileImage-" + uniqueSuffix + path.extname(file.originalname);
    cb(null, fileName);
  },
});
const upload = multer({ storage: storage });


router.post('/', upload.single('profileImage'), async (req, res) => {
  const { name, surname, username, email, phone, weburl, coverImage, password } = req.body;
  const profileImage = req.file ? 'uploads/users/' + req.file.filename : null;
  
  try {
    // Şifreyi hash'le

    const user = await User.create({
      name,
      surname,
      username,
      email,
      password,
      phone,
      weburl,
      coverImage,
      profileImage,
    });

    io.emit('userAdded', user);
    res.status(201).json(user);
  } catch (error) {
    console.error('Kullanıcı oluşturulurken hata:', error);
    res.status(500).json({ error: 'Sunucu hatası, lütfen daha sonra tekrar deneyin.' });
  }
});


// Tüm kullanıcıları listeleme
router.get("/", async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).send("Sunucu hatası");
  }
});

// Belirli bir kullanıcıyı görüntüleme
router.get("/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findByPk(userId);
    if (user) {
      res.json(user);
    } else {
      res.status(404).send("Kullanıcı bulunamadı");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Sunucu hatası");
  }
});

// Kullanıcı silme
router.delete("/:userId", verifyToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    if (req.user.userId !== parseInt(userId, 10)) {
      return res.status(403).send("Yetkisiz erişim");
    }
    const result = await User.destroy({ where: { userId: userId } });
    if (result) {
      io.emit("userDeleted", { userId });
      res.send("Kullanıcı silindi");
    } else {
      res.status(404).send("Kullanıcı bulunamadı");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Sunucu hatası");
  }
});

// Kullanıcı güncelleme
router.put("/:userId", verifyToken, upload.single("profileImage"), async (req, res) => {
  const { name, surname, username, email, phone, weburl, coverImage } = req.body;
  let profileImage = req.file ? "uploads/users/" + req.file.filename : null;
  const userId = req.params.userId;

  try {
    if (req.user.userId !== parseInt(userId, 10)) {
      return res.status(403).send("Yetkisiz erişim");
    }

    let user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).send("Kullanıcı bulunamadı");
    }

    // Kullanıcıyı güncelle
    user = await user.update({
      name,
      surname,
      username,
      email,
      phone,
      weburl,
      coverImage,
    });

    // Eğer yeni bir profil resmi yüklenmişse, eski resmi sil ve yeni resmi ata
    if (req.file) {
      if (user.profileImage) {
        const oldImagePath = path.join(__dirname, "..", user.profileImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      // Yeni resmi ata
      await user.update({ profileImage });
    }

    io.emit("userUpdated", user);
    res.json(user);
  } catch (error) {
    console.error("Kullanıcı güncellenirken hata:", error);
    res.status(500).json({ error: "Sunucu hatası, lütfen daha sonra tekrar deneyin." });
  }
});

module.exports = router;