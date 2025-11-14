import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import admin from "firebase-admin";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
    databaseURL: "https://rootchat-4a986-default-rtdb.firebaseio.com"
});

const db = admin.database();

app.get("/", (req, res) => {
    res.send("Firebase ok!");
});

app.post("/messages/send", async (req, res) => {
    const{ user, text } = req.body;
    if (!user || !text) return res.status(400).json({ error: "CAMPOS OBRIGATÓRIOS"});

try {
    await db.ref("messages").push({user, text, timestamp: Date.now()});
    res.json({success: true});
}catch (err) {
    console.error(err);
    res.status(500).json({error: "erro ao enviar mensagem"});
}
});

app.get("/messages", async (req, res) => {
    try {
        const snapshot = await db.ref("messages").once("value");
        const messages = snapshot.val() || {};
        res.json(messages);
    } catch (err) {
        res.status(500).json({error: "erro ao buscar mensagens"});
    }
});

const PORT = process.env.PORT || 3000;
app.listen(3000, () => console.log(`Backend rodando na porta ${PORT}`));
