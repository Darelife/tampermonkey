// ==UserScript==
// @name         Codeforces Save Questions
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Save Codeforces problems to custom lists and view them in your profile with enhanced management features.
// @author       Prakhar Bhandari
// @icon         https://www.google.com/s2/favicons?sz=64&domain=codeforces.com
// @match        https://codeforces.com/problemset/problem/*/*
// @match        https://codeforces.com/contest/*/problem/*
// @match        https://codeforces.com/profile/*
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function () {
  "use strict";

  chrome.storage.sync.get("saveQuestionsEnabled", (settings) => {
    if (settings.saveQuestionsEnabled) {
      const currentUrl = window.location.href;
      const storageKey = "cf_saved_problems";

      let styles = `
        .cf-modal-overlay {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            background: rgba(0, 0, 0, 0.7) !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            z-index: 999999 !important;
            backdrop-filter: blur(3px) !important;
        }
        .cf-modal {
            position: relative !important;
            background: #121212 !important;
            padding: 20px !important;
            border-radius: 12px !important;
            min-width: 300px !important;
            max-width: 500px !important;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
            z-index: 1000000 !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        .cf-modal * {
            font-family: 'Inter', Arial, sans-serif !important;
            color: #E0E0E0 !important;
        }
        .cf-modal h3 {
            margin-top: 0 !important;
            margin-bottom: 15px !important;
            color: #FFFFFF !important;
            font-size: 18px !important;
            font-weight: 600 !important;
        }
        .cf-modal-lists {
            max-height: 180px !important;
            overflow-y: auto !important;
            margin-bottom: 15px !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            padding: 8px !important;
            border-radius: 8px !important;
            background: rgba(255, 255, 255, 0.05) !important;
        }
        .cf-modal-list-item {
            display: flex !important;
            align-items: center !important;
            margin-bottom: 6px !important;
            padding: 2px 4px !important;
            border-radius: 4px !important;
            transition: background 0.2s !important;
        }
        .cf-modal-list-item:hover {
            background: rgba(255, 255, 255, 0.1) !important;
        }
        .cf-modal-list-item label {
            margin-left: 8px !important;
            color: #E0E0E0 !important;
            cursor: pointer !important;
            font-size: 13.5px !important;
        }
        .cf-modal-actions {
            display: flex !important;
            justify-content: flex-end !important;
            gap: 8px !important;
            margin-top: 15px !important;
        }
        .cf-btn {
            padding: 8px 16px !important;
            border: none !important;
            border-radius: 6px !important;
            cursor: pointer !important;
            font-size: 13.5px !important;
            font-weight: 500 !important;
            transition: all 0.2s ease !important;
            position: relative !important;
            overflow: hidden !important;
            text-transform: uppercase !important;
            letter-spacing: 0.5px !important;
        }
        .cf-btn::after {
            content: '' !important;
            position: absolute !important;
            width: 100% !important;
            height: 100% !important;
            top: 0 !important;
            left: 0 !important;
            background: linear-gradient(rgba(255, 255, 255, 0.1), transparent) !important;
            opacity: 0 !important;
            transition: opacity 0.2s !important;
        }
        .cf-btn:hover::after {
            opacity: 1 !important;
        }
        .cf-btn-primary {
            background: #4CAF50 !important;
            color: white !important;
            box-shadow: 0 2px 8px rgba(74, 137, 220, 0.3) !important;
        }
        .cf-btn-primary:hover {
            transform: translateY(-1px) !important;
            box-shadow: 0 4px 12px rgba(74, 137, 220, 0.4) !important;
        }
        .cf-btn-secondary {
            background: rgba(255, 255, 255, 0.08) !important;
            color: #E0E0E0 !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        .cf-btn-secondary:hover {
            background: rgba(255, 255, 255, 0.12) !important;
            transform: translateY(-1px) !important;
        }
        .cf-new-list {
            margin-bottom: 15px !important;
        }
        .cf-new-list input {
            width: calc(100% - 16px) !important;
            padding: 8px !important;
            margin-bottom: 10px !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            border-radius: 6px !important;
            font-size: 13.5px !important;
            background: rgba(255, 255, 255, 0.05) !important;
            color: #E0E0E0 !important;
            transition: all 0.2s !important;
        }
        .cf-new-list input:focus {
            outline: none !important;
            border-color: #4A89DC !important;
            background: rgba(255, 255, 255, 0.08) !important;
            box-shadow: 0 0 0 3px rgba(74, 137, 220, 0.2) !important;
        }
        .cf-list-management {
            margin-top: 20px !important;
            padding: 15px !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            border-radius: 8px !important;
            background: #121212 !important;
        }
        .cf-list-actions {
            display: flex !important;
            gap: 8px !important;
            margin-bottom: 10px !important;
        }
        .cf-problem-list {
            margin: 0 !important;
            padding-left: 16px !important;
            list-style-type: disc !important;
        }
        .cf-problem-item {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            margin-bottom: 4px !important;
            padding: 4px 6px !important;
            border-radius: 4px !important;
            transition: background 0.2s !important;
        }
        .cf-problem-item:hover {
            background: #1E1E1E !important;
        }
        .cf-list-header {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            margin-bottom: 8px !important;
            padding: 6px 8px !important;
            background: #1A1A1A !important;
            border-radius: 6px !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        .cf-problem-item a {
            color: #5D9CEC !important;
            text-decoration: none !important;
            font-size: 13.5px !important;
            transition: color 0.2s !important;
        }
        .cf-problem-item a:hover {
            color: #4A89DC !important;
        }
        /* Scrollbar Styling */
        .cf-modal-lists::-webkit-scrollbar {
            width: 6px !important;
        }
        .cf-modal-lists::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05) !important;
            border-radius: 3px !important;
        }
        .cf-modal-lists::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2) !important;
            border-radius: 3px !important;
        }
        .cf-modal-lists::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.3) !important;
        }
    `;

      if (
        getComputedStyle(document.body).backgroundColor == "rgb(255, 255, 255)"
      ) {
        // Add CSS styles for the modal with !important to override site styles
        styles = `
            .cf-modal-overlay {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                background: rgba(0, 0, 0, 0.5) !important;
                display: flex !important;
                justify-content: center !important;
                align-items: center !important;
                z-index: 999999 !important;
            }
            .cf-modal {
                position: relative !important;
                background: white !important;
                padding: 20px !important;
                border-radius: 8px !important;
                min-width: 300px !important;
                max-width: 500px !important;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1) !important;
                z-index: 1000000 !important;
            }
            .cf-modal * {
                font-family: Arial, sans-serif !important;
            }
            .cf-modal h3 {
                margin-top: 0 !important;
                margin-bottom: 15px !important;
                color: #333 !important;
                font-size: 18px !important;
            }
            .cf-modal-lists {
                max-height: 200px !important;
                overflow-y: auto !important;
                margin-bottom: 15px !important;
                border: 1px solid #eee !important;
                padding: 10px !important;
                border-radius: 4px !important;
            }
            .cf-modal-list-item {
                display: flex !important;
                align-items: center !important;
                margin-bottom: 8px !important;
            }
            .cf-modal-list-item label {
                margin-left: 8px !important;
                color: #333 !important;
                cursor: pointer !important;
            }
            .cf-modal-actions {
                display: flex !important;
                justify-content: flex-end !important;
                gap: 10px !important;
                margin-top: 15px !important;
            }
            .cf-btn {
                padding: 8px 15px !important;
                border: none !important;
                border-radius: 4px !important;
                cursor: pointer !important;
                font-size: 14px !important;
                transition: background-color 0.2s !important;
            }
            .cf-btn-primary {
                background: #4CAF50 !important;
                color: white !important;
            }
            .cf-btn-primary:hover {
                background: #45a049 !important;
            }
            .cf-btn-secondary {
                background: #f0f0f0 !important;
                color: #333 !important;
            }
            .cf-btn-secondary:hover {
                background: #e0e0e0 !important;
            }
            .cf-new-list {
                margin-bottom: 15px !important;
            }
            .cf-new-list input {
                width: calc(100% - 10px) !important;
                padding: 8px !important;
                margin-bottom: 10px !important;
                border: 1px solid #ddd !important;
                border-radius: 4px !important;
                font-size: 14px !important;
            }
            .cf-new-list input:focus {
                outline: none !important;
                border-color: #4CAF50 !important;
            }
            .cf-list-management {
                margin-top: 20px !important;
                padding: 15px !important;
                border: 1px solid #eee !important;
                border-radius: 4px !important;
                background: white !important;
            }
            .cf-list-actions {
                display: flex !important;
                gap: 10px !important;
                margin-bottom: 10px !important;
            }
            .cf-problem-list {
                margin: 0 !important;
                padding-left: 20px !important;
                list-style-type: disc !important;
            }
            .cf-problem-item {
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                margin-bottom: 5px !important;
                padding: 5px !important;
            }
            .cf-problem-item:hover {
                background: #f5f5f5 !important;
            }
            .cf-list-header {
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                margin-bottom: 10px !important;
                padding: 5px !important;
                background: #f8f9fa !important;
                border-radius: 4px !important;
            }
        `;
      }

      function addStyles() {
        const styleSheet = document.createElement("style");
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
      }

      function createModal(problemId) {
        // const savedData = GM_getValue(storageKey, {});
        chrome.storage.sync.get([storageKey], (result) => {
          const savedData = result[storageKey] || {};

          const modal = document.createElement("div");
          modal.className = "cf-modal-overlay";

          const modalContent = document.createElement("div");
          modalContent.className = "cf-modal";

          modalContent.innerHTML = `
                <h3>Save Problem to Lists</h3>
                <div class="cf-new-list">
                    <input type="text" placeholder="Create new list..." id="newListInput">
                    <button class="cf-btn cf-btn-primary" id="createListBtn">Create New List</button>
                </div>
                <div class="cf-modal-lists">
                    ${Object.keys(savedData)
                      .map(
                        (listName) => `
                        <div class="cf-modal-list-item">
                            <input type="checkbox" id="list-${listName}" value="${listName}"
                                ${
                                  savedData[listName].includes(problemId)
                                    ? "checked"
                                    : ""
                                }>
                            <label for="list-${listName}">${listName}</label>
                        </div>
                    `
                      )
                      .join("")}
                </div>
                <div class="cf-modal-actions">
                    <button class="cf-btn cf-btn-secondary" id="cancelBtn">Cancel</button>
                    <button class="cf-btn cf-btn-primary" id="saveBtn">Save</button>
                </div>
            `;

          modalContent.addEventListener("click", (e) => e.stopPropagation());

          modal.addEventListener("click", (e) => {
            if (e.target === modal) {
              modal.remove();
            }
          });

          modal.appendChild(modalContent);
          document.body.appendChild(modal);

          modal
            .querySelector("#cancelBtn")
            .addEventListener("click", () => modal.remove());

          modal
            .querySelector("#createListBtn")
            .addEventListener("click", () => {
              const input = modal.querySelector("#newListInput");
              const listName = input.value.trim();
              if (listName) {
                savedData[listName] = [];
                chrome.storage.sync.set({ [storageKey]: savedData }, () => {
                  modal.remove();
                  createModal(problemId);
                });
              }
            });

          modal.querySelector("#saveBtn").addEventListener("click", () => {
            const checkedLists = modal.querySelectorAll(
              'input[type="checkbox"]:checked'
            );
            checkedLists.forEach((checkbox) => {
              const listName = checkbox.value;
              if (!savedData[listName]) {
                savedData[listName] = [];
              }
              if (!savedData[listName].includes(problemId)) {
                savedData[listName].push(problemId);
              }
            });

            const uncheckedLists = modal.querySelectorAll(
              'input[type="checkbox"]:not(:checked)'
            );
            uncheckedLists.forEach((checkbox) => {
              const listName = checkbox.value;
              if (savedData[listName]) {
                savedData[listName] = savedData[listName].filter(
                  (id) => id !== problemId
                );
              }
            });

            chrome.storage.sync.set({ [storageKey]: savedData }, () => {
              modal.remove();
            });
            modal.remove();
          });

          setTimeout(() => {
            modal.querySelector("#newListInput").focus();
          }, 0);
        });
      }

      function addSaveButton() {
        // Fix problem ID extraction
        const urlParts = window.location.pathname.split("/");
        let problemId;

        if (urlParts.includes("contest")) {
          // Format: /contest/2063/problem/F1
          const contestId = urlParts[urlParts.indexOf("contest") + 1];
          const problemIndex = urlParts[urlParts.length - 1];
          problemId = `${contestId}/${problemIndex}`;
        } else {
          // Format: /problemset/problem/2063/F1
          problemId = urlParts.slice(-2).join("/");
        }

        const container = document.querySelector(".title");
        if (!container) return;

        const button = document.createElement("button");
        button.innerText = "Save to List";
        button.className = "cf-btn cf-btn-primary";
        button.style.marginLeft = "10px";

        button.addEventListener("click", () => createModal(problemId));
        container.appendChild(button);
      }

      function displaySavedProblems() {
        const profileContainer = document.querySelector(".userbox");
        if (!profileContainer) return;
        const username = document
          .querySelector(".info .main-info h1")
          .innerText.trim();
        const loggedInUser = document
          .querySelector(".lang-chooser a[href*='/profile/']")
          .innerText.trim();

        if (username !== loggedInUser) return;

        const section = document.createElement("div");
        section.className = "cf-list-management";

        chrome.storage.sync.get([storageKey], (result) => {
          const savedData = result[storageKey] || {};
          if (Object.keys(savedData).length === 0) return;

          section.innerHTML = `
          <h3>Saved Problems</h3>
          <br />
          <div class="cf-list-actions">
            <button class="cf-btn cf-btn-primary" id="exportBtn">Export Lists</button>
            <button class="cf-btn cf-btn-secondary" id="importBtn">Import Lists</button>
            <input type="file" id="importInput" style="display: none" accept=".json">
          </div>
          <div id="savedLists"></div>
        `;

          const listsContainer = section.querySelector("#savedLists");

          for (const [listName, problems] of Object.entries(savedData)) {
            const listDiv = document.createElement("div");
            listDiv.style.marginBottom = "15px";
            listDiv.innerHTML = `
                    <div class="cf-list-header">
                        <strong>${listName}</strong>
                        <div>
                            <button class="cf-btn cf-btn-secondary add-problem" data-list="${listName}">Add Problem</button>
                            <button class="cf-btn cf-btn-secondary delete-list" data-list="${listName}">Delete List</button>
                        </div>
                    </div>
                    <ul class="cf-problem-list">
                        ${problems
                          .map(
                            (problem) => `
                            <li class="cf-problem-item">
                                <a href="https://codeforces.com/problemset/problem/${problem}" target="_blank">${problem}</a>
                                <button class="cf-btn cf-btn-secondary remove-problem" data-list="${listName}" data-problem="${problem}">Remove</button>
                            </li>
                        `
                          )
                          .join("")}
                    </ul>
                `;
            listsContainer.appendChild(listDiv);
          }
          section.querySelector("#exportBtn").addEventListener("click", () => {
            const dataStr = JSON.stringify(savedData, null, 2);
            const blob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "codeforces_lists.json";
            a.click();
            URL.revokeObjectURL(url);
          });

          const importInput = section.querySelector("#importInput");
          section
            .querySelector("#importBtn")
            .addEventListener("click", () => importInput.click());
          importInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (e) => {
                try {
                  const importedData = JSON.parse(e.target.result);
                  chrome.storage.sync.get([storageKey], (result) => {
                    const existingData = result[storageKey] || {};
                    const mergedData = { ...existingData, ...importedData };
                    chrome.storage.sync.set(
                      { [storageKey]: mergedData },
                      () => {
                        location.reload();
                      }
                    );
                  });
                } catch (err) {
                  alert("Invalid file format");
                }
              };
              reader.readAsText(file);
            }
          });

          section.querySelectorAll(".add-problem").forEach((btn) => {
            btn.addEventListener("click", () => {
              const listName = btn.dataset.list;
              const problemId = prompt("Enter problem ID (e.g., 1234/A):");
              if (problemId) {
                if (!savedData[listName].includes(problemId)) {
                  savedData[listName].push(problemId);
                  chrome.storage.sync.set({ [storageKey]: savedData }, () => {
                    location.reload();
                  });
                }
              }
            });
          });

          section.querySelectorAll(".delete-list").forEach((btn) => {
            btn.addEventListener("click", () => {
              const listName = btn.dataset.list;
              if (confirm(`Delete list "${listName}"?`)) {
                delete savedData[listName];
                chrome.storage.sync.set({ [storageKey]: savedData }, () => {
                  location.reload();
                });
              }
            });
          });

          section.querySelectorAll(".remove-problem").forEach((btn) => {
            btn.addEventListener("click", () => {
              const { list, problem } = btn.dataset;
              savedData[list] = savedData[list].filter((p) => p !== problem);
              chrome.storage.sync.set({ [storageKey]: savedData }, () => {
                location.reload();
              });
            });
          });
          profileContainer.appendChild(section);
        });
      }

      // Initialize
      addStyles();
      if (
        currentUrl.includes("/problemset/problem/") ||
        currentUrl.includes("/contest/")
      ) {
        addSaveButton();
      } else if (currentUrl.includes("/profile/")) {
        displaySavedProblems();
      }
    }
  });
})();
