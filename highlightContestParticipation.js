// ==UserScript==
// @name         Contest Participant Checker
// @namespace    http://tampermonkey.net/
// @version      2024-12-19
// @description  Check if you participated in contests on Codeforces.
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
      console.error("user not found. Exiting. Awesome FML!!!");
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
    console.log(contestsParti);
    return contestsParti;
  }

  async function highlightParticipatedContests() {
    const user = getDarelife();
    const contestsParti = await broParticipated(user);
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
                    background-color: #70cf85 !important; /* Light green */
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

  window.addEventListener("load", highlightParticipatedContests);
})();
