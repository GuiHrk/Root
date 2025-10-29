const { Sequelize } = require("sequelize");
const fs = require("fs");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    port: process.env.DB_PORT,
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: true, 
        ca: fs.readFileSync(process.env.DB_SSL_CA), // caminho definido no Render
      },
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexão bem-sucedida com o banco MySQL Aiven!");
  } catch (error) {
    console.error("❌ Erro ao conectar no banco:", error);
    console.log("Tentando reconectar em 5 segundos...");
    setTimeout(connectDB, 5000);
  }
}

connectDB();
module.exports = sequelize;