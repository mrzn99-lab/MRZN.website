import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  // CORS
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

    // Get API key from environment
    const GROQ_API_KEY = Deno.env.get("groq_api_key");

    if (!GROQ_API_KEY) {
      return new Response(
        JSON.stringify({ error: "API key not configured", success: false }),
        { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    // Prepare messages
    const messages = [
      {
        role: "system",
        content: `আপনি MRZN Apps & Games এর একজন helpful AI assistant।

আপনার দায়িত্ব:
1. যেকোনো ভাষায় উত্তর দিন (Bengali, English, Hindi, Urdu, Banglish)
2. সবসময় সৎ এবং সঠিক তথ্য দিন
3. Apps/Games সম্পর্কে সাহায্য করুন
4. প্রশ্নকারীর প্রশ্ন বুঝে উত্তর দিন
5. মজাদার এবং কথোপকথনমূলক হন`
      }
    ];

    // Add chat history
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

    // Add current message
    messages.push({
      role: "user",
      content: message
    });

    // Call Groq API
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mixtral-8x7b-32768",
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({ error: `Groq API error: ${errorText}`, success: false }),
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
    console.error("Error:", error);
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
