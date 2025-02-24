// ==UserScript==
// @name         Codeforces Hide Tags Except Rating (With Reveal for Solved Problems)
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Hide all problem tags on Codeforces except the rating tags, with an option to reveal for solved problems.
// @author       Prakhar Bhandari
// @match        https://codeforces.com/problemset/problem/*
// @match        https://codeforces.com/contest/*/problem/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=codeforces.com
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  browser.storage.sync.get("tagsEnabled", (settings) => {
    if (settings.tagsEnabled) {
      console.log("Script running: Checking if the question is solved...");
      const isSolved = [...document.querySelectorAll("table")].some((table) =>
        table.textContent.includes("Accepted")
      );

      console.log("This question is solved:", isSolved);

      const tags = document.querySelectorAll(".tag-box");
      if (tags.length === 0) {
        console.log("No tags found, exiting...");
        return;
      }

      const parentSet = new Set();
      tags.forEach((tag) => {
        if (!/^\*\d+$/.test(tag.textContent.trim())) {
          parentSet.add(tag.parentElement);
        }
      });

      parentSet.forEach((parent) => {
        if (parent) parent.style.display = "none";
      });

      const tagsContainer = tags[0].closest(
        ".roundbox, .problem-statement"
      ).parentElement;
      if (tagsContainer) {
        const tagsHidden = document.createElement("div");
        tagsHidden.textContent = "Tags Hidden";
        tagsHidden.style.color = "red";
        tagsHidden.style.fontWeight = "bold";
        tagsHidden.style.fontSize = "large";
        tagsHidden.style.textAlign = "center";
        tagsHidden.style.marginTop = "10px";
        tagsHidden.style.marginBottom = "15px";

        if (!isSolved) tagsContainer.prepend(tagsHidden);
        else {
          const showTagsButton = document.createElement("button");
          showTagsButton.textContent = "Show Tags";
          showTagsButton.style.marginLeft = "10px";
          showTagsButton.style.cursor = "pointer";
          showTagsButton.style.padding = "6px 10px";
          showTagsButton.style.border = "1px solid #888";
          showTagsButton.style.background = "#f5f5f5";
          showTagsButton.style.borderRadius = "5px";
          showTagsButton.style.fontSize = "14px";
          showTagsButton.style.display = "block";
          showTagsButton.style.margin = "10px auto";

          showTagsButton.addEventListener("click", () => {
            console.log("Show Tags button clicked");
            parentSet.forEach((parent) => {
              if (parent) parent.style.display = "block";
            });
            showTagsButton.remove();
          });

          tagsContainer.appendChild(showTagsButton);
        }
      }
    }
  });
})();
