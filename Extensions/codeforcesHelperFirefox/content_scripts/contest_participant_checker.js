// ==UserScript==
// @name         Codeforces Highlight Participated Contests (Optimized)
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Highlights contests participated in by a user on Codeforces (Optimized for speed)
// @author       Prakhar Bhandari
// @match        https://codeforces.com/contests
// @icon         https://www.google.com/s2/favicons?sz=64&domain=codeforces.com
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  browser.storage.sync.get("participantsEnabled", ({ participantsEnabled }) => {
    if (!participantsEnabled) return;

    console.log("Script Running: Checking Participation");

    async function fetchParticipationData(user) {
      if (!user) return new Set();
      try {
        const response = await fetch(
          `https://codeforces.com/api/user.status?handle=${user}`
        );
        if (!response.ok) throw new Error("API Error");
        const data = await response.json();
        return data.status === "OK"
          ? new Set(
              data.result
                .filter((s) => s.author.participantType === "CONTESTANT")
                .map((s) => s.contestId)
            )
          : new Set();
      } catch (error) {
        console.error("Error fetching data:", error);
        return new Set();
      }
    }

    function highlightRows(contestsParti) {
      if (!contestsParti.size) return;

      document.querySelectorAll("tr[data-contestid]").forEach((row) => {
        const contestId = Number(row.getAttribute("data-contestid"));
        if (contestsParti.has(contestId)) {
          row
            .querySelector(".right")
            ?.style.setProperty("background-color", "#70cf85", "important");
          row
            .querySelector(".right a")
            ?.style.setProperty("color", "white", "important");
        }
      });
    }

    function highlightLeftColumn(contestsParti) {
      if (!contestsParti.size) return;

      document.querySelectorAll("tr[data-contestid]").forEach((row) => {
        const contestId = Number(row.getAttribute("data-contestid"));
        if (contestsParti.has(contestId)) {
          row
            .querySelector(".left")
            ?.style.setProperty("background-color", "yellow", "important");
          row
            .querySelector(".left")
            ?.style.setProperty("color", "black", "important");
        }
      });
    }

    function getLoggedInUsername() {
      return (
        document.querySelector('a[href^="/profile/"]')?.textContent.trim() ||
        null
      );
    }

    function addParticipantInputBox() {
      const sidebar = document.getElementById("sidebar");
      if (!sidebar || document.getElementById("participantInput")) return;

      const participantBox = document.createElement("div");
      participantBox.className =
        "roundbox sidebox virtual-contests borderTopRound";
      participantBox.innerHTML = `
        <div class="caption titled">→ Contest Participant</div>
        <div style="padding: 0.5em;">
          <label for="participantInput">Username:</label>
          <input type="text" id="participantInput" style="width: 100%; margin-bottom: 0.5em;" placeholder="Enter username"/>
          <button id="checkParticipation" style="width: 100%; padding: 0.5em; cursor: pointer;">Check</button>
        </div>
      `;

      sidebar.appendChild(participantBox);
      const input = document.getElementById("participantInput");
      const button = document.getElementById("checkParticipation");

      async function handleSearch() {
        const username = input.value.trim();
        if (!username) return alert("Please enter a username.");

        const contestsParti = await fetchParticipationData(username);
        highlightLeftColumn(contestsParti);
      }

      button.addEventListener("click", handleSearch);
      input.addEventListener(
        "keypress",
        (e) => e.key === "Enter" && handleSearch()
      );
    }

    async function main() {
      addParticipantInputBox();
      const username = getLoggedInUsername();
      if (username) {
        const contestsParti = await fetchParticipationData(username);
        highlightRows(contestsParti);
      }
    }

    main();
  });
})();
