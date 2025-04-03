// ==UserScript==
// @name         Codeforces Submissions Rating (Optimized)
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Display problem ratings in the submissions table on Codeforces (Optimized for speed)
// @author       Prakhar Bhandari
// @match        https://codeforces.com/submissions/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=codeforces.com
// @grant        GM_xmlhttpRequest
// @connect      codeforces.com
// ==/UserScript==

(function () {
  "use strict";

  browser.storage.sync.get("submissionsEnabled", ({ submissionsEnabled }) => {
    if (!submissionsEnabled) return;

    console.log("Script Running: Fetching Problem Ratings");

    function ratingBackgroundColor(rating) {
      return rating >= 3000
        ? "rgba(170, 0, 0, 0.9)"
        : rating >= 2600
        ? "rgba(255, 51, 51, 0.9)"
        : rating >= 2400
        ? "rgba(255, 119, 119, 0.9)"
        : rating >= 2300
        ? "rgba(255, 187, 85, 0.9)"
        : rating >= 2100
        ? "rgba(255, 204, 136, 0.9)"
        : rating >= 1900
        ? "rgba(255, 136, 255, 0.9)"
        : rating >= 1600
        ? "rgba(170, 170, 255, 0.9)"
        : rating >= 1400
        ? "rgba(119, 221, 187, 0.9)"
        : rating >= 1200
        ? "rgba(119, 255, 119, 0.9)"
        : "rgba(204, 204, 204, 0.9)";
    }

    async function fetchProblemRatings() {
      try {
        const response = await fetch(
          "https://codeforces.com/api/problemset.problems"
        );
        if (!response.ok) throw new Error("API Error");
        const data = await response.json();
        if (data.status !== "OK") throw new Error("API Status Not OK");

        const ratings = {};
        data.result.problems.forEach(({ contestId, index, rating }) => {
          if (rating) ratings[`${contestId}${index}`] = rating;
        });

        return ratings;
      } catch (error) {
        console.error("Error fetching problem ratings:", error);
        return {};
      }
    }

    function addRatingsToTable(problemRatings) {
      const table = document.querySelector(".status-frame-datatable");
      if (!table) return;

      const rows = table.querySelectorAll("tr");
      const darkMode =
        getComputedStyle(document.body).backgroundColor === "rgb(24, 24, 24)";
      let isOdd = true;

      rows.forEach((row, index) => {
        if (index === 0) {
          const ratingHeader = document.createElement("th");
          ratingHeader.textContent = "Rating";
          row.appendChild(ratingHeader);
          return;
        }

        const problemLink = row.querySelector("td:nth-child(4) a");
        if (!problemLink) return;

        const urlParts = problemLink.href.split("/");
        const contestId = urlParts[urlParts.length - 3];
        const problemIndex = urlParts[urlParts.length - 1];
        const problemId = `${contestId}${problemIndex}`;

        const ratingCell = document.createElement("td");
        ratingCell.style.setProperty(
          "background-color",
          darkMode ? (isOdd ? "#181818" : "#1e1e1e") : "transparent",
          "important"
        );
        isOdd = !isOdd;

        if (problemRatings[problemId]) {
          const rating = problemRatings[problemId];
          ratingCell.textContent = rating;
          ratingCell.style.setProperty(
            "background-color",
            ratingBackgroundColor(rating),
            "important"
          );
          ratingCell.style.setProperty("color", "black", "important");
        }

        row.appendChild(ratingCell);
      });

      // Apply dark mode styling if needed
      const outerDiv = table.parentElement;
      if (outerDiv && darkMode) {
        outerDiv.style.setProperty("margin", "0", "important");
        outerDiv.style.setProperty("padding", "0.3em 3px 0px", "important");
        outerDiv.style.setProperty("background-color", "#181818", "important");
      }
    }

    async function main() {
      const problemRatings = await fetchProblemRatings();
      addRatingsToTable(problemRatings);
    }

    main();
  });
})();
