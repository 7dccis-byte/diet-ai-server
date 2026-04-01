// server.js
const express = require("express");
const app = express();
app.use(express.json());

// CommonJS対応 fetch
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Dify APIを呼んでAIの返答を取得する関数
async function getAIReply(message) {
  try {
    const response = await fetch("https://api.dify.ai/v1/chat-messages", { // ← ここは自分のDifyエンドポイントに置き換え
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.DIFY_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt: message })
    });

    const data = await response.json();
    console.log("dify APIレスポンス:", data);
    return data.output || "AIの返事取得失敗";
  } catch (err) {
    console.error("Dify APIエラー:", err);
    return "AI返答に失敗しました";
  }
}

// LINE Webhook受信
app.post("/webhook", async (req, res) => {
  try {
    const event = req.body.events?.[0];
    if (!event) return res.sendStatus(200);

    const userMessage = event.message.text;
    const aiReply = await getAIReply(userMessage);

    const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    await fetch("https://api.line.me/v2/bot/message/reply", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        replyToken: event.replyToken,
        messages: [{ type: "text", text: aiReply }]
      })
    });

    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook処理エラー:", err);
    res.sendStatus(500);
  }
});

// サーバー起動
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
