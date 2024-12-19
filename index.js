const express = require("express");
const bodyParser = require("body-parser");
const Sequelize = require("sequelize");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware to inject io into the request object
app.use((req, next) => {
  req.io = io;
  next();
});

app.use(
  cors({
    origin: "http://localhost:3001",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const sequelize = new Sequelize(
  process.env.DB_NAME || "myprofile",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    port: process.env.DB_PORT || 3306,
  }
);


const User = sequelize.define("user", {
  userId: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  name: Sequelize.STRING,
  surname: Sequelize.STRING,
  username: Sequelize.STRING,
  password: Sequelize.STRING,
  email: Sequelize.STRING,
  phone: Sequelize.STRING,
  weburl: Sequelize.STRING,
  coverImage: Sequelize.STRING,
  profileImage: Sequelize.STRING,
});

const Post = sequelize.define("post", {
  postId: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  title: Sequelize.STRING,
  content: Sequelize.STRING,
  image: Sequelize.STRING,
  userId: Sequelize.INTEGER,
});

const Comment = sequelize.define("comment", {
  commentId: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  content: Sequelize.STRING,
  userId: Sequelize.INTEGER,
  postId: Sequelize.INTEGER,
});

const Like = sequelize.define("like", {
  likeId: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  postId: Sequelize.INTEGER,
  userId: Sequelize.INTEGER,
});

// Define relationships
Post.belongsTo(User, { foreignKey: "userId" });
User.hasMany(Post, { foreignKey: "userId" });

Comment.belongsTo(User, { foreignKey: "userId" });
User.hasMany(Comment, { foreignKey: "userId" });

Comment.belongsTo(Post, { foreignKey: "postId" });
Post.hasMany(Comment, { foreignKey: "postId" });

Like.belongsTo(User, { foreignKey: "userId" });
User.hasMany(Like, { foreignKey: "userId" });

Like.belongsTo(Post, { foreignKey: "postId" });
Post.hasMany(Like, { foreignKey: "postId" });

module.exports = { User, Post, Comment, Like, sequelize, io }; // Modelleri dışarı aktar

const usersRouter = require("./api/users");
const likesRouter = require("./api/likes");
const commentsRouter = require("./api/comments");
const postsRouter = require("./api/posts");
const verifyTokenRouter = require("./api/verifyToken");
const { router: loginRouter } = require("./api/login");

app.use("/users", usersRouter);
app.use("/likes", likesRouter);
app.use("/comments", commentsRouter);
app.use("/posts", postsRouter);
app.use("/login", loginRouter);
app.use("/api", verifyTokenRouter);

sequelize.sync().then(() => {
  const PORT = process.env.PORT || 3000;
  http.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
