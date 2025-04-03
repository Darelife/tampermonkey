// ==UserScript==
// @name         Codeforces Hide Tags Except Rating (Optimized & Toggleable)
// @namespace    http://tampermonkey.net/
// @version      1.7
// @description  Hide all problem tags on Codeforces except rating tags, with an option to toggle visibility for solved problems.
// @author       Prakhar Bhandari
// @match        https://codeforces.com/problemset/problem/*
// @match        https://codeforces.com/contest/*/problem/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=codeforces.com
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  browser.storage.sync.get("tagsEnabled", ({ tagsEnabled }) => {
    if (!tagsEnabled) return;

    function getLoggedInUsername() {
      return (
        document.querySelector('a[href^="/profile/"]')?.textContent.trim() ||
        null
      );
    }

    function hideTags(isSolved) {
      const tags = [...document.querySelectorAll(".tag-box")].filter(
        (tag) => !/^\*\d+$/.test(tag.textContent.trim())
      );
      if (tags.length === 0) return;

      const parentSet = new Set(tags.map((tag) => tag.parentElement));
      parentSet.forEach((parent) => (parent.style.display = "none"));

      const tagsContainer = tags[0]?.closest(
        ".roundbox, .problem-statement"
      )?.parentElement;
      if (!tagsContainer) return;

      const messageBox = Object.assign(document.createElement("div"), {
        textContent: "Tags Hidden",
        style:
          "color: red; font-weight: bold; font-size: large; text-align: center; margin: 10px auto; padding: 8px 12px; border: 2px solid red; border-radius: 5px; display: inline-block; background: none;",
      });
      tagsContainer.appendChild(messageBox);

      if (isSolved) {
        const toggleButton = Object.assign(document.createElement("button"), {
          textContent: "Show Tags",
          style:
            "color: red; font-weight: bold; font-size: large; text-align: center; margin: 10px auto; padding: 8px 12px; border: 2px solid red; border-radius: 5px; background: none; cursor: pointer; display: inline-block;",
        });

        let isVisible = false;

        toggleButton.onclick = () => {
          isVisible = !isVisible;
          parentSet.forEach(
            (parent) => (parent.style.display = isVisible ? "block" : "none")
          );
          toggleButton.textContent = isVisible ? "Hide Tags" : "Show Tags";
        };

        messageBox.replaceWith(toggleButton);
      }
    }

    function checkIfSolved(contestId, indexId, userId) {
      fetch(
        `https://codeforces.com/api/contest.status?contestId=${contestId}&handle=${userId}`
      )
        .then((response) => response.json())
        .then((data) => {
          if (data.status === "OK") {
            const isSolved = data.result.some(
              (submission) =>
                submission.problem.contestId == contestId &&
                submission.problem.index === indexId &&
                submission.verdict === "OK"
            );
            hideTags(isSolved);
          } else {
            console.error("Error: Invalid response from API");
          }
        })
        .catch((error) => console.error("Error fetching data:", error));
    }

    function main() {
      const userId = getLoggedInUsername();
      const url = window.location.href;
      if (
        !userId ||
        (!url.includes("/problemset/problem/") && !url.includes("/contest/"))
      ) {
        return;
      }

      let contestId, indexId;

      if (url.includes("/problemset/problem/")) {
        const match = url.match(/\/problemset\/problem\/(\d+)\/(\w+)/);
        if (match) {
          contestId = match[1];
          indexId = match[2];
        }
      } else if (url.includes("/contest/")) {
        const match = url.match(/\/contest\/(\d+)\/problem\/(\w+)/);
        if (match) {
          contestId = match[1];
          indexId = match[2];
        }
      }

      if (contestId && indexId) {
        checkIfSolved(contestId, indexId, userId);
      }
    }

    main();
  });
})();
