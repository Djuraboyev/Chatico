const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { Server } = require("socket.io");
const http = require("http");

// Загрузка переменных окружения
dotenv.config();

// Инициализация приложения и сервера
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(express.json());
app.use(cors());

// Корневой маршрут
app.get("/", (req, res) => {
  res.send("Chatico API работает! 🚀");
});

// Подключение к MongoDB
const mongoURI = process.env.MONGO_URL || "mongodb://localhost:27017/chatico";
mongoose
  .connect(mongoURI)
  .then(() => console.log("✅ MongoDB подключен"))
  .catch((err) => {
    console.error("❌ Ошибка MongoDB:", err);
    process.exit(1);
  });

// ====== Модели MongoDB ======
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const User = mongoose.model("User", userSchema);

const chatSchema = new mongoose.Schema({
  name: String,
  message: String,
  time: { type: Date, default: Date.now },
  avatar: String,
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  room: { type: String, required: true },
});
const Chat = mongoose.model("Chat", chatSchema);

// Middleware проверки токена
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(403).json({ error: "❌ Доступ запрещен" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: "❌ Неверный токен" });
  }
};

// ====== Аутентификация ======
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "❌ Все поля обязательны" });

    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ error: "❌ Пользователь уже существует" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.json({ message: "✅ Пользователь зарегистрирован" });
  } catch (error) {
    res.status(500).json({ error: "❌ Ошибка при регистрации" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "❌ Неверный логин или пароль" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "24h" });
    res.json({ message: "✅ Вход выполнен", token });
  } catch (error) {
    res.status(500).json({ error: "❌ Ошибка при входе" });
  }
});

// ====== API Чатов ======
app.get("/api/chats", authenticate, async (req, res) => {
  try {
    const chats = await Chat.find();
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: "Ошибка при загрузке чатов" });
  }
});

app.get("/api/chats/:room", authenticate, async (req, res) => {
  try {
    const { room } = req.params;
    const chats = await Chat.find({ room });
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: "Ошибка при загрузке чатов" });
  }
});

app.post("/api/chats", authenticate, async (req, res) => {
  try {
    const { name, message, avatar, room } = req.body;
    if (!name || !message || !room) return res.status(400).json({ error: "❌ Все поля обязательны" });

    const newChat = new Chat({ name, message, avatar, room, senderId: req.user.userId });
    await newChat.save();
    io.to(room).emit("newMessage", newChat);
    res.json({ message: "Чат добавлен", chat: newChat });
  } catch (error) {
    res.status(500).json({ error: "Ошибка при добавлении чата" });
  }
});

// ====== WebSocket ======
io.on("connection", (socket) => {
  console.log("🟢 Новый клиент подключился:", socket.id);

  socket.on("joinRoom", (room) => {
    socket.join(room);
    console.log(`Клиент ${socket.id} присоединился к комнате: ${room}`);
  });

  socket.on("sendMessage", async (data) => {
    try {
      const newChat = new Chat(data);
      await newChat.save();
      io.to(data.room).emit("newMessage", newChat);
    } catch (error) {
      console.error("❌ Ошибка при отправке сообщения:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 Клиент отключился:", socket.id);
  });
});

// ====== Запуск сервера ======
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Сервер запущен на http://localhost:${PORT}`));

