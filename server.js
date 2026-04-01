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
