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

  const tags = document.querySelectorAll(".tag-box");

  tags.forEach((tag) => {
    if (!/^\*\d+$/.test(tag.textContent.trim())) {
      tag.style.display = "none";
    }
  });
})();
