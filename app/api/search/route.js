export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return Response.json({ error: "API Key is missing" }, { status: 500 });
  }

  try {
    const originalBody = await request.json();

    // Sadece gerekli olan kısımları alıp Claude'a gönderiyoruz
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
        messages: originalBody.messages // Arayüzden gelen mesaj listesini direkt kullanıyoruz
      }),
    });

    const data = await response.json();
    return Response.json(data, { status: response.status });

  } catch (error) {
    return Response.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
