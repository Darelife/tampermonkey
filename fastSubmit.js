// // ==UserScript==
// // @name         Append Custom Submission Form to Bottom with Submit
// // @namespace    http://tampermonkey.net/
// // @version      1.5
// // @description  Appends a custom submission table with pasting and upload options to the bottom of Codeforces pages, with proper redirection after submission based on the page type. Auto-fills the problem name.
// // @author       You
// // @match        https://codeforces.com/contest/*
// // @match        https://codeforces.com/problemset/problem/*
// // @grant        none
// // ==/UserScript==

// (function () {
//   "use strict";

//   // Wait for the DOM to load
//   window.addEventListener("load", function () {
//     console.log("Script loaded");

//     // Determine if this is a problemset or contest link
//     const isProblemset = window.location.pathname.startsWith(
//       "/problemset/problem"
//     );
//     const isContest = window.location.pathname.startsWith("/contest");

//     // Extract problem index and contest ID (if applicable)
//     const urlParts = window.location.pathname.split("/");
//     const problemIndex = urlParts[urlParts.length - 1];
//     const contestId = isContest ? urlParts[2] : null;

//     // Remove the existing form if it exists
//     const existingForm = document.querySelector("table.table-form");
//     if (existingForm) {
//       existingForm.remove();
//     }

//     // Define your custom table HTML
//     const customTableHTML = `
//         <table class="table-form" style="width: 90%; margin-top: 20px;">
//             <tbody>
//                 <tr>
//                     <td class="field-name">Problem:</td>
//                     <td>
//                         <input type="text" id="problemInput" value="${problemIndex}" readonly style="width: 300px; background-color: #f9f9f9; border: none;" />
//                     </td>
//                 </tr>
//                 <tr>
//                     <td class="field-name">Language:</td>
//                     <td>
//                         <select style="width: 300px;" name="programTypeId" id="languageSelector">
//                             <option value="43">GNU GCC C11 5.1.0</option>
//                             <option value="54" selected="selected">GNU G++17 7.3.0</option>
//                             <option value="89">GNU G++20 13.2 (64 bit, winlibs)</option>
//                             <option value="91">GNU G++23 14.2 (64 bit, msys2)</option>
//                             <option value="65">C# 8, .NET Core 3.1</option>
//                             <option value="79">C# 10, .NET SDK 6.0</option>
//                             <option value="31">Python 3.8.10</option>
//                             <option value="75">Rust 1.75.0 (2021)</option>
//                         </select>
//                     </td>
//                 </tr>
//                 <tr class="programSourceTr">
//                     <td class="field-name">Source code:</td>
//                     <td style="padding-bottom: 0.7em;" class="aceEditorTd">
//                         <textarea id="sourceCodeTextarea" name="source" style="width: 100%; height: 370px;"></textarea>
//                     </td>
//                 </tr>
//                 <tr>
//                     <td class="field-name">Or choose file:</td>
//                     <td>
//                         <input name="sourceFile" type="file" id="sourceFileInput" value="">
//                     </td>
//                 </tr>
//                 <tr>
//                     <td colspan="2">
//                         <div style="text-align: center;">
//                             <input class="submit" type="submit" id="submitButton" value="Submit">
//                         </div>
//                     </td>
//                 </tr>
//             </tbody>
//         </table>`;

//     // Append the custom table to the bottom of the page
//     const mainContent =
//       document.querySelector(".problem-statement") || document.body;
//     if (mainContent) {
//       const container = document.createElement("div");
//       container.innerHTML = customTableHTML;
//       mainContent.appendChild(container);
//     }

//     // Handle form submission
//     const submitButton = document.getElementById("submitButton");
//     if (submitButton) {
//       submitButton.addEventListener("click", function (event) {
//         event.preventDefault();

//         // Prepare form data
//         const languageId = document.getElementById("languageSelector").value;
//         const sourceCode = document.getElementById("sourceCodeTextarea").value;
//         const sourceFile = document.getElementById("sourceFileInput").files[0];

//         const formData = new FormData();
//         formData.append("submittedProblemIndex", problemIndex);
//         formData.append("programTypeId", languageId);
//         formData.append("csrf_token", "95c8ee52ca70bc158e58e7ad88236aad");
//         if (sourceFile) {
//           formData.append("sourceFile", sourceFile);
//         } else {
//           formData.append("source", sourceCode);
//         }

//         // Submit the form and redirect to the appropriate page
//         fetch(window.location.href, {
//           method: "POST",
//           body: formData,
//         })
//           .then((response) => {
//             if (!response.ok) {
//               throw new Error(`HTTP error! status: ${response.status}`);
//             }
//             return response.text();
//           })
//           .then(() => {
//             console.log("Form submitted successfully");
//             if (isProblemset) {
//               window.location.href =
//                 "https://codeforces.com/problemset/status?my=on";
//             } else if (isContest) {
//               window.location.href = `https://codeforces.com/contest/${contestId}/my`;
//             }
//           })
//           .catch((error) => {
//             console.error("Error submitting form:", error);
//           });
//       });
//     }
//   });
// })();
