export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return Response.json({ error: "API Key bulunamadı." }, { status: 500 });
  }

  try {
    const body = await request.json();

    const res = await fetch("https://api.anthropic.com/v1/messages", {
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

    // Anthropic'ten gelen ham yanıtı alalım
    const data = await res.json();

    if (!res.ok) {
      return Response.json({ error: data.error?.message || "API Hatası" }, { status: res.status });
    }

    return Response.json(data);

  } catch (error) {
    return Response.json({ error: "Bağlantı hatası oluştu." }, { status: 500 });
  }
}
