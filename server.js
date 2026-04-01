// server.js 完全版
const express = require("express");
const axios = require("axios");
const app = express();

app.use(express.json());

// 環境変数
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const DIFY_API_KEY = process.env.DIFY_API_KEY;

// LINEからのWebhook
app.post("/webhook", async (req, res) => {
  try {
    const event = req.body.events?.[0];
    if (!event || event.type !== "message") return res.sendStatus(200);

    const userMessage = event.message.text;
    const userId = event.source.userId;

    // ① Dify AIに投げて返信取得
    const aiReply = await getAIReply(userMessage);

    // ② Supabaseに保存
    await saveToSupabase(userId, userMessage, aiReply);

    // ③ LINEに返答
    await replyToLINE(event.replyToken, aiReply);

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// サンプル関数: Dify APIに問い合わせ
async function getAIReply(message) {
  const res = await axios.post(
    "https://api.soft.ai/v1/chat/completions",
    {
      model: "gpt-5.4",
      messages: [{ role: "user", content: message }]
    },
    { headers: { "Authorization": `Bearer ${DIFY_API_KEY}` } }
  );
  return res.data.choices?.[0]?.message?.content || "ごめんなさい、わかりません";
}

// Supabaseに保存
async function saveToSupabase(userId, userMessage, aiReply) {
  await axios.post(
    `${SUPABASE_URL}/rest/v1/users`,
    { user_id: userId, message: userMessage, ai_reply: aiReply },
    { headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json", Prefer: "return=representation" } }
  );
}

// LINEに返信
async function replyToLINE(replyToken, message) {
  const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  await axios.post(
    "https://api.line.me/v2/bot/message/reply",
    { replyToken, messages: [{ type: "text", text: message }] },
    { headers: { Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`, "Content-Type": "application/json" } }
  );
}

// 起動
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server started on port " + PORT));
