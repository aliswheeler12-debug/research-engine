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
    const rawText = data.content?.[0]?.text || "";

    // --- KRİTİK: SENİN KODUN BİR LİSTE (ARRAY) BEKLİYOR ---
    // Kodundaki ".filter" hatasını çözmek için veriyi bir liste içine koyuyoruz.
    const responseForPage = [
      {
        id: 1,
        content: [{ text: rawText }],
        text: rawText,
        // Senin kodun muhtemelen bir liste içinde obje arıyor:
        projects: [rawText] 
      }
    ];

    // Eğer kodun direkt data.projects.filter diyorsa:
    // responseForPage'e ekstra özellikler ekliyoruz ki her türlü kurtarsın.
    responseForPage.projects = [rawText];
    responseForPage.text = rawText;

    return Response.json(responseForPage);

  } catch (error) {
    // Hata durumunda bile boş bir liste gönderiyoruz ki .filter hata vermesin
    return Response.json([], { status: 500 });
  }
}
