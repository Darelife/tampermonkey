// ==UserScript==
// @name         CF Analytics
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Adds charts and unsolved problem list on Codeforces profile page
// @author       CF Analytics
// @match        https://codeforces.com/profile/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=codeforces.com
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/chart.js
// ==/UserScript==

// This isn't my code...this is the code from CF Analytics's extension. I just copied it and slightly modified it to work as a Tampermonkey script.
// so that i can use it on my phone on firefox, as the extension isn't available on firefox-android, while tampermonkey is.
(function () {
  "use strict";

  var problems = new Map();
  var ratings = new Map();
  var tags = new Map();
  var ratingChartLabel = [];
  var ratingChartData = [];
  var ratingChartBackgroundColor = [];
  var tagChartLabel = [];
  var tagChartData = [];

  ratings[Symbol.iterator] = function* () {
    yield* [...ratings.entries()].sort((a, b) => {
      return a[0] - b[0];
    });
  };

  tags[Symbol.iterator] = function* () {
    yield* [...tags.entries()].sort((a, b) => b[1] - a[1]);
  };

  const colorArray = [
    "#ff867c",
    "#ff77a9",
    "#df78ef",
    "#b085f5",
    "#8e99f3",
    "#80d6ff",
    "#73e8ff",
    "#6ff9ff",
    "#64d8cb",
    "#98ee99",
    "#cfff95",
    "#ffff89",
    "#ffff8b",
    "#fffd61",
    "#ffd95b",
    "#ffa270",
  ];

  document.querySelector("#pageContent").insertAdjacentHTML(
    "beforeend",
    `
        <div id="customContent" style="display: flex; flex-direction: column; gap: 20px;">
            <div id="charts">
                <canvas id="problemRatingChart"></canvas>
            </div>
            <br />
            <div id="charts">
                <canvas id="tagChart"></canvas>
            </div>
            <br />
            <div id="tagDetails">
                <h3>Tags Solved</h3>
                <br />
                <ul id="tag_list" style="list-style: none; padding: 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;"></ul>
            </div>
            <div id="unsolvedProblems">
                <h3>Unsolved Problems</h3>
                <div id="unsolved_list"></div>
                <p id="unsolved_count"></p>
            </div>
        </div>
    `
  );

  const profileId = getProfileIdFromUrl(window.location.href);
  console.log(`Profile ID: ${profileId}`);

  fetch(`https://codeforces.com/api/user.status?handle=${profileId}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "OK") {
        processData(data.result);
        createProblemRatingChart();
        createTagChart();
      } else {
        console.error(`${data.status} : ${data.comment}`);
      }
    });

  function getProfileIdFromUrl(url) {
    return url.split("/").pop().split("?")[0];
  }

  function processData(resultArr) {
    let unsolvedCount = 0;

    resultArr.forEach((sub) => {
      const problemId = `${sub.problem.contestId}-${sub.problem.index}`;
      if (!problems.has(problemId)) {
        problems.set(problemId, {
          solved: false,
          rating: sub.problem.rating,
          contestId: sub.problem.contestId,
          index: sub.problem.index,
          tags: sub.problem.tags,
        });
      }

      if (sub.verdict === "OK") {
        const obj = problems.get(problemId);
        obj.solved = true;
        problems.set(problemId, obj);
      }
    });

    problems.forEach((prob) => {
      if (prob.rating && prob.solved === true) {
        if (!ratings.has(prob.rating)) {
          ratings.set(prob.rating, 0);
        }
        ratings.set(prob.rating, ratings.get(prob.rating) + 1);
      }

      if (prob.solved === false) {
        unsolvedCount++;
        const problemURL = findProblemURL(prob.contestId, prob.index);
        document.querySelector("#unsolved_list").insertAdjacentHTML(
          "beforeend",
          `
                    <a class="unsolved_problem" href="${problemURL}">
                        ${prob.contestId}-${prob.index}
                    </a> &nbsp;
                `
        );
      }

      if (prob.solved === true) {
        prob.tags.forEach((tag) => {
          if (!tags.has(tag)) {
            tags.set(tag, 0);
          }
          tags.set(tag, tags.get(tag) + 1);
        });
      }
    });

    document.querySelector(
      "#unsolved_count"
    ).textContent = `Count : ${unsolvedCount}`;

    for (const [key, val] of ratings) {
      ratingChartLabel.push(key);
      ratingChartData.push(val);
      ratingChartBackgroundColor.push(ratingBackgroundColor(key));
    }

    for (const [key, val] of tags) {
      tagChartLabel.push(key);
      tagChartData.push(val);
      document.querySelector("#tag_list").insertAdjacentHTML(
        "beforeend",
        `
                <li style="display: flex; align-items: center;">
                    <svg width="12" height="12" style="margin-right: 8px;">
                        <rect width="12" height="12" style="fill:${
                          colorArray[
                            tagChartLabel.indexOf(key) % colorArray.length
                          ]
                        };stroke-width:1;stroke:rgb(0,0,0)" />
                    </svg>
                    ${key}: ${val}
                </li>
            `
      );
    }
  }

  function findProblemURL(contestId, index) {
    return contestId.toString().length <= 4
      ? `https://codeforces.com/problemset/problem/${contestId}/${index}`
      : `https://codeforces.com/problemset/gymProblem/${contestId}/${index}`;
  }

  function createProblemRatingChart() {
    const ctx = document.getElementById("problemRatingChart").getContext("2d");
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: ratingChartLabel,
        datasets: [
          {
            label: "Problems Solved",
            data: ratingChartData,
            backgroundColor: ratingChartBackgroundColor,
            borderColor: "rgba(0, 0, 0, 1)",
            borderWidth: 0.75,
          },
        ],
      },
      options: {
        aspectRatio: 2.5,
        scales: {
          x: {
            title: { text: "Problem Rating", display: false },
          },
          y: {
            title: { text: "Problems Solved", display: false },
            beginAtZero: true,
          },
        },
      },
    });
  }

  function createTagChart() {
    const ctx = document.getElementById("tagChart").getContext("2d");
    new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: tagChartLabel,
        datasets: [
          {
            label: "Tags Solved",
            data: tagChartData,
            backgroundColor: colorArray,
            borderWidth: 0.5,
          },
        ],
      },
      options: {
        aspectRatio: 2,
        plugins: {
          legend: { display: false, position: "right" },
        },
      },
    });
  }

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
})();
