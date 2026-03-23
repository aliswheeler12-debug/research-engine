// app/api/search/route.js
// Şeffaf proxy: page.js'den gelen isteği Anthropic'e iletir,
// yanıtı olduğu gibi döner. HİÇBİR ŞEY DEĞİŞTİRMEZ.

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: { message: "ANTHROPIC_API_KEY environment variable is not set." } },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: { message: "Invalid JSON body." } },
      { status: 400 }
    );
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body), // page.js'den ne gelirse aynen Anthropic'e gönder
  });

  const data = await res.json();
  return Response.json(data, { status: res.status }); // Anthropic'ten ne gelirse aynen döndür
}
