// ==UserScript==
// @name         CSES Website Logo
// @namespace    http://tampermonkey.net/
// @version      2024-09-28
// @description  try to take over the world!
// @author       Prakhar Bhandari
// @match        https://cses.fi/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=cses.fi
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // Your code here...
  function addFavicon(url) {
    let link = document.querySelector("link[rel*='icon']");
    if (link) {
      link.remove();
    }

    link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/png";
    link.href = url;
    document.getElementsByTagName("head")[0].appendChild(link);
  }

  addFavicon("https://cses.fi/logo.png");
})();
