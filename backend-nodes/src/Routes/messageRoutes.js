const express = require("express");
const router = express.Router();
const { sequelize }= require("../db");
const { QueryTypes } = require("sequelize");

router.post("/send",async (req, res) => {
    const { remetente_id, conteudo } = req.body;

    if (!remetente_id || !conteudo) {
        return res.status(400).json({ error:"Preencha todos os campos"});
    }

    try {
        await sequelize.query(
            "INSERT INTO MENSAGENS (rementente_id, conteudo, hora_envio) Values (?,?,NOW())",
            {
                replacements: [remetente_id,conteudo],
                type: QueryTypes.INSERT,
            }
        );
        res.status(201).json({message: "Mensagem enviada com sucesso!"});
    } catch (err) {
        console.error("erro ao enviar mensagem:", err);
        res.status(500).json({error:"erro no servidor"});
    }
});

router.get("/", async (req, res) => {
    try {
        const mensagens = await sequelize.query(
            "SELECT * FROM MENSAGENS ORDER BY hora_envio Desc",
            {
                type: QueryTypes.SELECT,
            }
        );
        res.json(mensagens);
    } catch (err) {
        console.error("Erro ao listar mensagens:", err);
        res.status(500).json({error: "Erro no servidor" });
    }
});

module.exports = router;