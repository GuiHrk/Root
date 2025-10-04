const express = require("express");
const router = express.Router();
const sequelize = require("../db");

router.post("/send",async (req, res) => {
    const { remetente_id, conteudo } = req.body;

    if (!remetente_id || !conteudo) {
        return res.status(400).json({ error:"Preencha todos os campos"});
    }

    try {
        await sequelize.query(
            "INSERT INTO MENSAGENS (remetente_id, conteudo) Values (?,?)",
            {
                replacements: [remetente_id,conteudo],
            }
        );
        res.status(201).json({message: "Mensagem enviada com sucesso!"});
    } catch (err) {
        console.error("erro ao enviar mensagem:", err);
        res.status(500).json({error:"erro no ao enviar a mensagem"});
    }
});

router.get("/all", async (req, res) => {
    try {
        const mensagens = await sequelize.query(`
            SELECT m.id, u.nome AS remetente, m.conteudo, m.hora_envio
            FROM MENSAGENS m
            JOIN USUARIOS u ON m.remetente_id = u.id
            ORDER BY m.hora_envio DESC 
        `);
        res.json(mensagens);
    } catch (err) {
        console.error("Erro ao listar mensagens:", err);
        res.status(500).json({error: "Erro ao buscar a mensagem" });
    }
});

module.exports = router;