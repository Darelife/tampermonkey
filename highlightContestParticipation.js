// ==UserScript==
// @name         Contest Participant Checker with Input
// @namespace    http://tampermonkey.net/
// @version      2024-12-19
// @description  Check if you or a specified user participated in contests on Codeforces.
// @author       Prakhar Bhandari
// @match        https://codeforces.com/contests
// @icon         https://www.google.com/s2/favicons?sz=64&domain=codeforces.com
// @grant        none
// ==/UserScript==

(function () {
  "use strict"; // ayyyyyy

  function getDarelife() {
    const profileLink = document.querySelector('a[href^="/profile/"]');
    if (profileLink) {
      return profileLink.textContent.trim();
    }
    console.error("Where's bro??");
    return null;
  }

  async function broParticipated(user) {
    if (!user) {
      console.error(
        "user not found. Exiting. Awesome FML!!!...Crazyyyy....bruh moment"
      );
      return [];
    }
    const response = await fetch(
      `https://codeforces.com/api/user.status?handle=${user}`
    );
    if (!response.ok) {
      console.error("Data where??????");
      return [];
    }
    const data = await response.json();
    if (data.status !== "OK") {
      console.error("API...bruh moment");
      return [];
    }
    const contestsParti = new Set();
    data.result.forEach((submission) => {
      if (submission.author.participantType === "CONTESTANT") {
        contestsParti.add(submission.contestId);
      }
    });
    // console.log(contestsParti);
    return contestsParti;
  }

  function clearHighlights() {
    const contestRows = document.querySelectorAll("tr[data-contestid]");
    contestRows.forEach((row) => {
      const leftCell = row.querySelector(".left");

      if (leftCell) {
        leftCell.style.cssText = "";
      }
    });
  }

  async function highlightParticipatedContests(username) {
    const contestsParti = await broParticipated(username);
    if (contestsParti.size === 0) {
      console.warn("No contests found for the user.");
      return;
    }

    const contestRows = document.querySelectorAll("tr[data-contestid]");
    contestRows.forEach((row) => {
      const contestId = parseInt(row.getAttribute("data-contestid"), 10);
      if (contestsParti.has(contestId)) {
        const participantLink = row.querySelector(".right");
        // ik using !important sucks....but i was kinda forced to use it here
        participantLink.style.cssText = `
          font-size: 0.8em;
          background-color: #70cf85 !important;
        `;
        const link = participantLink.querySelector(
          ".contestParticipantCountLinkMargin"
        );
        if (link) {
          link.style.cssText = `
            font-size: 0.8em;
            color: white !important;
          `;
        }
      }
    });
  }

  async function highlightLeft(username) {
    const contestsParti = await broParticipated(username);
    if (contestsParti.size === 0) {
      console.warn("No contests found for the user.");
      return;
    }

    const contestRows = document.querySelectorAll("tr[data-contestid]");
    contestRows.forEach((row) => {
      const contestId = parseInt(row.getAttribute("data-contestid"), 10);
      if (contestsParti.has(contestId)) {
        const participantLink = row.querySelector(".left");
        participantLink.style.cssText = `
          font-size: 0.8em;
          background-color: yellow !important;
          color: black !important;
        `;
      }
    });
  }

  function addParticipantInputBox() {
    const sidebar = document.getElementById("sidebar");
    if (!sidebar) {
      console.error("Sidebar not found.");
      return;
    }

    const participantBox = document.createElement("div");
    participantBox.className =
      "roundbox sidebox virtual-contests borderTopRound";
    participantBox.innerHTML = `
      <div class="caption titled">→ Contest Participant</div>
      <div style="padding: 0.5em;">
        <label for="participantInput">Username:</label>
        <input
          type="text"
          id="participantInput"
          style="width: 100%; box-sizing: border-box; margin-bottom: 0.5em;"
          placeholder="Enter username"
        />
        <button id="checkParticipation" style="width: 100%; padding: 0.5em; cursor: pointer;">Check</button>
      </div>
    `;
    sidebar.appendChild(participantBox);

    const participantInput = document.getElementById("participantInput");
    const checkButton = document.getElementById("checkParticipation");

    function handleSearch() {
      const username = participantInput.value.trim();
      if (username) {
        clearHighlights();
        highlightLeft(username);
      } else {
        alert("Please enter a username.");
      }
    }

    checkButton.addEventListener("click", handleSearch);

    participantInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        handleSearch();
      }
    });
  }

  // window.addEventListener("load", () => {
  addParticipantInputBox();

  const loggedInUser = getDarelife();
  if (loggedInUser) {
    highlightParticipatedContests(loggedInUser);
  }
  // });
})();
