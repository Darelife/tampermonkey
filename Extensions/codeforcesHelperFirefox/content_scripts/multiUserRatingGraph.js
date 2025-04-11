// ==UserScript==
// @name         Codeforces Multi-User Rating Graph (Enhanced UI)
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  Beautiful multi-user Codeforces rating comparison chart with enhanced UI
// @author       darelife
// @match        https://codeforces.com/profile/*
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  "use strict";

  // Check if the feature is enabled in browser storage
  browser.storage.sync.get(
    "multiUserRatingGraphEnabled",
    ({ multiUserRatingGraphEnabled }) => {
      console.log(
        "Checking multiUserRatingGraph setting:",
        multiUserRatingGraphEnabled
      );
      if (!multiUserRatingGraphEnabled) {
        console.log("multiUserRatingGraph feature is disabled");
        return;
      }
      console.log("multiUserRatingGraph feature is enabled");
      main();
    }
  );

  // Chart.js-inspired color palette
  const COLORS = [
    "#ff6384", // Pink
    "#36a2eb", // Blue
    "#4bc0c0", // Teal
    "#9966ff", // Purple
    "#ff9f40", // Orange
    "#00b894", // Green
    "#e17055", // Salmon
  ];

  let activeHandles = [];

  const getHandleFromURL = () => window.location.pathname.split("/").pop();

  async function fetchUserRating(handle) {
    try {
      const res = await fetch(
        `https://codeforces.com/api/user.rating?handle=${handle}`
      );
      const data = await res.json();
      if (data.status !== "OK") throw new Error("Invalid handle");
      return data.result.map((d) => ({
        x: new Date(d.ratingUpdateTimeSeconds * 1000),
        y: d.newRating,
        contestName: d.contestName,
        contestId: d.contestId,
        rank: d.rank,
        oldRating: d.oldRating,
        ratingChange: d.newRating - d.oldRating,
        ratingUpdateTimeSeconds: d.ratingUpdateTimeSeconds,
      }));
    } catch (error) {
      throw new Error(`Couldn't fetch data for ${handle}`);
    }
  }

  function injectUI() {
    // Apply global styles
    const styleEl = document.createElement("style");
    styleEl.textContent = `
    /* Force tooltip visibility */
    #cf-tooltip {
      position: fixed !important;
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      z-index: 999999 !important;
      pointer-events: auto !important;
    }

    .cf-tools-container {
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      padding: 20px;
      margin: 24px 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    .cf-tools-title {
      font-size: 20px;
      font-weight: 600;
      color: inherit;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .cf-handle-badge {
      display: inline-flex;
      align-items: center;
      border-radius: 20px;
      padding: 5px 12px;
      margin: 4px 8px 4px 0;
      font-size: 13px;
      font-weight: 500;
      background-color: rgba(128, 128, 128, 0.1);
      border: 1px solid rgba(128, 128, 128, 0.2);
      transition: all 0.2s;
    }

    .cf-handle-badge:hover {
      background-color: rgba(128, 128, 128, 0.15);
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .cf-handle-badge .remove-btn {
      margin-left: 8px;
      color: #e74c3c;
      cursor: pointer;
      font-weight: bold;
      opacity: 0.7;
      transition: opacity 0.2s;
    }

    .cf-handle-badge .remove-btn:hover {
      opacity: 1;
    }

    .cf-input-group {
      display: flex;
      gap: 10px;
      margin-bottom: 14px;
    }

    .cf-input {
      flex: 1;
      padding: 8px 14px;
      font-size: 14px;
      border: 1px solid rgba(128, 128, 128, 0.3);
      border-radius: 6px;
      background-color: rgba(128, 128, 128, 0.05);
      color: inherit;
      transition: all 0.2s;
    }

    .cf-input:focus {
      outline: none;
      border-color: #3498db;
      background-color: rgba(128, 128, 128, 0.08);
      box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.15);
    }

    .cf-button {
      padding: 8px 16px;
      cursor: pointer;
      background-color: #3498db;
      color: white;
      font-weight: 500;
      border: none;
      border-radius: 6px;
      transition: all 0.2s;
    }

    .cf-button:hover {
      background-color: #2980b9;
      transform: translateY(-1px);
    }

    .cf-button:active {
      transform: translateY(0);
    }

    .cf-chart-container {
      position: relative;
      height: 450px;
      margin-top: 20px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid rgba(128, 128, 128, 0.2);
    }

    .cf-chart {
      width: 100%;
      height: 100%;
    }

    .cf-chart-legend {
      display: flex;
      flex-wrap: wrap;
      margin-top: 16px;
      gap: 12px;
    }

    .cf-legend-item {
      display: flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .cf-legend-item:hover {
      background-color: rgba(128, 128, 128, 0.1);
    }

    .cf-legend-item.hidden {
      opacity: 0.4;
    }

    .cf-legend-color {
      width: 14px;
      height: 14px;
      border-radius: 3px;
      margin-right: 6px;
    }

    .cf-tooltip {
      position: fixed !important; /* Use fixed positioning instead of absolute */
      display: block !important; /* Always display the tooltip */
      background: var(--tooltip-bg, rgba(255, 255, 255, 0.98)) !important;
      color: var(--tooltip-color, #333) !important;
      border-radius: 6px !important;
      padding: 10px 12px !important;
      font-size: 13px !important;
      box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3) !important;
      pointer-events: auto !important;
      z-index: 999999 !important; /* Very high z-index to ensure it's on top */
      max-width: 350px !important;
      max-height: 400px !important;
      overflow-y: auto !important;
      border: 1px solid rgba(128, 128, 128, 0.3) !important;
      opacity: 1 !important;
      visibility: visible !important;
      transform: none !important; /* Prevent any transforms from hiding it */
    }

    .cf-tooltip-title {
      font-weight: 600;
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .cf-tooltip-date {
      font-size: 12px;
      color: #666;
      margin-bottom: 8px;
    }

    .cf-tooltip-handle {
      display: flex;
      align-items: center;
      margin-bottom: 4px;
    }

    .cf-tooltip-rating {
      font-weight: 500;
    }

    .cf-tooltip-change {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 12px;
      font-weight: 500;
      margin-left: 6px;
    }

    .cf-tooltip-change.positive {
      background-color: rgba(46, 204, 113, 0.2);
      color: #27ae60;
    }

    .cf-tooltip-change.negative {
      background-color: rgba(231, 76, 60, 0.2);
      color: #c0392b;
    }

    .cf-tooltip-section-title {
      font-weight: 600;
      margin: 10px 0 5px 0;
      border-bottom: 1px solid rgba(128, 128, 128, 0.2);
      padding-bottom: 3px;
    }

    .cf-tooltip-participants {
      margin-top: 10px;
    }

    .cf-tooltip-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }

    .cf-tooltip-table th {
      text-align: left;
      padding: 3px 5px;
      border-bottom: 1px solid rgba(128, 128, 128, 0.2);
    }

    .cf-tooltip-table td {
      padding: 3px 5px;
    }

    .cf-tooltip-user {
      display: flex;
      align-items: center;
    }

    .cf-tooltip-table .positive {
      color: #27ae60;
    }

    .cf-tooltip-table .negative {
      color: #c0392b;
    }

    .cf-warning {
      display: none;
      margin: 10px 0;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 13px;
      background-color: rgba(255, 243, 205, 0.9);
      color: #856404;
      border: 1px solid rgba(255, 238, 186, 0.9);
    }

    @media (max-width: 768px) {
      .cf-tools-container {
        padding: 16px;
      }

      .cf-chart-container {
        height: 350px;
      }
    }

    /* Add dark mode detection */
    @media (prefers-color-scheme: dark) {
      .cf-tooltip {
        --tooltip-bg: rgba(40, 40, 40, 0.95);
        --tooltip-color: #eee;
      }

      .cf-warning {
        background-color: rgba(80, 73, 48, 0.9);
        color: #ffe783;
        border-color: rgba(100, 90, 60, 0.9);
      }
    }
  `;
    document.head.appendChild(styleEl);

    const container = document.createElement("div");
    container.className = "cf-tools-container";
    container.innerHTML = `
        <div class="cf-tools-title">📊 Compare Ratings</div>
        <div id="cf-handle-list" class="cf-handle-list"></div>
        <div class="cf-input-group">
            <input id="cf-handle-input" class="cf-input" type="text" placeholder="Add Codeforces handle..." />
            <button id="cf-add-handle" class="cf-button">Add</button>
        </div>
        <div id="cf-warning" class="cf-warning"></div>
        <div id="cf-chart-container" class="cf-chart-container">
            <canvas id="cf-rating-chart" class="cf-chart"></canvas>
        </div>
        <div id="cf-chart-legend" class="cf-chart-legend"></div>
        <div id="cf-tooltip" class="cf-tooltip"></div>
    `;

    // Find a good place to insert the chart
    const userbox = document.querySelector(".userbox");
    if (userbox) {
      userbox.after(container);
    } else {
      // Fallback insertion point
      const mainContent = document.querySelector(".content-with-sidebar");
      if (mainContent) {
        const firstChild = mainContent.firstChild;
        mainContent.insertBefore(container, firstChild);
      }
    }
  }

  function renderHandleBadges(updateGraph) {
    const list = document.getElementById("cf-handle-list");
    list.innerHTML = "";

    activeHandles.forEach((handle, index) => {
      const badge = document.createElement("span");
      badge.className = "cf-handle-badge";
      badge.style.borderLeft = `3px solid ${COLORS[index % COLORS.length]}`;

      badge.innerHTML = `
        ${handle}
        <span class="remove-btn" title="Remove" data-remove="${handle}">✕</span>
      `;
      list.appendChild(badge);
    });

    document.querySelectorAll(".remove-btn").forEach((el) => {
      el.onclick = () => {
        const toRemove = el.getAttribute("data-remove");
        activeHandles = activeHandles.filter((h) => h !== toRemove);
        updateGraph();
      };
    });
  }

  function showWarning(message) {
    const warn = document.getElementById("cf-warning");
    warn.textContent = message;
    warn.style.display = "block";
    setTimeout(() => {
      warn.style.display = "none";
    }, 3000);
  }

  // Enhanced chart implementation
  class EnhancedChart {
    constructor(canvasId, datasets) {
      this.canvas = document.getElementById(canvasId);
      this.ctx = this.canvas.getContext("2d");
      this.datasets = datasets;
      // Chart.js style padding
      this.padding = { top: 30, right: 20, bottom: 50, left: 60 };
      this.tooltip = document.getElementById("cf-tooltip");

      this.xMin = null;
      this.xMax = null;
      this.yMin = null;
      this.yMax = null;

      // Rating colors for visualization
      this.ratingColors = {
        newbie: "#CCCCCC",
        pupil: "#77FF77",
        specialist: "#77DDBB",
        expert: "#AAAAFF",
        candidateMaster: "#FF88FF",
        master: "#FFCC88",
        internationalMaster: "#FFBB55",
        grandmaster: "#FF7777",
        internationalGrandmaster: "#FF3333",
        legendaryGrandmaster: "#AA0000",
      };

      // Match canvas size to its display size
      this.resizeCanvas();

      // Bind event handler to keep 'this' context
      this.handleMouseMoveEvent = this.handleMouseMove.bind(this);
      this.handleResizeEvent = this.handleResize.bind(this);

      this.setupEvents();
      this.setupLegend();
      this.calculateBounds();
      this.render();
    }

    resizeCanvas() {
      // Get the display size of the canvas
      const rect = this.canvas.getBoundingClientRect();

      // Set the canvas internal size to match
      this.canvas.width = rect.width;
      this.canvas.height = rect.height;
    }

    setupEvents() {
      this.canvas.addEventListener("mousemove", this.handleMouseMoveEvent);
      this.canvas.addEventListener("mouseout", () => {
        this.tooltip.style.display = "none";
      });
      window.addEventListener("resize", this.handleResizeEvent);
    }

    handleResize() {
      this.resizeCanvas();
      this.render();
    }

    getRatingColor(rating) {
      if (rating < 1200) return this.ratingColors.newbie;
      if (rating < 1400) return this.ratingColors.pupil;
      if (rating < 1600) return this.ratingColors.specialist;
      if (rating < 1900) return this.ratingColors.expert;
      if (rating < 2100) return this.ratingColors.candidateMaster;
      if (rating < 2300) return this.ratingColors.master;
      if (rating < 2400) return this.ratingColors.internationalMaster;
      if (rating < 2600) return this.ratingColors.grandmaster;
      if (rating < 3000) return this.ratingColors.internationalGrandmaster;
      return this.ratingColors.legendaryGrandmaster;
    }

    setupLegend() {
      const legend = document.getElementById("cf-chart-legend");
      legend.innerHTML = "";

      this.datasets.forEach((dataset, idx) => {
        const item = document.createElement("div");
        item.className = `cf-legend-item${dataset.hidden ? " hidden" : ""}`;
        item.dataset.index = idx;

        const colorBox = document.createElement("span");
        colorBox.className = "cf-legend-color";
        colorBox.style.backgroundColor = dataset.borderColor;

        const label = document.createElement("span");
        label.textContent = dataset.label;

        item.appendChild(colorBox);
        item.appendChild(label);
        legend.appendChild(item);

        item.addEventListener("click", () => {
          dataset.hidden = !dataset.hidden;
          item.classList.toggle("hidden");
          this.calculateBounds();
          this.render();
        });
      });
    }

    calculateBounds() {
      let allPoints = [];
      this.datasets.forEach((dataset) => {
        if (!dataset.hidden && dataset.data.length > 0) {
          allPoints = allPoints.concat(dataset.data);
        }
      });

      if (allPoints.length === 0) return;

      // Find min and max values for x and y
      const minTime = Math.min(...allPoints.map((p) => p.x.getTime()));
      const maxTime = Math.max(...allPoints.map((p) => p.x.getTime()));

      // Add buffer to x-axis (8% on each side) for Chart.js-like spacing
      const timeRange = maxTime - minTime;
      const timeBuffer = timeRange * 0.08;

      this.xMin = new Date(minTime - timeBuffer);
      this.xMax = new Date(maxTime + timeBuffer);
      this.yMin = Math.min(...allPoints.map((p) => p.y));
      this.yMax = Math.max(...allPoints.map((p) => p.y));

      // Add some padding to y-axis (Chart.js style)
      const yRange = this.yMax - this.yMin;
      this.yMin = Math.max(
        0,
        Math.floor((this.yMin - yRange * 0.08) / 100) * 100
      );
      this.yMax = Math.ceil((this.yMax + yRange * 0.08) / 100) * 100;
    }

    toCanvasX(x) {
      if (!this.xMin || !this.xMax) return this.padding.left;

      const xRange = this.xMax.getTime() - this.xMin.getTime();
      if (xRange === 0)
        return (
          this.padding.left +
          (this.canvas.width - this.padding.left - this.padding.right) / 2
        );

      // Calculate the available width for plotting
      const availableWidth =
        this.canvas.width - this.padding.left - this.padding.right;

      // Calculate the ratio of the point's position within the time range
      const xRatio = (x.getTime() - this.xMin.getTime()) / xRange;

      // Convert to canvas coordinates with consistent padding
      return this.padding.left + xRatio * availableWidth;
    }

    toCanvasY(y) {
      if (!this.yMin || !this.yMax)
        return this.canvas.height - this.padding.bottom;

      const yRange = this.yMax - this.yMin;
      if (yRange === 0)
        return (
          this.canvas.height -
          this.padding.bottom -
          (this.canvas.height - this.padding.top - this.padding.bottom) / 2
        );

      const yRatio = (y - this.yMin) / yRange;
      return (
        this.canvas.height -
        this.padding.bottom -
        yRatio * (this.canvas.height - this.padding.top - this.padding.bottom)
      );
    }

    formatDate(date) {
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      return `${months[date.getMonth()]} ${date.getFullYear()}`;
    }

    findClosestPoint(mouseX, mouseY) {
      let closestPoint = null;
      let closestDistance = Infinity;
      let datasetIndex = -1;

      this.datasets.forEach((dataset, dIdx) => {
        if (dataset.hidden) return;

        dataset.data.forEach((point) => {
          const canvasX = this.toCanvasX(point.x);
          const canvasY = this.toCanvasY(point.y);

          const distance = Math.sqrt(
            Math.pow(mouseX - canvasX, 2) + Math.pow(mouseY - canvasY, 2)
          );

          if (distance < closestDistance && distance < 20) {
            closestDistance = distance;
            closestPoint = point;
            datasetIndex = dIdx;
          }
        });
      });

      return closestPoint ? { point: closestPoint, datasetIndex } : null;
    }

    findAllUsersForContest(contestId) {
      const usersData = [];

      this.datasets.forEach((dataset) => {
        if (dataset.hidden) return;

        const contestPoint = dataset.data.find(
          (p) => p.contestId === contestId
        );
        if (contestPoint) {
          usersData.push({
            handle: dataset.label,
            color: dataset.borderColor,
            newRating: contestPoint.y,
            oldRating: contestPoint.oldRating,
            ratingChange: contestPoint.ratingChange,
            contestName: contestPoint.contestName,
            date: contestPoint.x,
            rank: contestPoint.rank,
          });
        }
      });

      // Sort by new rating (descending)
      return usersData.sort((a, b) => b.newRating - a.newRating);
    }

    handleMouseMove(e) {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const closest = this.findClosestPoint(mouseX, mouseY);

      if (closest) {
        const { point, datasetIndex } = closest;
        const dataset = this.datasets[datasetIndex];

        // Completely redesigned tooltip positioning to ensure it never overlaps cursor
        // and always has enough space

        // Get the canvas position relative to the viewport
        const canvasRect = this.canvas.getBoundingClientRect();
        const viewportX = canvasRect.left + mouseX;
        const viewportY = canvasRect.top + mouseY;

        // Get viewport and document dimensions
        const viewportWidth = window.innerWidth;
        const documentHeight = document.documentElement.scrollHeight;

        // Tooltip dimensions
        const tooltipWidth = 300;
        const tooltipHeight = 250;
        const padding = 25; // Space between cursor and tooltip

        // Calculate available space in each direction
        const spaceRight = viewportWidth - viewportX - padding;
        const spaceLeft = viewportX - padding;
        const spaceBelow = documentHeight - viewportY - padding;
        const spaceAbove = viewportY - padding;

        // Determine best horizontal position
        let tooltipX;
        if (spaceRight >= tooltipWidth) {
          // Enough space to the right
          tooltipX = mouseX + padding;
        } else if (spaceLeft >= tooltipWidth) {
          // Enough space to the left
          tooltipX = mouseX - tooltipWidth - padding;
        } else {
          // Not enough space on either side, center it and make sure it doesn't go off-screen
          tooltipX = Math.max(
            10,
            Math.min(rect.width - tooltipWidth - 10, mouseX - tooltipWidth / 2)
          );
        }

        // Determine best vertical position
        let tooltipY;
        if (spaceBelow >= tooltipHeight) {
          // Enough space below
          tooltipY = mouseY + padding;
        } else if (spaceAbove >= tooltipHeight) {
          // Enough space above
          tooltipY = mouseY - tooltipHeight - padding;
        } else {
          // Not enough space above or below, position it to minimize overflow
          tooltipY = Math.max(
            10,
            Math.min(
              rect.height - tooltipHeight - 10,
              mouseY - tooltipHeight / 2
            )
          );
        }

        // Final adjustment to ensure tooltip is fully visible within the canvas
        tooltipX = Math.max(
          10,
          Math.min(rect.width - tooltipWidth - 10, tooltipX)
        );
        tooltipY = Math.max(
          10,
          Math.min(rect.height - tooltipHeight - 10, tooltipY)
        );

        // Format tooltip content
        const ratingChange = point.ratingChange;
        const changeClass = ratingChange >= 0 ? "positive" : "negative";
        const changeSign = ratingChange >= 0 ? "+" : "";

        // Get all users who participated in this contest
        const contestParticipants = this.findAllUsersForContest(
          point.contestId
        );

        // Create the participants table HTML
        let participantsHTML = "";
        if (contestParticipants.length > 0) {
          participantsHTML = `
            <div class="cf-tooltip-participants">
              <div class="cf-tooltip-section-title">Participants</div>
              <table class="cf-tooltip-table">
                <tr>
                  <th>Handle</th>
                  <th>Rating</th>
                  <th>Change</th>
                </tr>
          `;

          contestParticipants.forEach((user) => {
            const userChangeClass =
              user.ratingChange >= 0 ? "positive" : "negative";
            const userChangeSign = user.ratingChange >= 0 ? "+" : "";

            participantsHTML += `
              <tr>
                <td>
                  <div class="cf-tooltip-user">
                    <div style="width: 8px; height: 8px; background-color: ${user.color}; margin-right: 5px; border-radius: 50%;"></div>
                    ${user.handle}
                  </div>
                </td>
                <td>${user.newRating}</td>
                <td class="${userChangeClass}">${userChangeSign}${user.ratingChange}</td>
              </tr>
            `;
          });

          participantsHTML += `
              </table>
            </div>
          `;
        }

        // Force tooltip to be visible with !important flags
        this.tooltip.setAttribute(
          "style",
          `
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          left: ${tooltipX}px !important;
          top: ${tooltipY}px !important;
          pointer-events: auto !important;
          background-color: var(--tooltip-bg, rgba(255, 255, 255, 0.98)) !important;
          z-index: 999999 !important;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3) !important;
          position: fixed !important;
          transform: none !important;
        `
        );

        // Force a reflow to ensure the tooltip is displayed
        setTimeout(() => {
          this.tooltip.style.opacity = "1";
        }, 0);

        // Get contest info from the first participant (all should have the same contest info)
        const contestInfo =
          contestParticipants.length > 0 ? contestParticipants[0] : point;

        // Set tooltip content
        this.tooltip.innerHTML = `
          <div class="cf-tooltip-title">${
            contestInfo.contestName || "Contest"
          }</div>
          <div class="cf-tooltip-date">
            ${contestInfo.date.toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </div>
          <div class="cf-tooltip-section-title">Selected User</div>
          <div class="cf-tooltip-handle">
            <div style="width: 10px; height: 10px; background-color: ${
              dataset.borderColor
            }; margin-right: 5px; border-radius: 50%;"></div>
            ${dataset.label}
          </div>
          <div class="cf-tooltip-rating">Rating: ${point.y}</div>
          <div>Old Rating: ${point.oldRating}</div>
          <div>Rank: ${
            point.rank ? `#${point.rank.toLocaleString()}` : "N/A"
          }</div>
          <div>
            <span>Change: </span>
            <span class="cf-tooltip-change ${changeClass}">${changeSign}${ratingChange}</span>
          </div>
          <div>Contest ID: ${point.contestId || "N/A"}</div>
          ${participantsHTML}
        `;

        // Add event listener to close tooltip when clicking outside
        const closeTooltip = (event) => {
          if (
            !this.tooltip.contains(event.target) &&
            event.target !== this.canvas
          ) {
            this.tooltip.setAttribute("style", "display: none !important;");
            document.removeEventListener("click", closeTooltip);
          }
        };
        document.addEventListener("click", closeTooltip);

        // Highlight the point
        this.render();
        this.highlightPoint(point, dataset.borderColor);
      } else {
        this.tooltip.setAttribute("style", "display: none !important;");
        this.render();
      }
    }

    highlightPoint(point, color) {
      const ctx = this.ctx;
      const x = this.toCanvasX(point.x);
      const y = this.toCanvasY(point.y);

      // Chart.js style highlight
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Add a subtle border
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // drawRatingBands() {
    //   const ctx = this.ctx;
    //   const width = this.canvas.width - this.padding.left - this.padding.right;
    // }

    render() {
      const { ctx, canvas } = this;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      this.calculateBounds();

      if (!this.xMin || !this.xMax || !this.yMin || !this.yMax) {
        // No data to display
        ctx.font = "15px Arial";
        ctx.fillStyle = "#888";
        ctx.textAlign = "center";
        ctx.fillText("No data to display", canvas.width / 2, canvas.height / 2);
        return;
      }

      // Draw rating bands background
      // this.drawRatingBands();

      // No background color or borders for a clean Chart.js look
      const chartLeft = this.padding.left; // Used for label positioning

      // Draw axes - very subtle for Chart.js look
      ctx.strokeStyle = "#eee";
      ctx.lineWidth = 0.5;

      // Draw y-axis line
      ctx.beginPath();
      ctx.moveTo(chartLeft, this.padding.top);
      ctx.lineTo(chartLeft, canvas.height - this.padding.bottom);
      ctx.stroke();

      // Draw x-axis line
      ctx.beginPath();
      ctx.moveTo(chartLeft, canvas.height - this.padding.bottom);
      ctx.lineTo(
        canvas.width - this.padding.right,
        canvas.height - this.padding.bottom
      );
      ctx.stroke();

      // Draw y-axis grid and labels
      const yStep = Math.ceil((this.yMax - this.yMin) / 5 / 100) * 100;
      ctx.textAlign = "right";
      ctx.font = "12px Arial";
      ctx.fillStyle = "#666";

      for (
        let y = Math.ceil(this.yMin / yStep) * yStep;
        y <= this.yMax;
        y += yStep
      ) {
        const canvasY = this.toCanvasY(y);

        // Skip if the label would go outside the chart area
        if (canvasY < this.padding.top) continue;

        // No grid lines for Chart.js-like appearance

        // Label
        ctx.fillText(y, chartLeft - 8, canvasY + 4);
      }

      // Draw y-axis title - Chart.js style
      ctx.save();
      ctx.translate(15, canvas.height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.font = "12px Arial";
      ctx.fillStyle = "#666";
      ctx.fillText("Rating", 0, 0);
      ctx.restore();

      // Draw x-axis labels only (no grid)
      const timeRange = this.xMax.getTime() - this.xMin.getTime();
      // Adjust step based on time range
      let xStep = 2; // Default to 2 months
      if (timeRange > 3 * 365 * 24 * 60 * 60 * 1000) {
        // More than 3 years
        xStep = 6; // Show every 6 months
      } else if (timeRange > 365 * 24 * 60 * 60 * 1000) {
        // More than 1 year
        xStep = 3; // Show every 3 months
      }

      const startDate = new Date(this.xMin);
      startDate.setDate(1);

      ctx.textAlign = "center";
      let currentDate = new Date(startDate);

      while (currentDate <= this.xMax) {
        const canvasX = this.toCanvasX(currentDate);

        // No grid lines for Chart.js-like appearance

        // Label - only if there's enough space
        if (currentDate.getMonth() % xStep === 0) {
          ctx.fillText(
            this.formatDate(currentDate),
            canvasX,
            canvas.height - this.padding.bottom + 20
          );
        }

        // Move to next step
        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      // Draw x-axis title - Chart.js style
      ctx.font = "12px Arial";
      ctx.fillStyle = "#666";
      ctx.fillText("Date", canvas.width / 2, canvas.height - 15);

      // Draw data lines with Chart.js style
      ctx.lineWidth = 2; // Thinner lines like Chart.js

      // Draw lines first (so points appear on top)
      this.datasets.forEach((dataset) => {
        if (dataset.hidden || dataset.data.length === 0) return;

        // Draw line
        ctx.beginPath();

        dataset.data.forEach((point, i) => {
          const x = this.toCanvasX(point.x);
          const y = this.toCanvasY(point.y);

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });

        // Add slight curve to lines for Chart.js look
        ctx.strokeStyle = dataset.borderColor;
        ctx.stroke();
      });

      // Then draw all points
      this.datasets.forEach((dataset) => {
        if (dataset.hidden || dataset.data.length === 0) return;

        // Draw points
        dataset.data.forEach((point) => {
          const x = this.toCanvasX(point.x);
          const y = this.toCanvasY(point.y);

          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2); // Smaller points like Chart.js
          ctx.fillStyle = dataset.borderColor;
          ctx.fill();
          ctx.lineWidth = 2; // Reset line width
        });
      });
    }

    destroy() {
      // Clean up event listeners
      this.canvas.removeEventListener("mousemove", this.handleMouseMoveEvent);
      window.removeEventListener("resize", this.handleResizeEvent);
    }
  }

  async function updateGraph() {
    if (window.cfChartInstance) {
      window.cfChartInstance.destroy();
      window.cfChartInstance = null;
    }

    const datasets = [];
    for (let i = 0; i < activeHandles.length; i++) {
      const handle = activeHandles[i];
      try {
        const points = await fetchUserRating(handle);
        datasets.push({
          label: handle,
          data: points,
          borderColor: COLORS[i % COLORS.length],
          backgroundColor: COLORS[i % COLORS.length],
          hidden: false,
        });
      } catch (e) {
        showWarning(`⚠️ User '${handle}' not found or API error`);
        activeHandles = activeHandles.filter((h) => h !== handle);
      }
    }

    renderHandleBadges(updateGraph);

    if (datasets.length > 0) {
      window.cfChartInstance = new EnhancedChart("cf-rating-chart", datasets);
    }
  }

  async function main() {
    const mainUser = getHandleFromURL();
    activeHandles.push(mainUser);

    injectUI();
    renderHandleBadges(updateGraph);

    const input = document.getElementById("cf-handle-input");
    const addBtn = document.getElementById("cf-add-handle");

    const addHandle = () => {
      const newHandle = input.value.trim();
      if (newHandle) {
        if (!activeHandles.includes(newHandle)) {
          if (activeHandles.length < 7) {
            // Limit to 7 users for performance and readability
            activeHandles.push(newHandle);
            updateGraph();
          } else {
            showWarning("⚠️ Maximum 7 handles allowed for better readability");
          }
        } else {
          showWarning("⚠️ This handle is already added");
        }
      }
      input.value = "";
    };

    addBtn.onclick = addHandle;
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") addHandle();
    });

    await updateGraph();
  }

  // The main function is now called from the browser.storage.sync.get callback at the top of the file
  // Only execute if we're on a Codeforces profile page
  if (!window.location.pathname.includes("/profile/")) {
    console.log(
      "Not on a Codeforces profile page, skipping graph initialization"
    );
    return;
  }
})();
