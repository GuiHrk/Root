const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    port: process.env.DB_PORT,
    logging: false, // Marcação: função para evitar poluir o terminal
  }
);

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexão bem-sucedida com o banco MySQL Railway!");
  } catch (error) {
    console.error("❌ Erro ao conectar no banco:", error);
  }
})();

module.exports = sequelize;
