export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json({ error: "API Key eksik" }, { status: 500 });

  try {
    const body = await request.json();
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 1024,
        messages: body.messages 
      }),
    });

    const result = await response.json();
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: "Bağlantı hatası" }, { status: 500 });
  }
}
