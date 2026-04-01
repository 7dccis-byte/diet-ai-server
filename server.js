// server.js
import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

app.post("/webhook", async (req, res) => {
  try {
    const events = req.body.events || [];
    for (const event of events) {
      if (event.type === "message" && event.message.type === "text") {
        const userMessage = event.message.text;
        const replyText = await getAIReply(userMessage);

        // ここでLINEに返す（LINE Messaging API）
        await replyToLine(event.replyToken, replyText);
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook処理エラー:", err);
    res.sendStatus(500);
  }
});

// Dify Chat APIに問い合わせ
async function getAIReply(message) {
  try {
    const response = await fetch("https://api.dify.ai/v1/chat-messages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.DIFY_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", // Difyで利用するモデル
        messages: [
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();
    console.log("Dify APIレスポンス:", data);

    // 返答を取り出す
    return data.output?.[0]?.content || "AIの返事取得失敗";
  } catch (err) {
    console.error("Dify APIエラー:", err);
    return "AI返答に失敗しました";
  }
}

// LINEに返答する関数
async function replyToLine(replyToken, text) {
  try {
    await fetch("https://api.line.me/v2/bot/message/reply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        replyToken: replyToken,
        messages: [{ type: "text", text: text }]
      })
    });
  } catch (err) {
    console.error("LINE返信エラー:", err);
  }
}

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
