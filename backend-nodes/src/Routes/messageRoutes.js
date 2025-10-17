const express = require("express");
const router = express.Router();
const sequelize = require("../db");
const { QueryTypes } = require("sequelize");



module.exports = (io) =>{

router.post("/send",async (req, res) => {
    const { userId, content } = req.body;

    if (!userId || !content) {
        return res.status(400).json({ error:"Preencha todos os campos"});
    }

    try {
        await sequelize.query(
            "INSERT INTO mensagens (userId, content) Values (?,?)",
            {
                replacements: [userId,content],
                type: QueryTypes.INSERT,
            }
        );
        const [ultimaMensagem] = await sequelize.query(
            `
            SELECT m.id, m.content, m.createdAt, u.nome AS remetente
            FROM mensagens m
            JOIN usuarios u ON m.userId = u.id
            ORDER BY m.id DESC
            LIMIT 1
            `,
            { type: QueryTypes.SELECT }
          );
     
          io.emit("novaMensagem", ultimaMensagem);


        res.status(201).json({message: "Mensagem enviada com sucesso!"});
    } catch (err) {
        console.error("erro ao enviar mensagem:", err);
        res.status(500).json({error:"erro no ao enviar a mensagem"});
    }
});

router.get("/all", async (req, res) => {
    try {
        const mensagens = await sequelize.query(
            `
            SELECT m.id, u.nome AS remetente, m.content, m.createdAt
            FROM mensagens m
            JOIN usuarios u ON m.userId = u.id
            ORDER BY m.createdAt ASC
            `,
            { type: QueryTypes.SELECT }
          );
        
          res.json(mensagens);
    } catch (err) {
        console.error("Erro ao listar mensagens:", err);
        res.status(500).json({error: "Erro ao buscar a mensagem" });
    }
});

return router;
};

