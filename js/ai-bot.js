class AIBot {
  constructor() {
    this.chatHistory = [];
    this.isLoading = false;
    this.groqKey = "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";
    this.appsCache = [];
  }

  async loadAppsFromDatabase() {
    try {
      const { data, error } = await supabaseClient
        .from("apps")
        .select("id, name, category, description, icon_url, downloads, app_size")
        .limit(100);

      if (!error && data) {
        this.appsCache = data;
        console.log("Loaded apps:", data.length);
      }
    } catch (err) {
      console.error("Database error:", err);
    }
  }

  searchApps(query) {
    if (!this.appsCache.length) return [];
    
    const results = this.appsCache.filter(app => 
      app.name.toLowerCase().includes(query.toLowerCase()) ||
      app.category.toLowerCase().includes(query.toLowerCase()) ||
      app.description.toLowerCase().includes(query.toLowerCase())
    );
    
    return results.slice(0, 5);
  }

  async sendMessage(msg) {
    this.isLoading = true;
    try {
      this.chatHistory.push({ role: "user", content: msg });
      
      // Search database first
      const foundApps = this.searchApps(msg);
      let appContext = "";
      
      if (foundApps.length > 0) {
        appContext = "\n\nFound apps in database:\n";
        foundApps.forEach(app => {
          appContext += `- ${app.name} (${app.category}): ${app.description}\n`;
        });
      }
      
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.groqKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `You are MRZN Apps & Games AI Assistant.

Database Apps Available:
${this.appsCache.map(a => `- ${a.name} (${a.category}): ${a.description}`).join("\n")}

Your responsibilities:
1. Search and show apps from MRZN database
2. Show apps by category
3. Provide app details (ratings, downloads, size)
4. Compare apps
5. Recommend apps
6. Never make up app data
7. Only discuss apps from our database
8. Be honest if app not in database
আরো দায়িত্ব,,
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
1. কোনো App-এর তথ্য database/context-এ না থাকলে তথ্য বানাবেন না
2. Unknown তথ্যের ক্ষেত্রে পরিষ্কারভাবে বলুন যে তথ্যটি পাওয়া যায়নি
3. Security সম্পর্কে 100% safe বা 100% malware-free দাবি করবেন না যদি নির্ভরযোগ্য scan না থাকে
4. APK analysis-এর ফলাফল না থাকলে analysis হয়েছে বলে দাবি করবেন না
5. Rating, downloads, size, permissions নিজে থেকে বানাবেন না
6. ব্যবহারকারীর প্রশ্ন অস্পষ্ট হলে প্রয়োজন অনুযায়ী সংক্ষিপ্ত clarification চান
7. Website-এর বাইরে থাকা Apps সম্পর্কে তথ্য দিলে uncertainty উল্লেখ করুন
8. ব্যবহারকারী কোনো নির্দিষ্ট App চাইলে আগে catalogue/context-এর তথ্য ব্যবহার করুন
9. একই প্রশ্ন বারবার করলে আগের context বিবেচনা করুন
10. নিজের capability সম্পর্কে মিথ্যা দাবি করবেন না

শুধুমাত্র Apps/Games সম্পর্কিত বিষয় নিয়ে কথা বলুন। অন্য কোনো নতুন টপিক আনবেন না।

ভাষা:all


Respond in Bengali/English/Banglish based on user's language.${appContext}`
            },
            ...this.chatHistory
          ],
          max_tokens: 1024
        })
      });

      const data = await res.json();
      const reply = data.choices[0].message.content;
      this.chatHistory.push({ role: "assistant", content: reply });
      return { text: reply, success: true };
    } catch (err) {
      return { text: "❌ Error: " + err.message, success: false };
    } finally {
      this.isLoading = false;
    }
  }
}

let bot = null;

document.addEventListener("DOMContentLoaded", async function() {
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

  if (!toggle) return;

  toggle.addEventListener("click", function() {
    panel.style.display = "flex";
    input.focus();
  });

  close?.addEventListener("click", function() {
    panel.style.display = "none";
  });

  send.addEventListener("click", sendMsg);
  input.addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMsg();
    }
  });

  async function sendMsg() {
    const text = input.value.trim();
    if (!text || bot.isLoading) return;

    input.value = "";
    addMsg(text, "user");
    send.disabled = true;
    send.textContent = "Thinking...";

    const res = await bot.sendMessage(text);
    addMsg(res.text, "bot");

    send.disabled = false;
    send.textContent = "Send";
    input.focus();
  }

  function addMsg(text, type) {
    const div = document.createElement("div");
    div.style.cssText = "max-width:80%; margin:8px 0; padding:11px 15px; border-radius:14px; font-size:14px; word-break:break-word; " +
      (type === "bot"
        ? "background:var(--panel-2); color:var(--text); align-self:flex-start;"
        : "background:linear-gradient(135deg,var(--cyan),var(--violet)); color:var(--void); align-self:flex-end; margin-left:auto;");
    div.textContent = text;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }

  addMsg("🤖 MRZN AI Assistant! Ask me about Apps & Games from our database.", "bot");
}
