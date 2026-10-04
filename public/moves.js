(function () {
  "use strict";
  var doc = document,
    root = doc.querySelector("[data-walkthrough-page]");
  var initial = { "move-left": ["a", "b", "c"], "move-right": ["d", "e"] };
  var lists,
    drag = null;
  var box = doc.createElement("section");
  box.id = "move-exercise";
  root.appendChild(box);
  function snapshot() {
    return JSON.parse(JSON.stringify(lists));
  }
  function draw() {
    box.innerHTML = "";
    Object.keys(lists).forEach(function (id) {
      var list = doc.createElement("ul");
      list.id = id;
      list.setAttribute("data-move-list", "");
      lists[id].forEach(function (item) {
        var row = doc.createElement("li");
        row.id = "move-item-" + item;
        row.draggable = true;
        row.setAttribute("data-move-item", item);
        var label = doc.createElement("span");
        label.textContent = item;
        row.appendChild(label);
        list.appendChild(row);
      });
      box.appendChild(list);
    });
  }
  function reset() {
    lists = JSON.parse(JSON.stringify(initial));
    drag = null;
    draw();
  }
  function action(event, source) {
    var target = event.target.closest("[data-move-item]");
    var list = event.target.closest("[data-move-list]");
    return list
      ? {
          item: source,
          list: list.id,
          before: target ? target.getAttribute("data-move-item") : null,
        }
      : null;
  }
  function plan(a) {
    if (!a || !lists[a.list]) throw new Error("missing destination list");
    var from = Object.keys(lists).find(function (id) {
      return lists[id].indexOf(a.item) >= 0;
    });
    if (!from) throw new Error("missing source item");
    if (a.before !== null && lists[a.list].indexOf(a.before) < 0)
      throw new Error("missing destination anchor");
    if (a.item === a.before) return null;
    if (from !== a.list && lists[a.list].length >= 4)
      throw new Error("destination full");
    var next = snapshot();
    next[from] = next[from].filter(function (id) {
      return id !== a.item;
    });
    var index =
      a.before === null ? next[a.list].length : next[a.list].indexOf(a.before);
    next[a.list].splice(index, 0, a.item);
    return JSON.stringify(next) === JSON.stringify(lists) ? null : next;
  }
  function move(a) {
    var next = plan(a);
    if (!next) return false;
    lists = next;
    draw();
    return true;
  }
  function positions(a) {
    var from = Object.keys(lists).find(function (id) {
      return lists[id].indexOf(a.item) >= 0;
    });
    return {
      from: from,
      index: lists[from].indexOf(a.item),
      to: a.list,
      anchor:
        a.before === null
          ? lists[a.list].length
          : lists[a.list].indexOf(a.before),
    };
  }
  function positional(p) {
    var next = snapshot(),
      item = next[p.from].splice(p.index, 1)[0];
    if (item === undefined) throw new Error("missing positional source");
    next[p.to].splice(p.anchor, 0, item);
    lists = next;
    draw();
  }
  box.addEventListener("dragstart", function (e) {
    var item = e.target.closest("[data-move-item]");
    drag = item && item.getAttribute("data-move-item");
  });
  box.addEventListener("dragover", function (e) {
    e.preventDefault();
  });
  box.addEventListener("drop", function (e) {
    e.preventDefault();
    var a = action(e, drag);
    drag = null;
    try {
      move(a);
    } catch (error) {
      box.setAttribute("data-move-error", error.message);
    }
  });
  window.WalkthroughMoves = {
    snapshot: snapshot,
    action: action,
    plan: plan,
    move: move,
    positions: positions,
    positional: positional,
    reset: reset,
  };
  var prior = window.WalkthroughApp.reset;
  window.WalkthroughApp.reset = function () {
    prior.call(window.WalkthroughApp);
    reset();
  };
  reset();
})();
