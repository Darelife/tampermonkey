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
      const tags = document.querySelectorAll("a.notice");
      const parentSet = new Set();
      tags.forEach((tag) => parentSet.add(tag.parentElement));
      parentSet.forEach((parent) => {
        while (parent.firstChild) {
          parent.removeChild(parent.firstChild);
        }
        const hiddenTag = document.createElement("a");
        hiddenTag.textContent = "tags hidden";
        hiddenTag.href = "#";
        hiddenTag.className = "notice";
        hiddenTag.style.textDecoration = "none";
        parent.appendChild(hiddenTag);
      });
    }
  });
})();
