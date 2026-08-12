import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }

  try {
    const body = await req.json();
    const { message, chatHistory = [] } = body;

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message required", success: false }),
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    const GROQ_API_KEY = Deno.env.get("groq_api_key");

    if (!GROQ_API_KEY) {
      return new Response(
        JSON.stringify({ error: "API key not configured", success: false }),
        { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    const messages = [
      {
        role: "system",
        content: `আপনি MRZN Apps & Games এর AI assistant। যেকোনো ভাষায় সাহায্য করুন।`
      }
    ];

    if (Array.isArray(chatHistory)) {
      for (const msg of chatHistory) {
        if (msg.role && msg.content) {
          messages.push({
            role: msg.role,
            content: msg.content
          });
        }
      }
    }

    messages.push({
      role: "user",
      content: message
    });

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-70b-versatile",
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({ error: `API error: ${errorText}`, success: false }),
        { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return new Response(
      JSON.stringify({
        response: aiResponse,
        success: true
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message || "Unknown error",
        success: false
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  }
});
