class AIBot {
  constructor() {
    this.chatHistory = [];
    this.isLoading = false;
    // Termux এ যেই key ব্যবহার করছেন সেটাই বসান
    this.groqKey = "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";
  }
async sendMessage(userMessage) {
  this.isLoading = true;

  try {
    this.chatHistory.push({ role: "user", content: userMessage });

    const requestBody = {
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are the AI Assistant for MRZN Apps & Games website. Your primary responsibilities are:

1. Search and find Apps/Games for users
2. Show Apps/Games by Category
3. Provide detailed information about specific Apps/Games
4. Compare two or multiple Apps/Games side-by-side
5. Recommend Apps/Games based on user requirements
6. Provide information about ratings and reviews
7. Explain App permissions
8. Give honest security assessment of Apps/APKs
9. Show trending and popular Apps/Games
10. Explain APK analysis results
11. Help users understand MRZN Apps/Games catalogue

Important Rules:
1. Never make up information if App data is not in database/context
2. Clearly state "Information not available" for unknown data
3. Never claim 100% safe or 100% malware-free unless reliable scans exist
4. Don't claim APK analysis was done if results aren't available
5. Never fabricate ratings, downloads, size, permissions
6. Ask for clarification if user question is unclear
7. Note uncertainty when providing info about apps outside our website
8. Use catalogue/context data first when user asks about specific apps
9. Consider previous context if user asks same question repeatedly
10. Never make false claims about your capabilities

IMPORTANT: Only discuss Apps and Games. Do not introduce any other topics.

Response Languages: Reply in the same language user asks - Bengali, English, or Banglish.

When a user asks about apps, prioritize information from MRZN's database. If information doesn't exist, be honest and clear about it.`
        },
        ...this.chatHistory
      ],
      temperature: 0.7,
      max_tokens: 1024
    };

    console.log("Sending request...");

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.groqKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API Error:", errorData);
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log("API Response:", data);

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Invalid response from API");
    }

    const aiResponse = data.choices[0].message.content;
    this.chatHistory.push({ role: "assistant", content: aiResponse });

    return { text: aiResponse, success: true };

  } catch (err) {
    console.error("Full Error:", err);
    return { text: `❌ Error: ${err.message}`, success: false };
  } finally {
    this.isLoading = false;
  }
}
