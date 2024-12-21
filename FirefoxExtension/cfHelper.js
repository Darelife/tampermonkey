// ==UserScript==
// @name         CF Assistant
// @version      1.0
// @description  Adds useful features to the CF website, such as adding ratings to the submissions page, and ability to check the contests you and any particular person has participated in the contests page itself, for comparison.
// @author       Prakhar Bhandari
// @match        https://codeforces.com/submissions/*
// @match        https://codeforces.com/contests
// @icon         https://www.google.com/s2/favicons?sz=64&domain=codeforces.com
// @grant        GM_xmlhttpRequest
// @connect      codeforces.com
// ==/UserScript==

(function () {
  "use strict";

  // Function to get the logged-in user's handle
  function getDarelife() {
    const profileLink = document.querySelector('a[href^="/profile/"]');
    if (profileLink) {
      return profileLink.textContent.trim();
    }
    console.error("Where's bro??");
    return null;
  }

  // Function to check if a user participated in contests
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
    return contestsParti;
  }

  // Function to clear highlights
  function clearHighlights() {
    const contestRows = document.querySelectorAll("tr[data-contestid]");
    contestRows.forEach((row) => {
      const leftCell = row.querySelector(".left");
      if (leftCell) {
        leftCell.style.cssText = "";
      }
    });
  }

  // Function to highlight participated contests
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

  // Function to highlight the left side of participated contests
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

  // Function to add participant input box
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

  // Function to get the rating background color
  function ratingBackgroundColor(rating) {
    if (rating >= 3000) return "rgba(170, 0, 0, 0.9)";
    if (rating >= 2600) return "rgba(255, 51, 51, 0.9)";
    if (rating >= 2400) return "rgba(255, 119, 119, 0.9)";
    if (rating >= 2300) return "rgba(255, 187, 85, 0.9)";
    if (rating >= 2100) return "rgba(255, 204, 136, 0.9)";
    if (rating >= 1900) return "rgba(255, 136, 255, 0.9)";
    if (rating >= 1600) return "rgba(170, 170, 255, 0.9)";
    if (rating >= 1400) return "rgba(119, 221, 187, 0.9)";
    if (rating >= 1200) return "rgba(119, 255, 119, 0.9)";
    return "rgba(204, 204, 204, 0.9)";
  }

  // Function to fetch problem ratings from the Codeforces API
  function fetchProblemRatings(problemIds, callback) {
    const apiUrl = `https://codeforces.com/api/problemset.problems`;

    GM_xmlhttpRequest({
      method: "GET",
      url: apiUrl,
      onload: function (response) {
        if (response.status === 200) {
          const data = JSON.parse(response.responseText);
          if (data.status === "OK") {
            const problems = data.result.problems;
            const problemRatings = {};

            // Create a map of problem IDs to ratings
            for (const problem of problems) {
              const problemId = `${problem.contestId}${problem.index}`;
              if (problem.rating) {
                problemRatings[problemId] = problem.rating;
              }
            }
            callback(problemRatings);
          } else {
            console.error("Error fetching problem data: ", data.comment);
          }
        } else {
          console.error("Failed to fetch API data: ", response.status);
        }
      },
    });
  }

  // Function to add ratings to the table
  function addRatingsToTable(problemRatings) {
    const tableRows = document.querySelectorAll(".status-frame-datatable tr");

    let odd = true;
    tableRows.forEach((row) => {
      const problemLink = row.querySelector("td:nth-child(4) a");
      const ratingCell = document.createElement("td");
      const body = document.querySelector("body");
      console.log(getComputedStyle(body).backgroundColor);
      if (getComputedStyle(body).backgroundColor != "rgb(255, 255, 255)") {
        if (odd) {
          ratingCell.style.setProperty(
            "background-color",
            "#181818",
            "important"
          );
          odd = false;
        } else {
          ratingCell.style.setProperty(
            "background-color",
            "#1e1e1e",
            "important"
          );
          odd = true;
        }
      }

      if (problemLink) {
        const urlParts = problemLink.href.split("/");
        const contestId = urlParts[urlParts.length - 3];
        console.log(contestId);
        const isContest = urlParts[urlParts.length - 4] == "contest";
        if (isContest) {
          const problemIndex = urlParts[urlParts.length - 1];
          const problemId = `${contestId}${problemIndex}`;

          if (problemRatings[problemId]) {
            const rating = problemRatings[problemId];
            ratingCell.textContent = rating;
            const backgroundColor = ratingBackgroundColor(rating);
            ratingCell.style.setProperty(
              "background-color",
              backgroundColor,
              "important"
            );
            ratingCell.style.setProperty("color", "black", "important");
          }
        }
        row.appendChild(ratingCell);
      }
    });

    const table = document.querySelector(".status-frame-datatable");
    if (table) {
      const headerRow = table.querySelector("tr");
      if (headerRow) {
        const ratingHeader = document.createElement("th");
        ratingHeader.textContent = "Rating";
        headerRow.appendChild(ratingHeader);
      }
    }
  }

  // Main execution
  const problemIds = new Set();
  document.querySelectorAll(".status-frame-datatable tr").forEach((row) => {
    const problemLink = row.querySelector("td:nth-child(4) a");
    if (problemLink) {
      const urlParts = problemLink.href.split("/");
      const contestId = urlParts[urlParts.length - 2];
      const problemIndex = urlParts[urlParts.length - 1];
      const problemId = `${contestId}${problemIndex}`;
      problemIds.add(problemId);
    }
  });

  fetchProblemRatings(Array.from(problemIds), (problemRatings) => {
    addRatingsToTable(problemRatings);
  });

  const outerDiv = document.querySelector(
    ".status-frame-datatable"
  ).parentElement;
  if (outerDiv) {
    const body = document.querySelector("body");
    console.log(getComputedStyle(body).backgroundColor);
    if (getComputedStyle(body).backgroundColor != "rgb(255, 255, 255)") {
      outerDiv.style.setProperty("margin", "0", "important");
      outerDiv.style.setProperty("padding", "0.3em 3px 0px", "important");
      outerDiv.style.setProperty("background-color", "#181818", "important");
    }
  }

  // Add participant input box and highlight contests
  addParticipantInputBox();
  const loggedInUser = getDarelife();
  if (loggedInUser) {
    highlightParticipatedContests(loggedInUser);
  }
})();
