/* Copy current app detail URL to the clipboard. */
(function () {
  function getAppLink() {
    return window.location.href;
  }

  async function copyAppLink(button) {
    const link = getAppLink();
    const originalText = button.textContent;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link);
      } else {
        const input = document.createElement("textarea");
        input.value = link;
        input.setAttribute("readonly", "");
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        input.remove();
      }

      button.textContent = "✅ Copied!";
      button.disabled = true;
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 1800);
    } catch (error) {
      console.error("Could not copy app link:", error);
      button.textContent = "❌ Copy failed";
      setTimeout(() => {
        button.textContent = originalText;
      }, 1800);
    }
  }

  function addCopyLinkButton() {
    const detailTop = document.querySelector("#detail-wrap .detail-top");
    if (!detailTop || document.getElementById("copy-app-link-btn")) return;

    const button = document.createElement("button");
    button.id = "copy-app-link-btn";
    button.type = "button";
    button.className = "btn btn-ghost";
    button.textContent = "🔗 Copy link";
    button.title = "Copy this app link";
    button.addEventListener("click", () => copyAppLink(button));
    detailTop.appendChild(button);
  }

  const observer = new MutationObserver(addCopyLinkButton);
  observer.observe(document.getElementById("detail-wrap") || document.body, {
    childList: true,
    subtree: true
  });
  document.addEventListener("DOMContentLoaded", addCopyLinkButton);
})();
