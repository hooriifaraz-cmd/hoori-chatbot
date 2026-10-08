exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const { messages } = JSON.parse(event.body || "{}");

    let contents = (messages || []).slice(-12).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: String(m.content || "") }]
    }));
    while (contents.length && contents[0].role !== "user") contents.shift();

    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text:
                  "You are Hoori, the friendly assistant of Hoori Chatbot. Answer any question the user asks, clearly and correctly. Reply in the same language the user writes in. Keep replies short, kind and easy to read."
              }
            ]
          },
          contents
        })
      }
    );

    const data = await res.json();
    const parts =
      data.candidates && data.candidates[0] && data.candidates[0].content
        ? data.candidates[0].content.parts
        : null;
    const reply =
      parts && parts[0] && parts[0].text
        ? parts.map((p) => p.text || "").join("")
        : "Sorry, I couldn't answer that.";

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reply })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reply: "Something went wrong. Please try again." })
    };
  }
};
            
