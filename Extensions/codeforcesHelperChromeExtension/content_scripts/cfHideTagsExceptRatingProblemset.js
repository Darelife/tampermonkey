// ==UserScript==
// @name         Codeforces Hide Tags Except Rating (Optimized)
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Hide all problem tags on Codeforces except the rating tags (persists after filtering). Clicking "Tags Hidden" reveals them.
// @author       Prakhar Bhandari
// @match        https://codeforces.com/problemset/problem/*
// @match        https://codeforces.com/contest/*/problem/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=codeforces.com
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  function hideTags() {
    const tags = document.querySelectorAll("a.notice");
    tags.forEach((tag) => {
      const parent = tag.parentElement;
      if (parent && !parent.dataset.hidden) {
        parent.dataset.hidden = "true"; // Prevent duplicate execution

        // Store original tags
        const originalTags = [...parent.children]
          .map((el) => el.outerHTML)
          .join(", ");

        parent.dataset.originalTags = originalTags; // Store in dataset
        parent.innerHTML = ""; // Clear existing tags

        const hiddenTag = document.createElement("a");
        hiddenTag.textContent = "Tags Hidden";
        hiddenTag.href = "#";
        hiddenTag.className = "notice";
        hiddenTag.style =
          "text-decoration: none; cursor: pointer; color: gray !important; opacity: 0.8;";

        hiddenTag.onclick = (event) => {
          event.preventDefault();
          parent.innerHTML = parent.dataset.originalTags; // Restore original tags
        };

        parent.appendChild(hiddenTag);
      }
    });
  }

  chrome.storage.sync.get("tagsEnabled", ({ tagsEnabled }) => {
    if (tagsEnabled) {
      hideTags();

      // Observe mutations to handle filtering updates dynamically
      const observer = new MutationObserver(hideTags);
      observer.observe(document.body, { childList: true, subtree: true });
    }
  });
})();
