const express = require("express");
const router = express.Router();
const { Comment, User, io } = require("../index");

// Yorum ekleme
router.post("/:postId", async (req, res) => {
  const { content, userId, postId } = req.body; // postId'yi al
  try {
    const comment = await Comment.create({ content, userId, postId });
    const user = await User.findByPk(userId, { attributes: ['name', 'surname', 'username', 'profileImage'] });
    const commentWithUserInfo = {
      commentId: comment.commentId,
      content: comment.content,
      userId: comment.userId,
      postId: comment.postId,
      user: {
        name: user.name,
        surname: user.surname,
        username: user.username,
        profileImage: user.profileImage
      }
    };
    io.emit("commentAdded", commentWithUserInfo); // Yorum eklenmesi olayını tüm istemcilere yayınla
    res.status(201).json(commentWithUserInfo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});


// Yorumları getirme (GET)
router.get("/:postId", async (req, res) => {
  const { postId } = req.params;
  try {
    const comments = await Comment.findAll({
      where: { postId },
      include: [{ model: User, attributes: ['name', 'surname', 'username', 'profileImage'] }]
    });
    res.status(200).json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Yorum güncelleme (PUT)
router.put("/:commentId", async (req, res) => {
  const { commentId } = req.params;
  const { content, postId } = req.body; // postId'yi al
  try {
    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }
    // Eğer güncellenen yorumun postId'si ile güncelleme isteğinde gelen postId eşleşmiyorsa hata dön
    if (comment.postId !== postId) {
      return res.status(400).json({ error: "Invalid postId" });
    }
    comment.content = content;
    await comment.save();
    const updatedComment = {
      commentId: comment.commentId,
      content: comment.content,
      userId: comment.userId,
      postId: comment.postId,
      user: await User.findByPk(comment.userId, { attributes: ['name', 'surname', 'username', 'profileImage'] })
    };
    io.emit("commentUpdated", updatedComment); // Güncelleme bildirimi
    res.json(updatedComment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});


// Yorum silme (DELETE)
router.delete("/:commentId", async (req, res) => {
  const { commentId } = req.params;
  const { postId } = req.body; // postId'yi al
  try {
    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }
    // Eğer silinen yorumun postId'si ile silme isteğinde gelen postId eşleşmiyorsa hata dön
    if (comment.postId !== postId) {
      return res.status(400).json({ error: "Invalid postId" });
    }
    await comment.destroy();
    io.emit("commentDeleted", commentId); // Silme bildirimi
    res.json({ message: "Comment deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});



module.exports = router;