/**
 * LA-52 mockup interaction layer — plain JS, no framework, so this file is disposable:
 * it exists to make the design legible to scrub through, not to be reused as-is by Prism.
 */
(function () {
  "use strict";

  var DATA = window.MATCH_STORY_MOCK;
  var DURATION = DATA.meta.durationMin;

  // Shape + colour per event kind. Colour alone never carries meaning — see README §Accessibility.
  var KIND_STYLE = {
    CHAMPION_KILL: { shape: "circle", color: "var(--acid-500)", label: "Kill" },
    CHAMPION_SPECIAL_KILL: { shape: "ring", color: "var(--acid-300)", label: "Multi-kill" },
    ELITE_MONSTER_KILL: { shape: "diamond", color: "var(--amber-500)", label: "Objective" },
    BUILDING_KILL: { shape: "square", color: "var(--red-500)", label: "Structure" },
    TURRET_PLATE_DESTROYED: {
      shape: "hollowSquare",
      color: "var(--red-500)",
      label: "Plate",
      op: 0.65,
    },
    WARD_PLACED: { shape: "triangle", color: "var(--teal-500)", label: "Ward placed" },
    WARD_KILL: { shape: "hollowTriangle", color: "var(--teal-500)", label: "Ward cleared" },
  };
  var KIND_ORDER = Object.keys(KIND_STYLE);

  var state = {
    minute: 18,
    playing: false,
    speed: 1,
    activeKinds: new Set(KIND_ORDER),
    timer: null,
  };

  var byMinute = new Map(
    DATA.frames.map(function (f) {
      return [f.minute, f];
    })
  );
  function maxAbsDiff() {
    return DATA.frames.reduce(function (m, f) {
      return Math.max(m, Math.abs(f.teamGoldDiff));
    }, 1);
  }
  var MAXDIFF = maxAbsDiff();

  function activeEvents() {
    return DATA.events.filter(function (e) {
      return state.activeKinds.has(e.kind);
    });
  }
  function eventsAt(minute) {
    return activeEvents().filter(function (e) {
      return e.minute === minute;
    });
  }
  function decay(minute) {
    var age = state.minute - minute;
    return Math.max(0.15, Math.min(1, 1 - age / 6));
  }

  // ── geometry ──────────────────────────────────────────────────────────
  var VB = { w: 900, h: 220, ml: 44, mr: 16, mt: 28, mb: 26 };
  var PW = VB.w - VB.ml - VB.mr,
    PH = VB.h - VB.mt - VB.mb;
  var baseY = VB.mt + PH / 2;
  function xFor(minute) {
    return VB.ml + (minute / DURATION) * PW;
  }
  function yFor(diff) {
    return baseY - (diff / MAXDIFF) * (PH / 2 - 6);
  }

  var svgns = "http://www.w3.org/2000/svg";
  function el(tag, attrs) {
    var n = document.createElementNS(svgns, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  function shapeNode(kind, cx, cy, r, opacity) {
    var s = KIND_STYLE[kind];
    var g = el("g", {
      opacity: (s.op || 1) * opacity,
      transform: "translate(" + cx + "," + cy + ")",
    });
    var fillProps = { fill: s.color };
    var strokeProps = { fill: "none", stroke: s.color, "stroke-width": 1.4 };
    switch (s.shape) {
      case "circle":
        g.appendChild(el("circle", Object.assign({ r: r }, fillProps)));
        break;
      case "ring":
        g.appendChild(el("circle", Object.assign({ r: r }, fillProps)));
        g.appendChild(el("circle", Object.assign({ r: r + 2.5 }, strokeProps)));
        break;
      case "diamond":
        g.appendChild(
          el(
            "polygon",
            Object.assign(
              {
                points: pt([
                  [0, -r],
                  [r, 0],
                  [0, r],
                  [-r, 0],
                ]),
              },
              fillProps
            )
          )
        );
        break;
      case "square":
        g.appendChild(
          el("rect", Object.assign({ x: -r, y: -r, width: r * 2, height: r * 2 }, fillProps))
        );
        break;
      case "hollowSquare":
        g.appendChild(
          el("rect", Object.assign({ x: -r, y: -r, width: r * 2, height: r * 2 }, strokeProps))
        );
        break;
      case "triangle":
        g.appendChild(
          el(
            "polygon",
            Object.assign(
              {
                points: pt([
                  [0, -r],
                  [r, r],
                  [-r, r],
                ]),
              },
              fillProps
            )
          )
        );
        break;
      case "hollowTriangle":
        g.appendChild(
          el(
            "polygon",
            Object.assign(
              {
                points: pt([
                  [0, -r],
                  [r, r],
                  [-r, r],
                ]),
              },
              strokeProps
            )
          )
        );
        break;
    }
    return g;
  }
  function pt(pairs) {
    return pairs
      .map(function (p) {
        return p[0] + "," + p[1];
      })
      .join(" ");
  }

  // ── chart ─────────────────────────────────────────────────────────────
  var chartSvg = document.getElementById("story-chart");
  function renderChart() {
    while (chartSvg.firstChild) chartSvg.removeChild(chartSvg.firstChild);
    chartSvg.setAttribute("viewBox", "0 0 " + VB.w + " " + VB.h);

    var clipTop = "clipTop",
      clipBot = "clipBot";
    var defs = el("defs", {});
    var cTop = el("clipPath", { id: clipTop });
    cTop.appendChild(el("rect", { x: VB.ml, y: 0, width: PW, height: baseY }));
    var cBot = el("clipPath", { id: clipBot });
    cBot.appendChild(el("rect", { x: VB.ml, y: baseY, width: PW, height: VB.h - baseY }));
    defs.appendChild(cTop);
    defs.appendChild(cBot);
    chartSvg.appendChild(defs);

    // minute gridlines every 5m
    for (var m = 0; m <= DURATION; m += 5) {
      var gx = xFor(m);
      chartSvg.appendChild(
        el("line", {
          x1: gx,
          x2: gx,
          y1: VB.mt,
          y2: VB.h - VB.mb,
          stroke: "rgba(255,255,255,0.05)",
        })
      );
      var lbl = el("text", {
        x: gx,
        y: VB.h - 8,
        "font-size": 9,
        fill: "var(--fg-4)",
        "text-anchor": "middle",
        "font-family": "JetBrains Mono, monospace",
      });
      lbl.textContent = m + "m";
      chartSvg.appendChild(lbl);
    }
    // zero baseline
    chartSvg.appendChild(
      el("line", {
        x1: VB.ml,
        x2: VB.w - VB.mr,
        y1: baseY,
        y2: baseY,
        stroke: "var(--line-3)",
        "stroke-dasharray": "3 3",
      })
    );
    var blueLbl = el("text", {
      x: VB.w - VB.mr,
      y: VB.mt + 10,
      "font-size": 9,
      fill: "var(--blue-500)",
      "text-anchor": "end",
      "font-family": "JetBrains Mono, monospace",
    });
    blueLbl.textContent = "BLUE AHEAD";
    chartSvg.appendChild(blueLbl);
    var redLbl = el("text", {
      x: VB.w - VB.mr,
      y: VB.h - VB.mb - 4,
      "font-size": 9,
      fill: "var(--red-500)",
      "text-anchor": "end",
      "font-family": "JetBrains Mono, monospace",
    });
    redLbl.textContent = "RED AHEAD";
    chartSvg.appendChild(redLbl);

    // gold-diff area, split blue/red by sign via two clipped fills of the same path
    var pts = DATA.frames.map(function (f) {
      return [xFor(f.minute), yFor(f.teamGoldDiff)];
    });
    var areaPath =
      "M" +
      pts
        .map(function (p) {
          return p[0] + "," + p[1];
        })
        .join(" L") +
      " L" +
      xFor(DURATION) +
      "," +
      baseY +
      " L" +
      xFor(0) +
      "," +
      baseY +
      " Z";
    chartSvg.appendChild(
      el("path", {
        d: areaPath,
        fill: "var(--blue-500)",
        opacity: 0.16,
        "clip-path": "url(#" + clipTop + ")",
      })
    );
    chartSvg.appendChild(
      el("path", {
        d: areaPath,
        fill: "var(--red-500)",
        opacity: 0.16,
        "clip-path": "url(#" + clipBot + ")",
      })
    );
    var linePath =
      "M" +
      pts
        .map(function (p) {
          return p[0] + "," + p[1];
        })
        .join(" L");
    chartSvg.appendChild(
      el("path", { d: linePath, fill: "none", stroke: "var(--fg-1)", "stroke-width": 1.5 })
    );

    // clustered event ticks along the top lane
    var byMin = {};
    activeEvents().forEach(function (e) {
      (byMin[e.minute] = byMin[e.minute] || []).push(e);
    });
    Object.keys(byMin).forEach(function (mk) {
      var mm = Number(mk),
        list = byMin[mk];
      var tx = xFor(mm),
        ty = 16;
      var g = shapeNode(list[0].kind, tx, ty, 4, mm <= state.minute ? 1 : 0.3);
      g.style.cursor = "pointer";
      g.addEventListener("click", function () {
        setMinute(mm);
      });
      chartSvg.appendChild(g);
      if (list.length > 1) {
        var badge = el("text", {
          x: tx + 7,
          y: ty - 5,
          "font-size": 8.5,
          fill: "var(--fg-2)",
          "font-family": "JetBrains Mono, monospace",
        });
        badge.textContent = "×" + list.length;
        chartSvg.appendChild(badge);
      }
    });

    // playhead
    var px = xFor(state.minute);
    chartSvg.appendChild(
      el("line", {
        x1: px,
        x2: px,
        y1: VB.mt - 6,
        y2: VB.h - VB.mb,
        stroke: "var(--acid-500)",
        "stroke-width": 1.5,
      })
    );
    chartSvg.appendChild(
      el("polygon", {
        points: pt([
          [px - 5, VB.mt - 6],
          [px + 5, VB.mt - 6],
          [px, VB.mt + 2],
        ]),
        fill: "var(--acid-500)",
      })
    );
  }

  // ── readout ───────────────────────────────────────────────────────────
  function renderReadout() {
    var f = byMinute.get(state.minute);
    var diff = f ? f.teamGoldDiff : 0;
    var side = diff >= 0 ? "BLUE" : "RED";
    var colour = diff >= 0 ? "var(--blue-500)" : "var(--red-500)";
    var readout = document.getElementById("story-readout");
    readout.style.color = colour;
    readout.textContent =
      (diff >= 0 ? "+" : "") +
      Math.abs(diff).toLocaleString() +
      "g " +
      side +
      " · " +
      state.minute +
      "m";
    document.getElementById("minute-readout").textContent = state.minute + " / " + DURATION + "m";
    document.getElementById("scrubber").value = state.minute;
  }

  // ── map ───────────────────────────────────────────────────────────────
  var pinsLayer = document.getElementById("map-pins");
  function renderMap() {
    while (pinsLayer.firstChild) pinsLayer.removeChild(pinsLayer.firstChild);
    var visible = activeEvents().filter(function (e) {
      return e.position && e.minute <= state.minute;
    });
    visible.forEach(function (e) {
      // Riot's raw Rift coordinates (~0-14870, origin bottom-left, y increases north) mapped
      // onto RiftMap's normalized 0-100 box (origin top-left, y increases down, per RiftMap.tsx).
      var nx = clamp((e.position.x / 14870) * 100, 2, 98);
      var ny = clamp(100 - (e.position.y / 14870) * 100, 2, 98);
      var op = decay(e.minute);
      var recent = state.minute - e.minute <= 1;
      var g = shapeNode(e.kind, nx, ny, recent ? 2.8 : 2.2, op);
      if (recent) g.classList.add("pin-pulse");
      pinsLayer.appendChild(g);
    });
  }
  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  // ── feed ──────────────────────────────────────────────────────────────
  var feedList = document.getElementById("feed-list");
  function describeEvent(e) {
    var actor = e.actor ? e.actor.championName : null;
    switch (e.kind) {
      case "CHAMPION_KILL":
        return (actor ? actor : "Someone") + " was taken down";
      case "CHAMPION_SPECIAL_KILL":
        return (actor ? actor : "Someone") + " — " + (e.payload.multiKillLength || 2) + "-kill";
      case "ELITE_MONSTER_KILL":
        return (e.payload.monsterType || "Objective").replace(/_/g, " ") + " taken";
      case "BUILDING_KILL":
        return (
          (e.payload.laneType || "").replace("_LANE", "") +
          " " +
          (e.payload.towerType || "tower").replace(/_/g, " ").toLowerCase() +
          " fell"
        );
      case "TURRET_PLATE_DESTROYED":
        return (e.payload.laneType || "").replace("_LANE", "") + " plate destroyed";
      case "WARD_PLACED":
        return (actor ? actor : "Someone") + " placed a ward";
      case "WARD_KILL":
        return (actor ? actor : "Someone") + " cleared a ward";
      default:
        return e.kind;
    }
  }
  function renderFeed() {
    while (feedList.firstChild) feedList.removeChild(feedList.firstChild);
    var list = activeEvents();
    var currentRow = null;
    list.forEach(function (e) {
      var li = document.createElement("li");
      li.className = "feed-row";
      if (e.minute > state.minute) li.classList.add("is-future");
      if (e.minute === state.minute) {
        li.classList.add("is-current");
        currentRow = li;
      }
      li.style.opacity = e.minute <= state.minute ? decay(e.minute) : 1;
      li.style.cursor = "pointer";
      li.addEventListener("click", function () {
        setMinute(e.minute);
      });

      var min = document.createElement("span");
      min.className = "fmin";
      min.textContent = e.minute + "m";
      var swSpan = document.createElement("span");
      var svgIcon = el("svg", { viewBox: "-6 -6 12 12", width: 14, height: 14 });
      svgIcon.appendChild(shapeNode(e.kind, 0, 0, 4, 1));
      swSpan.appendChild(svgIcon);
      var desc = document.createElement("span");
      desc.className = "fdesc";
      var isSelf = e.actor && e.actor.puuid === DATA.meta.selfPuuid;
      desc.innerHTML =
        (isSelf ? '<span class="fself">●</span> ' : "") + escapeHtml(describeEvent(e));
      var actor = document.createElement("span");
      actor.className = "factor";
      actor.textContent = e.actor ? e.actor.position : "";

      li.appendChild(min);
      li.appendChild(swSpan);
      li.appendChild(desc);
      li.appendChild(actor);
      feedList.appendChild(li);
    });
    if (currentRow) currentRow.scrollIntoView({ block: "nearest" });
  }
  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  // ── chips ─────────────────────────────────────────────────────────────
  var chipsWrap = document.getElementById("filter-chips");
  function renderChips() {
    KIND_ORDER.forEach(function (kind) {
      var s = KIND_STYLE[kind];
      var chip = document.createElement("button");
      chip.className = "chip";
      chip.type = "button";
      chip.innerHTML = '<span class="swatch" style="background:' + s.color + '"></span>' + s.label;
      chip.addEventListener("click", function () {
        if (state.activeKinds.has(kind)) state.activeKinds.delete(kind);
        else state.activeKinds.add(kind);
        chip.classList.toggle("is-off", !state.activeKinds.has(kind));
        renderAll();
      });
      chipsWrap.appendChild(chip);
    });
  }

  // ── controls ──────────────────────────────────────────────────────────
  function setMinute(m) {
    state.minute = clamp(Math.round(m), 0, DURATION);
    renderAll();
  }
  function renderAll() {
    renderChart();
    renderReadout();
    renderMap();
    renderFeed();
  }

  function stepToEvent(dir) {
    var minutes = Array.from(
      new Set(
        activeEvents().map(function (e) {
          return e.minute;
        })
      )
    ).sort(function (a, b) {
      return a - b;
    });
    var target =
      dir > 0
        ? minutes.find(function (m) {
            return m > state.minute;
          })
        : minutes
            .slice()
            .reverse()
            .find(function (m) {
              return m < state.minute;
            });
    if (target !== undefined) setMinute(target);
  }

  function togglePlay(force) {
    state.playing = typeof force === "boolean" ? force : !state.playing;
    document.getElementById("play-btn").textContent = state.playing ? "⏸" : "▶";
    document.getElementById("play-btn").classList.toggle("play", true);
    if (state.timer) {
      clearInterval(state.timer);
      state.timer = null;
    }
    if (state.playing) {
      state.timer = setInterval(function () {
        if (state.minute >= DURATION) {
          togglePlay(false);
          return;
        }
        setMinute(state.minute + 1);
      }, 1000 / state.speed);
    }
  }

  document.getElementById("scrubber").addEventListener("input", function (e) {
    setMinute(Number(e.target.value));
  });
  document.getElementById("play-btn").addEventListener("click", function () {
    togglePlay();
  });
  document.getElementById("prev-event-btn").addEventListener("click", function () {
    stepToEvent(-1);
  });
  document.getElementById("next-event-btn").addEventListener("click", function () {
    stepToEvent(1);
  });
  document.getElementById("speed-select").addEventListener("change", function (e) {
    state.speed = Number(e.target.value);
    if (state.playing) togglePlay(true);
  });
  // Space toggles play when focus is on the scrubber or play button — arrow-key scrubbing
  // itself is native <input type="range"> keyboard behaviour, not reimplemented here.
  document.querySelector(".story-controls").addEventListener("keydown", function (e) {
    if (e.code === "Space") {
      e.preventDefault();
      togglePlay();
    }
  });

  document.getElementById("scrubber").max = DURATION;
  renderChips();
  renderAll();

  // ── mockup-only viewer chrome ─────────────────────────────────────────
  // Keyed on the attribute itself: the buttons carry data-viewport / data-state, so reading
  // `dataset.value` off them yielded undefined and every switch landed on "-undefined" —
  // the phone drawing and both other states were unreachable until this was fixed.
  function bindGroup(key, apply) {
    var buttons = document.querySelectorAll("[data-" + key + "]");
    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        buttons.forEach(function (x) {
          x.classList.remove("is-active");
        });
        b.classList.add("is-active");
        apply(b.dataset[key]);
      });
    });
  }
  bindGroup("viewport", function (v) {
    var frame = document.getElementById("device-frame");
    frame.className = "device-frame viewport-" + v;
  });
  bindGroup("state", function (v) {
    document.querySelectorAll(".story-panel").forEach(function (p) {
      p.style.display = "none";
    });
    document.getElementById("panel-" + v).style.display = "";
  });
})();
