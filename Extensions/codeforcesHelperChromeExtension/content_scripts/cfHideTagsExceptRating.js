// ==UserScript==
// @name         Codeforces Hide Tags Except Rating
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Hide all problem tags on Codeforces except the rating tags
// @author       Prakhar Bhandari
// @match        https://codeforces.com/problemset/problem/*
// @match        https://codeforces.com/contest/*/problem/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=codeforces.com
// ==/UserScript==

(function () {
  "use strict";

  chrome.storage.sync.get("tagsEnabled", (settings) => {
    if (settings.tagsEnabled) {
      const tags = document.querySelectorAll(".tag-box");

      tags.forEach((tag) => {
        if (!/^\*\d+$/.test(tag.textContent.trim())) {
          const parent = tag.closest(".roundbox");
          if (parent) {
            parent.style.display = "none";
          }
        }
      });
      const tagsContainer = tags[0].closest(
        ".roundbox, .problem-statement"
      ).parentNode;
      if (tagsContainer) {
        const tagsHidden = document.createElement("div");
        tagsHidden.textContent = "Tags Hidden";
        tagsHidden.style.color = "red";
        tagsHidden.style.fontWeight = "bold";
        tagsHidden.style.fontSize = "large";
        tagsHidden.style.textAlign = "center";
        tagsHidden.style.marginTop = "10px";
        tagsHidden.style.marginBottom = "15px";

        tagsContainer.prepend(tagsHidden);
      }
    }
  });
})();
