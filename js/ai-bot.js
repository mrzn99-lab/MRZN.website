class AIBot {
  constructor() {
    this.chatHistory = [];
    this.isLoading = false;
    this.groqKey = "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";
    this.appsCache = [];
  }

  async loadAppsFromDatabase() {
    try {
      if (!window.supabaseClient) {
        console.error("Supabase client not available");
        return;
      }

      const { data, error } = await window.supabaseClient
        .from("apps")
        .select("id, name, category, description, icon_url, downloads, app_size")
        .limit(100);

      if (error) {
        console.error("Database error:", error);
        return;
      }

      if (data) {
        this.appsCache = data;
        console.log("Apps loaded:", this.appsCache.length);
      }
    } catch (err) {
      console.error("Load error:", err);
    }
  }

  searchApps(query) {
    if (!this.appsCache || this.appsCache.length === 0) {
      return [];
    }

    return this.appsCache.filter(app => {
      const name = (app.name || "").toLowerCase();
      const category = (app.category || "").toLowerCase();
      const desc = (app.description || "").toLowerCase();
      const q = (query || "").toLowerCase();
      
      return name.includes(q) || category.includes(q) || desc.includes(q);
    }).slice(0, 5);
  }

  async sendMessage(msg) {
    this.isLoading = true;
    try {
      if (!msg || msg.trim().length === 0) {
        return { text: "Please enter a message", success: false };
      }

      this.chatHistory.push({ role: "user", content: msg });

      const foundApps = this.searchApps(msg);
      let appContext = "";

      if (foundApps && foundApps.length > 0) {
        appContext = "\n\nApps found in our database:\n";
        foundApps.forEach(app => {
          appContext += `• ${app.name} (${app.category}): ${app.description}`;
          if (app.downloads) appContext += ` | Downloads: ${app.downloads}`;
          if (app.app_size) appContext += ` | Size: ${app.app_size}`;
          appContext += "\n";
        });
      }

      const systemPrompt = `আপনি MRZN Apps & Games ওয়েবসাইটের AI Assistant।

আপনার দায়িত্ব:
1. Apps/Games খুঁজে দেওয়া
2. Category অনুযায়ী Apps/Games দেখানো
3. নির্দিষ্ট App/Game-এর বিস্তারিত তথ্য দেওয়া
4. দুই বা একাধিক App/Game তুলনা করা
5. ব্যবহারকারীর প্রয়োজন অনুযায়ী App/Game recommend করা
6. Rating/review সম্পর্কিত তথ্য দেওয়া
7. App-এর permissions সম্পর্কে তথ্য দেওয়া
8. App/APK-এর security সম্পর্কে সৎ assessment দেওয়া
9. Trending/popular Apps/Games দেখানো
10. APK analysis-এর ফলাফল ব্যাখ্যা করা
11. Website-এর Apps/Games catalogue ব্যবহারকারীকে বুঝতে সাহায্য করা

গুরুত্বপূর্ণ নিয়ম:
1. কোনো App-এর তথ্য database-এ না থাকলে তথ্য বানাবেন না
2. Unknown তথ্যের ক্ষেত্রে পরিষ্কারভাবে বলুন তথ্যটি পাওয়া যায়নি
3. Security সম্পর্কে 100% safe দাবি করবেন না যদি নির্ভরযোগ্য scan না থাকে
4. APK analysis-এর ফলাফল না থাকলে analysis হয়েছে বলে দাবি করবেন না
5. Rating, downloads, size নিজে থেকে বানাবেন না
6. ব্যবহারকারীর প্রশ্ন অস্পষ্ট হলে clarification চান
7. Website-এর বাইরে থাকা Apps সম্পর্কে uncertainty উল্লেখ করুন
8. ব্যবহারকারী কোনো নির্দিষ্ট App চাইলে আগে database-এর তথ্য ব্যবহার করুন
9. একই প্রশ্ন বারবার করলে আগের context বিবেচনা করুন
10. নিজের capability সম্পর্কে মিথ্যা দাবি করবেন না

শুধুমাত্র Apps/Games সম্পর্কিত বিষয় নিয়ে কথা বলুন।
ভাষা: Bengali/English - যে ভাষায় প্রশ্ন তাতে উত্তর দিন।${appContext}`;

      const messageBody = {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          ...this.chatHistory
        ],
        max_tokens: 1024,
        temperature: 0.7
      };

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.groqKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(messageBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData?.error?.message || `HTTP ${response.status}`;
        throw new Error(errorMsg);
      }

      const responseData = await response.json();

      if (!responseData) {
        throw new Error("Empty response from API");
      }

      if (!Array.isArray(responseData.choices) || responseData.choices.length === 0) {
        console.error("Invalid response structure:", responseData);
        throw new Error("No choices in API response");
      }

      const firstChoice = responseData.choices[0];
      if (!firstChoice.message || !firstChoice.message.content) {
        console.error("Invalid message structure:", firstChoice);
        throw new Error("No message content in response");
      }

      const reply = firstChoice.message.content;
      this.chatHistory.push({ role: "assistant", content: reply });

      return { text: reply, success: true };

    } catch (error) {
      console.error("Error:", error);
      const errorMsg = error?.message || "Unknown error occurred";
      return { text: `❌ Error: ${errorMsg}`, success: false };
    } finally {
      this.isLoading = false;
    }
  }
}

let bot = null;

document.addEventListener("DOMContentLoaded", async function() {
  console.log("Initializing AI Bot...");
  bot = new AIBot();
  await bot.loadAppsFromDatabase();
  setupUI();
});

function setupUI() {
  const toggle = document.getElementById("helper-bot-toggle");
  const panel = document.getElementById("helper-bot-panel");
  const close = document.getElementById("helper-bot-close");
  const input = document.getElementById("helper-bot-input");
  const log = document.getElementById("helper-bot-log");
  const send = document.getElementById("helper-bot-send");

  if (!toggle || !panel || !input || !send || !log) {
    console.error("Bot UI elements not found");
    return;
  }

  toggle.addEventListener("click", function() {
    panel.style.display = "flex";
    input.focus();
  });

  close?.addEventListener("click", function() {
    panel.style.display = "none";
  });

  function sendMsg() {
    const text = input.value.trim();
    if (!text || bot.isLoading) return;

    input.value = "";
    addMsg(text, "user");
    send.disabled = true;
    send.textContent = "চিন্তা করছি...";

    bot.sendMessage(text).then(res => {
      addMsg(res.text, "bot");
      send.disabled = false;
      send.textContent = "পাঠান";
      input.focus();
    });
  }

  send.addEventListener("click", sendMsg);
  input.addEventListener("keydown", function(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMsg();
    }
  });

  function addMsg(text, type) {
    if (!text) return;
    
    const div = document.createElement("div");
    const isBotMsg = type === "bot";
    
    div.style.cssText = `
      max-width:80%; margin:8px 0; padding:11px 15px; border-radius:14px;
      font-size:14px; line-height:1.6; word-break:break-word;
      ${isBotMsg
        ? "background:var(--panel-2); color:var(--text); align-self:flex-start; border-bottom-left-radius:3px;"
        : "background:linear-gradient(135deg,var(--cyan),var(--violet)); color:var(--void); align-self:flex-end; margin-left:auto; border-bottom-right-radius:3px;"}
    `;
    div.textContent = text;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }

  addMsg("🤖 MRZN AI Assistant! আমাকে Apps/Games সম্পর্কে প্রশ্ন করুন। | Ask me about Apps & Games.", "bot");
}
