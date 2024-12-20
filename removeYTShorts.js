// ==UserScript==
// @name         Remove YouTube Shorts from page
// @namespace    https://github.com/hallzy
// @version      0.6
// @description  Removes YouTube Shorts Videos and related content from your current page.
// @author       Steven Hall (updated by Prakhar Bhandari)
// @match        http://*.youtube.com/*
// @match        https://*.youtube.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        none
// ==/UserScript==

(() => {
  const removeShorts = () => {
    Array.from(document.querySelectorAll(`a[href^="/shorts"]`)).forEach((a) => {
      let parent = a.parentElement;
      while (
        parent &&
        (!parent.tagName.startsWith("YTD-") ||
          parent.tagName === "YTD-THUMBNAIL")
      ) {
        parent = parent.parentElement;
      }
      if (parent) {
        parent.remove();
      }
    });

    Array.from(document.querySelectorAll(".title")).forEach((a) => {
      if (a.textContent.includes("Shorts")) {
        let parent = a.parentElement;
        if (parent) {
          parent.remove();
        }
      }
    });

    Array.from(document.querySelectorAll("#title")).forEach((a) => {
      if (a.textContent.includes("Shorts")) {
        let parent = a.parentElement;
        if (parent) {
          parent.remove();
        }
      }
    });

    Array.from(document.querySelectorAll("#endpoint")).forEach((a) => {
      if (a.title.includes("Shorts")) {
        let parent = a.parentElement;
        if (parent) {
          parent.remove();
        }
      }
    });

    Array.from(document.querySelectorAll("#dismissable")).forEach((a) => {
      let parent = a.parentElement;
      if (parent) {
        parent.remove();
      }
    });

    Array.from(document.querySelectorAll("[is-shorts]")).forEach((element) => {
      element.remove();
    });
  };

  const observer = new MutationObserver(removeShorts);
  observer.observe(document, {
    childList: true,
    subtree: true,
  });

  removeShorts();
})();
