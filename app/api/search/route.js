// app/api/search/route.js
export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: { message: "API key is missing." } },
      { status: 500 }
    );
  }

  try {
    const originalBody = await request.json();

    // KRİTİK DEĞİŞİKLİK: Arayüzden ne gelirse gelsin, 
    // burada modeli en hızlı ve ucuz olan Haiku'ya zorluyoruz.
    const optimizedBody = {
      ...originalBody,
      model: "claude-3-haiku-20240307", // Limit dostu model
      max_tokens: 600 // Paranı ve limitini korur
    };

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(optimizedBody),
    });

    const data = await res.json();

    // Eğer limit aşılırsa (429), kullanıcıya daha açıklayıcı bir mesaj ver
    if (res.status === 429) {
      return Response.json({ 
        error: { message: "API limit reached. Please wait a minute before searching again." } 
      }, { status: 429 });
    }

    return Response.json(data, { status: res.status });

  } catch (error) {
    return Response.json({ error: { message: "An error occurred." } }, { status: 500 });
  }
}
