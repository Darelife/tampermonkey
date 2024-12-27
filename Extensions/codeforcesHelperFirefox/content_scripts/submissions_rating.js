// ==UserScript==
// @name         Codeforces Submissions Rating
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Display problem ratings in the submissions table on Codeforces
// @author       Prakhar Bhandari
// @match        https://codeforces.com/submissions/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=codeforces.com
// @grant        GM_xmlhttpRequest
// @connect      codeforces.com
// ==/UserScript==

(function () {
  "use strict";

  browser.storage.sync.get("submissionsEnabled", (settings) => {
    if (settings.submissionsEnabled) {
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

      function fetchProblemRatings(problemIds, callback) {
        const apiUrl = `https://codeforces.com/api/problemset.problems`;

        fetch("https://codeforces.com/api/problemset.problems")
          .then((response) => response.json())
          .then((data) => {
            if (data.status === "OK") {
              const ratings = {};
              data.result.problems.forEach((problem) => {
                if (problem.rating) {
                  ratings[`${problem.contestId}${problem.index}`] =
                    problem.rating;
                }
              });
              callback(ratings);
            }
          })
          .catch((err) => console.error(err));
      }

      function addRatingsToTable(problemRatings) {
        const tableRows = document.querySelectorAll(
          ".status-frame-datatable tr"
        );

        let odd = true;
        tableRows.forEach((row) => {
          const problemLink = row.querySelector("td:nth-child(4) a");
          const ratingCell = document.createElement("td");
          const body = document.querySelector("body");
          console.log(getComputedStyle(body).backgroundColor);
          if (getComputedStyle(body).backgroundColor == "rgb(24, 24, 24)") {
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

          // console.log(problemLink);
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
                // console.log(ratingBackgroundColor(rating));
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
        // get the body
        const body = document.querySelector("body");
        console.log(getComputedStyle(body).backgroundColor);
        if (getComputedStyle(body).backgroundColor == "rgb(24, 24, 24)") {
          // console.log("hi");
          outerDiv.style.setProperty("margin", "0", "important");
          outerDiv.style.setProperty("padding", "0.3em 3px 0px", "important");
          outerDiv.style.setProperty(
            "background-color",
            "#181818",
            "important"
          );
        }
      }
    }
  });
})();
