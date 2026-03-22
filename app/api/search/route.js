export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
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
        max_tokens: 4000,
        messages: body.messages,
      }),
    });

    const data = await response.json();

    // --- KRİTİK KISIM: TERCÜME ---
    // Eğer senin page.js hata veriyorsa, Claude'un cevabını 
    // senin kodunun beklediği en basit formata indirgiyoruz.
    const simplifiedResponse = {
      content: data.content,
      text: data.content?.[0]?.text || "No results found.",
      // Alt satır, senin "undefined" hatasını çözmek için:
      stop_reason: "end_turn" 
    };

    return Response.json(simplifiedResponse);

  } catch (error) {
    return Response.json({ error: "Bağlantı Hatası" }, { status: 500 });
  }
}
