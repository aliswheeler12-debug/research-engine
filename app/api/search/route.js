export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return Response.json({ error: "API Key eksik, lütfen Vercel ayarlarını kontrol edin." }, { status: 500 });
  }

  try {
    const body = await request.json();

    // Anthropic API'sine gönderilen temiz ve standart paket
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

    // Eğer bir hata dönerse (Limit aşımı vb.), hatayı ekrana basar
    if (!response.ok) {
      return Response.json({ error: result.error?.message || "API Hatası oluştu." }, { status: response.status });
    }

    return Response.json(result);

  } catch (error) {
    return Response.json({ error: "Sunucu hatası: Kodda veya bağlantıda bir sorun var." }, { status: 500 });
  }
}
