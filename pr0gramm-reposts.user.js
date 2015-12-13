// ==UserScript==
// @name         pr0gramm-reposts
// @namespace    http://pr0gramm.com/user/Mopsalarm
// @version      1.0.0
// @description  Adds little "repost" markers to the stream
// @author       Mopsalarm
// @match        http://pr0gramm.com/*
// @match        https://pr0gramm.com/*
// @require      https://raw.githubusercontent.com/rapportive-oss/jquery-parsequery/master/jquery.parsequery.js
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
  "use strict";

  jQuery("<style>").appendTo("body").text('\
    @import url(https://fonts.googleapis.com/css?family=Droid+Sans:700); \
    .thumb { \
      position: relative; \
    } \
    .thumb__repost { \
      position: absolute; \
      display: none; \
      top: 0; left: 0; \
      line-height: 128px; \
      color: white; \
      font-size: 1.2em; \
      font-weight: bold; \
      text-align: center; \
      background: rgba(0, 0, 0, 0.7); \
      width: 100%; \
      transition: background 0.5s; \
      font-family: "Droid Sans"; \
    } \
    .thumb__repost:hover { \
      background: rgba(0, 0, 0, 0.2); \
    }')

  var $style = jQuery("<style>").appendTo("body");

  var repostSelectors = {};

  function updateRepostItemIds(repostIds) {
    repostIds.forEach(function (itemId) {
      repostSelectors["#item-" + itemId + " > .thumb__repost"] = true;
    });

    var selectors = [];
    for(var selector in repostSelectors) {
      selectors.push(selector);
    }

    console.log("Using %d repost infos", selectors.length);
    $style.text([selectors.join(","), "{ display: block; }"].join(""));
  }

  jQuery(document).ajaxComplete(function (event, request, settings) {
    var url = settings.url || "";

    // only handle feed requests
    if (url.indexOf("/api/items/get") === -1)
      return;

    // prevent a request-loop
    if (url.indexOf("repost") !== -1)
      return;

    // get the original parameters and add 'repost' to the search query
    var params = jQuery.parseQuery(url.replace(/^.*\?/, "")) || {};
    params.tags = (params.tags || "") + " repost"

    // and add stuff to the css
    jQuery
      .getJSON("/api/items/get", params)
      .then(function(result) {
        var itemIds = result.items.map(function (item) { return item.id });
        updateRepostItemIds(itemIds);
    });
  });

  function buildItemFunction(item) {
    return '<a class="silent thumb" id="item-' + item.id + '" href="' + this.baseURL + item.id + '">' + '<img src="' + item.thumb + '"/><div class="thumb__repost">repost</div></a>';
  }

  var MainOrg = p.View.Stream.Main;
  p.View.Stream.Main = MainOrg.extend({
    buildItem: buildItemFunction
  });

  for (var i = 0; i < p._routes.length; i++) {
    if(p._routes[i].viewClass === MainOrg) {
      console.log("replacing viewClass for " + p._routes[i].rule);
      p._routes[i].viewClass = p.View.Stream.Main;
    }
  }

  // override the current buildItem-function
  p.currentView.buildItem = buildItemFunction;

  // maybe some items already exist, update those once
  jQuery(".thumb:not(.thumb--repost-enhanced)").append('<div class="thumb__repost">repost</div>');

})();
