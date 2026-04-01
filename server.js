const fetch = require("node-fetch"); // これがないと fetch が使えません

// Dify APIを呼んでAIの返答を取得する関数
async function getAIReply(message) {
  const response = await fetch("https://api.dify.ai/v1/chat-messages", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.DIFY_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ prompt: message })
  });

  const data = await response.json();
  return data.output || "AIの返事取得失敗";
}
app.post("/webhook", async (req, res) => {
  try {
    const event = req.body.events?.[0];
    if (!event) return res.sendStatus(200);

    const userMessage = event.message.text;
    const userId = event.source.userId;

    // ⚠️ AIに返事を生成させる部分
    const aiReply = await getAIReply(userMessage); // Dify APIを呼ぶ関数

    // LINEに返答
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
    console.error(err);
    res.sendStatus(500);
  }
});
