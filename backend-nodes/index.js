require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { Sequelize } = require("sequelize");
const bodyParser = require("body-parser");
const userRoutes = require("./src/Routes/userRoutes");
//const userRoutes = require("./src/Routes/messageRoutes");


console.log("Variáveis carregadas:", {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  pass: process.env.DB_PASSWORD,
  db: process.env.DB_NAME,
  port: process.env.DB_PORT
});

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    port: process.env.DB_PORT,
  }
);

sequelize
  .authenticate()
  .then(() => console.log("✅ Conectado ao MySQL Railway"))
  .catch((err) => console.error("❌ Falha ao conectar", err));

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://127.0.0.1:5500",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("O SERVIDOR ESTÁ ONLINE ");
});

app.use("/users", userRoutes);
//app.use("/messages", messageRoutes);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
