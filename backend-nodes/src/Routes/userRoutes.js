const express = require("express");
const router = express.Router();
const sequelize = require("../db");
const { QueryTypes } = require("sequelize");



router.post("/register",async (req, res) => {
    console.log(">>> /users/register RECEIVED at", new Date().toISOString());
    console.log("Body:", req.body);

    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        console.log(">>> /users/register missing fields");
        return res.status(400).json({ error: "preencha todos os campos"});
    }

    try {
        console.log(">>> /users/register: about to INSERT");
        await sequelize.query(
            "INSERT INTO usuarios (nome, email, senha ) VALUES (?, ?, ?)",
            {
            replacements: [nome, email, senha],
            type: QueryTypes.INSERT,
            }
        );

        console.log(">>> users/register: INSERT done");
    
        res.status(201).json({ message: "Usuário cadastrado com sucesso!"});
    }catch (err){
        console.error("erro ao cadastrar usuário:", err);
        res.status(500).json({ error: "Erro no servidor" });
    }

});

router.post("/login", async (req, res) => {
    const { email, senha } = req.body;
  
    console.log("📩 Requisição de login recebida:", { email, senha });
  
    if (!email || !senha) {
      return res.status(400).json({ error: "Preencha todos os campos" });
    }
  
    try {
      const users = await sequelize.query(
        "SELECT * FROM usuarios WHERE email = ? AND senha = ?",
        {
          replacements: [email, senha],
          type: QueryTypes.SELECT,
        }
      );
  
      console.log("🔍 Resultado da busca no banco:", users);
  
      if (!users || users.length === 0) {
        console.log("🚫 Nenhum usuário encontrado");
        return res.status(401).json({ error: "Credenciais inválidas" });
      }
  
      console.log("✅ Login bem-sucedido:", users[0]);
      return res.json({
        message: "Login realizado com sucesso",
        user: users[0],
      });
    } catch (err) {
      console.error("💥 Erro no login:", err);
      return res.status(500).json({
        error: "Erro no servidor",
        detalhes: err.message,
      });
    }
});

module.exports = router;