(function () {
  "use strict";

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
      console.error("User not found.");
      return [];
    }
    const response = await fetch(
      `https://codeforces.com/api/user.status?handle=${user}`
    );
    if (!response.ok) {
      console.error("Data not found.");
      return [];
    }
    const data = await response.json();
    if (data.status !== "OK") {
      console.error("API Error.");
      return [];
    }
    const contestsParti = new Set();
    data.result.forEach((submission) => {
      if (submission.author.participantType === "CONTESTANT") {
        contestsParti.add(submission.contestId);
      }
    });
    return contestsParti;
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

  function clearHighlights() {
    document.querySelectorAll("tr[data-contestid]").forEach((row) => {
      row.querySelector(".left")?.style.removeProperty("background-color");
      row.querySelector(".left")?.style.removeProperty("color");
    });
  }

  async function highlightLeft(username) {
    const contestsParti = await broParticipated(username);
    if (contestsParti.size === 0) {
      console.warn("No contests found.");
      return;
    }

    document.querySelectorAll("tr[data-contestid]").forEach((row) => {
      const contestId = parseInt(row.getAttribute("data-contestid"), 10);
      if (contestsParti.has(contestId)) {
        row
          .querySelector(".left")
          .style.setProperty("background-color", "yellow", "important");
        row
          .querySelector(".left")
          .style.setProperty("color", "black", "important");
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

  addParticipantInputBox();
  const loggedInUser = getDarelife();
  if (loggedInUser) {
    highlightParticipatedContests(loggedInUser);
  }
})();
