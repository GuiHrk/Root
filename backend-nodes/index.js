require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const sequelize = require("./src/db");
const bodyParser = require("body-parser");
const userRoutes = require("./src/Routes/userRoutes");

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: "http://127.0.0.1:5500",
    methods: ["GET", "POST"],
  },
});

const messageRoutes = require("./src/Routes/messageRoutes")(io);

io.on("connection", (socket) => {
  console.log("🟢 Novo cliente conectado:", socket.id);
 
  socket.on("novaMensagem", (msg) => {
    console.log("Mensagem recebida:", msg);

    io.emit("mensagemRecebida", msg);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Cliente desconectado:", socket.id);
  });
});

//app.use(cors());
//app.use(bodyParser.json());
//app.use(express.json());

app.get("/", (req, res) => {
  res.send("O SERVIDOR ESTÁ ONLINE ");
});

app.use("/users", userRoutes);
app.use("/messages", messageRoutes);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
