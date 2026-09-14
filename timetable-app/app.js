(function () {
  "use strict";

  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const START_HOUR = 7; // 7:00
  const END_HOUR = 22; // up to 22:00
  const SLOT_MIN = 30;
  const SLOTS_PER_HOUR = 60 / SLOT_MIN;
  const TOTAL_SLOTS = (END_HOUR - START_HOUR) * SLOTS_PER_HOUR;
  const STORAGE_KEY = "timetable_events_v5";
  const ROW_PX = 28;

  const grid = document.getElementById("calendarGrid");
  const overlay = document.getElementById("modalOverlay");
  const form = document.getElementById("eventForm");
  const modalTitle = document.getElementById("modalTitle");
  const fId = document.getElementById("eventId");
  const fTitle = document.getElementById("eventTitle");
  const fDay = document.getElementById("eventDay");
  const fStart = document.getElementById("eventStart");
  const fEnd = document.getElementById("eventEnd");
  const fLocation = document.getElementById("eventLocation");
  const fColor = document.getElementById("eventColor");
  const formError = document.getElementById("formError");
  const deleteBtn = document.getElementById("deleteBtn");

  function loadEvents() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      const sample = [
        { id: uid(), title: "ECO311H5 – Pricing Strategies", day: 0, start: "09:00", end: "11:00", location: "MN 2190", color: "#3d6b5c" },
        { id: uid(), title: "CSC108H1 – Intro to Computer Sci", day: 0, start: "13:00", end: "14:00", location: "PB B250", color: "#8a5a44" },
        { id: uid(), title: "ECO466H5 – Empirical Macro", day: 1, start: "11:00", end: "13:00", location: "KN 3217", color: "#a8763e" },
        { id: uid(), title: "ECO312H5 – Firms and Markets", day: 1, start: "17:00", end: "19:00", location: "MN 2190", color: "#5c6b8a" },
        { id: uid(), title: "CSC108H1 – Intro to Computer Sci", day: 2, start: "13:00", end: "15:00", location: "MB 128", color: "#8a5a44" },
        { id: uid(), title: "ECO466H5 – Empirical Macro", day: 3, start: "11:00", end: "13:00", location: "KN 3217", color: "#a8763e" },
        { id: uid(), title: "ECO365H5 – International Monetary", day: 4, start: "09:00", end: "11:00", location: "IB 150", color: "#6b4c8a" },
        { id: uid(), title: "STA220H5 – TA Tutorial (TUT0102)", day: 2, start: "17:00", end: "18:00", location: "MN 3180", color: "#4a6b73" },
        { id: uid(), title: "STA220H5 – TA Tutorial (TUT0103)", day: 2, start: "18:00", end: "19:00", location: "DH 2080", color: "#4a6b73" },
        { id: uid(), title: "Jiu Jitsu", day: 0, start: "12:00", end: "13:00", location: "", color: "#5c7a3d" },
        { id: uid(), title: "Jiu Jitsu", day: 2, start: "12:00", end: "13:00", location: "", color: "#5c7a3d" },
        { id: uid(), title: "Jiu Jitsu", day: 5, start: "12:00", end: "13:30", location: "", color: "#5c7a3d" },
        { id: uid(), title: "Part-time Job", day: 1, start: "15:00", end: "19:00", location: "", color: "#734a5c" },
        { id: uid(), title: "Part-time Job", day: 3, start: "15:00", end: "19:00", location: "", color: "#734a5c" },
        { id: uid(), title: "Meeting Prof. Eduardo", day: 2, start: "11:00", end: "11:30", location: "TBD", color: "#73573d" }
      ];
      saveEvents(sample);
      return sample;
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveEvents(events) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }

  function uid() {
    return (crypto.randomUUID && crypto.randomUUID()) || `ev_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }

  function timeToMinutes(t) {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  }

  function formatHourLabel(h) {
    const period = h < 12 ? "AM" : "PM";
    let hour12 = h % 12;
    if (hour12 === 0) hour12 = 12;
    return `${hour12} ${period}`;
  }

  function formatTimeRange(start, end) {
    function fmt(t) {
      const [h, m] = t.split(":").map(Number);
      const period = h < 12 ? "AM" : "PM";
      let hour12 = h % 12;
      if (hour12 === 0) hour12 = 12;
      return m === 0 ? `${hour12} ${period}` : `${hour12}:${String(m).padStart(2, "0")} ${period}`;
    }
    return `${fmt(start)} – ${fmt(end)}`;
  }

  const DEADLINES = [
    { date: "2026-09-14", time: "All day", course: "Personal", title: "Greg's birthday" },
    { date: "2026-09-14", time: "12:00 PM", course: "CSC108H1", title: "Prepare exercise due" },
    { date: "2026-09-16", time: "11:00 PM", course: "STA220H5", title: "Module 1 Tutorial Participation" },
    { date: "2026-09-18", time: "4:00 PM", course: "CSC108H1", title: "Perform exercise due" },
    { date: "2026-09-21", time: "12:00 PM", course: "CSC108H1", title: "Prepare exercise due" },
    { date: "2026-09-23", time: "11:59 PM", course: "CSC108H1", title: "Survey One due" },
    { date: "2026-09-25", time: "4:00 PM", course: "CSC108H1", title: "Perform exercise due" },
    { date: "2026-09-26", time: "10:00–11:30 AM", course: "Study session", title: "Work: ECO466H5 Macro Assignment", type: "study" },
    { date: "2026-09-26", time: "2:00–3:30 PM", course: "Study session", title: "Study: ECO312H5 Quiz 1 (lectures 1–3)", type: "study" },
    { date: "2026-09-28", time: "12:00 PM", course: "CSC108H1", title: "Prepare exercise due" },
    { date: "2026-09-29", time: "In class", course: "ECO312H5", title: "Quiz 1 (lectures 1–3) — 20%" },
    { date: "2026-09-30", time: "All day", course: "Holiday", title: "Truth and Reconciliation Day" },
    { date: "2026-10-01", time: "Due", course: "ECO466H5", title: "Macroeconomics Assignment — 10%" },
    { date: "2026-10-02", time: "4:00 PM", course: "CSC108H1", title: "Perform exercise due" },
    { date: "2026-10-02", time: "7:00–8:30 PM", course: "Study session", title: "Study: ECO311H5 Quiz 1 (Price Discrimination)", type: "study" },
    { date: "2026-10-04", time: "2:00–4:00 PM", course: "Study session", title: "Work: ECO466H5 Econometrics Assignment", type: "study" },
    { date: "2026-10-05", time: "12:00 PM", course: "CSC108H1", title: "Prepare exercise due" },
    { date: "2026-10-05", time: "In class", course: "ECO311H5", title: "Quiz 1" },
    { date: "2026-10-05", time: "1:00 PM", course: "CSC108H1", title: "Quiz 1 (Lecture Classroom)" },
    { date: "2026-10-06", time: "Due", course: "ECO466H5", title: "Econometrics Assignment — 10%" },
    { date: "2026-10-09", time: "4:00 PM", course: "CSC108H1", title: "Perform exercise due" },
    { date: "2026-10-10", time: "2:00–4:30 PM", course: "Study session", title: "Study: ECO466H5 Tests (Macro & Econometrics)", type: "study" },
    { date: "2026-10-12", time: "All day", course: "Holiday", title: "Thanksgiving Day (no ECO311H5 class)" },
    { date: "2026-10-12", time: "2:00–4:00 PM", course: "Study session", title: "Prep: ECO466H5 Group Report", type: "study" },
    { date: "2026-10-13", time: "In class", course: "ECO466H5", title: "Test: Macroeconomics — 10%" },
    { date: "2026-10-13", time: "In class", course: "ECO466H5", title: "Test: Econometrics — 10%" },
    { date: "2026-10-14", time: "Midnight", course: "ECO466H5", title: "Group Report Slides due — 20%" },
    { date: "2026-10-15", time: "In class", course: "ECO466H5", title: "Group Report Presentation + Q&A — 40% (last class)" },
    { date: "2026-10-19", time: "1:00–4:00 PM", course: "Study session", title: "Study: ECO365H5 Midterm", type: "study" },
    { date: "2026-10-23", time: "11:59 PM", course: "ECO365H5", title: "Midterm due" },
    { date: "2026-10-26", time: "All day", course: "Note", title: "Reading Week — no ECO311H5 / ECO312H5 classes" },
    { date: "2026-10-27", time: "All day", course: "Note", title: "No ECO312H5 class (reading week)" },
    { date: "2026-10-31", time: "2:00–3:30 PM", course: "Study session", title: "Study: ECO312H5 Quiz 2 (Mergers)", type: "study" },
    { date: "2026-11-03", time: "In class", course: "ECO312H5", title: "Quiz 2 (lectures 4–6) — 20%" },
    { date: "2026-11-06", time: "7:00–8:30 PM", course: "Study session", title: "Study: ECO311H5 Quiz 2 (Intertemporal & Product Diff.)", type: "study" },
    { date: "2026-11-09", time: "In class", course: "ECO311H5", title: "Quiz 2" },
    { date: "2026-11-16", time: "Released", course: "ECO311H5", title: "Final Assignment released (due Dec 8)" },
    { date: "2026-11-18", time: "7:00–8:30 PM", course: "Study session", title: "Study: ECO365H5 Quiz", type: "study" },
    { date: "2026-11-20", time: "9:00 PM", course: "ECO365H5", title: "Quiz — /15" },
    { date: "2026-11-22", time: "1:00–4:00 PM", course: "Study session", title: "Work: ECO311H5 Final Assignment (early start)", type: "study" },
    { date: "2026-11-28", time: "2:00–3:30 PM", course: "Study session", title: "Study: ECO312H5 Quiz 3 (Market Entry, Hotelling, R&D)", type: "study" },
    { date: "2026-11-29", time: "1:00–4:00 PM", course: "Study session", title: "Work: ECO365H5 Trading Project", type: "study" },
    { date: "2026-12-01", time: "In class", course: "ECO312H5", title: "Quiz 3 (lectures 7–9) — 20%" },
    { date: "2026-12-04", time: "9:00 AM", course: "ECO365H5", title: "Trading Project due — /100" },
    { date: "2026-12-05", time: "2:00–4:00 PM", course: "Study session", title: "Study: ECO311H5 Quiz 3 + finish Final Assignment", type: "study" },
    { date: "2026-12-08", time: "In class", course: "ECO311H5", title: "Quiz 3" },
    { date: "2026-12-08", time: "11:59 PM", course: "ECO311H5", title: "Final Assignment due — 30%" },
    { date: "2026-12-09", time: "6:00–8:00 PM", course: "Study session", title: "Work: ECO312H5 Term Paper (due Dec 11)", type: "study" },
    { date: "2026-12-11", time: "Due", course: "ECO312H5", title: "Term Paper due — 40%" }
  ];

  function renderDeadlines() {
    const list = document.getElementById("deadlinesList");
    if (!list) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = DEADLINES
      .filter((d) => new Date(`${d.date}T00:00:00`) >= today)
      .sort((a, b) => a.date.localeCompare(b.date));

    list.innerHTML = upcoming
      .map((d) => {
        const dt = new Date(`${d.date}T00:00:00`);
        const dow = dt.toLocaleDateString(undefined, { weekday: "short" });
        const dom = dt.getDate();
        const cls = d.type === "study" ? "deadline-item study" : "deadline-item";
        return `
          <li class="${cls}">
            <div class="deadline-date"><span class="dow">${dow}</span><span class="dom">${dom}</span></div>
            <div class="deadline-body">
              <div class="deadline-title">${escapeHtml(d.title)}</div>
              <div class="deadline-meta">${escapeHtml(d.course)} · ${escapeHtml(d.time)}</div>
            </div>
          </li>
        `;
      })
      .join("");

    if (!upcoming.length) {
      list.innerHTML = `<li class="deadline-item"><div class="deadline-body"><div class="deadline-meta">Nothing upcoming — you're clear.</div></div></li>`;
    }
  }

  let events = loadEvents();

  function buildGrid() {
    grid.innerHTML = "";
    grid.style.gridTemplateRows = `auto repeat(${TOTAL_SLOTS}, ${ROW_PX}px)`;

    const corner = document.createElement("div");
    corner.className = "col-header";
    corner.style.gridRow = "1";
    corner.style.gridColumn = "1";
    grid.appendChild(corner);

    DAYS.forEach((day, i) => {
      const h = document.createElement("div");
      h.className = "col-header";
      h.textContent = day;
      h.style.gridRow = "1";
      h.style.gridColumn = String(i + 2);
      grid.appendChild(h);
    });

    for (let h = START_HOUR; h < END_HOUR; h++) {
      for (let s = 0; s < SLOTS_PER_HOUR; s++) {
        const rowIndex = (h - START_HOUR) * SLOTS_PER_HOUR + s + 2;

        if (s === 0) {
          const label = document.createElement("div");
          label.className = "time-label";
          label.textContent = formatHourLabel(h);
          label.style.gridRow = String(rowIndex);
          grid.appendChild(label);
        }

        for (let d = 0; d < 7; d++) {
          const cell = document.createElement("div");
          cell.className = "slot-cell";
          cell.style.gridRow = String(rowIndex);
          cell.style.gridColumn = String(d + 2);
          const hh = String(h).padStart(2, "0");
          const mm = String(s * SLOT_MIN).padStart(2, "0");
          cell.dataset.day = String(d);
          cell.dataset.time = `${hh}:${mm}`;
          cell.addEventListener("click", () => openAddModal(d, `${hh}:${mm}`));
          grid.appendChild(cell);
        }
      }
    }

    renderEvents();
  }

  function computeDayLayout(dayEvents) {
    const layout = new Map();
    let active = [];
    let cluster = [];

    function finalizeCluster() {
      if (!cluster.length) return;
      const colTotal = Math.max(...cluster.map((e) => layout.get(e.id).col)) + 1;
      cluster.forEach((e) => { layout.get(e.id).colTotal = colTotal; });
      cluster = [];
    }

    dayEvents.forEach((ev) => {
      const start = timeToMinutes(ev.start);
      const end = timeToMinutes(ev.end);
      active = active.filter((a) => a.end > start);
      if (active.length === 0) finalizeCluster();
      const usedCols = new Set(active.map((a) => a.col));
      let col = 0;
      while (usedCols.has(col)) col++;
      layout.set(ev.id, { col, colTotal: 1 });
      active.push({ end, col });
      cluster.push(ev);
    });
    finalizeCluster();
    return layout;
  }

  function renderEvents() {
    grid.querySelectorAll(".event-block").forEach((el) => el.remove());

    const byDay = {};
    events.forEach((ev) => {
      (byDay[ev.day] = byDay[ev.day] || []).push(ev);
    });

    Object.keys(byDay).forEach((dayKey) => {
      const dayEvents = byDay[dayKey]
        .slice()
        .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start) || timeToMinutes(a.end) - timeToMinutes(b.end));
      const layout = computeDayLayout(dayEvents);

      dayEvents.forEach((ev) => {
        const { col, colTotal } = layout.get(ev.id);
        const startMin = timeToMinutes(ev.start);
        const endMin = timeToMinutes(ev.end);
        const gridStartMin = START_HOUR * 60;
        const rowStart = 2 + Math.round((startMin - gridStartMin) / SLOT_MIN);
        const rowSpan = Math.max(1, Math.round((endMin - startMin) / SLOT_MIN));

        const block = document.createElement("div");
        block.className = "event-block";
        block.style.gridRow = `${rowStart} / span ${rowSpan}`;
        block.style.gridColumn = String(Number(ev.day) + 2);
        block.style.background = ev.color || "#3d6b5c";
        block.style.position = "relative";
        block.style.zIndex = "2";
        if (colTotal > 1) {
          block.style.width = `calc(${100 / colTotal}% - 4px)`;
          block.style.marginLeft = `calc(${100 / colTotal}% * ${col} + 2px)`;
          block.style.marginRight = "0";
        }
        block.innerHTML = `
          <div class="ev-title">${escapeHtml(ev.title)}</div>
          <div class="ev-meta">${formatTimeRange(ev.start, ev.end)}</div>
          ${ev.location ? `<div class="ev-meta">${escapeHtml(ev.location)}</div>` : ""}
        `;
        block.addEventListener("click", (e) => {
          e.stopPropagation();
          openEditModal(ev);
        });
        grid.appendChild(block);
      });
    });

    renderConflicts();
  }

  function detectConflicts() {
    const conflicts = [];
    const byDay = {};
    events.forEach((ev) => (byDay[ev.day] = byDay[ev.day] || []).push(ev));
    Object.values(byDay).forEach((dayEvents) => {
      for (let i = 0; i < dayEvents.length; i++) {
        for (let j = i + 1; j < dayEvents.length; j++) {
          const a = dayEvents[i];
          const b = dayEvents[j];
          const aStart = timeToMinutes(a.start);
          const aEnd = timeToMinutes(a.end);
          const bStart = timeToMinutes(b.start);
          const bEnd = timeToMinutes(b.end);
          if (aStart < bEnd && bStart < aEnd) conflicts.push({ a, b });
        }
      }
    });
    return conflicts;
  }

  function renderConflicts() {
    const banner = document.getElementById("conflictBanner");
    if (!banner) return;
    const conflicts = detectConflicts();
    if (!conflicts.length) {
      banner.classList.add("hidden");
      banner.innerHTML = "";
      return;
    }
    banner.classList.remove("hidden");
    banner.innerHTML = conflicts
      .map((c) => `
        <div class="conflict-item">
          <strong>${escapeHtml(DAYS[Number(c.a.day)])}:</strong>
          ${escapeHtml(c.a.title)} (${formatTimeRange(c.a.start, c.a.end)}) overlaps
          ${escapeHtml(c.b.title)} (${formatTimeRange(c.b.start, c.b.end)})
        </div>
      `)
      .join("");
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function openAddModal(day, start) {
    modalTitle.textContent = "Add Class";
    fId.value = "";
    fTitle.value = "";
    fDay.value = String(day);
    fStart.value = start || "09:00";
    const [h, m] = (start || "09:00").split(":").map(Number);
    const endMinutes = h * 60 + m + 60;
    fEnd.value = `${String(Math.floor(endMinutes / 60) % 24).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;
    fLocation.value = "";
    fColor.value = "#3d6b5c";
    deleteBtn.classList.add("hidden");
    formError.classList.add("hidden");
    overlay.classList.remove("hidden");
    fTitle.focus();
  }

  function openEditModal(ev) {
    modalTitle.textContent = "Edit Class";
    fId.value = ev.id;
    fTitle.value = ev.title;
    fDay.value = String(ev.day);
    fStart.value = ev.start;
    fEnd.value = ev.end;
    fLocation.value = ev.location || "";
    fColor.value = ev.color || "#3d6b5c";
    deleteBtn.classList.remove("hidden");
    formError.classList.add("hidden");
    overlay.classList.remove("hidden");
    fTitle.focus();
  }

  function closeModal() {
    overlay.classList.add("hidden");
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    formError.classList.add("hidden");

    if (timeToMinutes(fStart.value) >= timeToMinutes(fEnd.value)) {
      formError.textContent = "End time must be after start time.";
      formError.classList.remove("hidden");
      return;
    }

    const data = {
      id: fId.value || uid(),
      title: fTitle.value.trim(),
      day: Number(fDay.value),
      start: fStart.value,
      end: fEnd.value,
      location: fLocation.value.trim(),
      color: fColor.value
    };

    if (fId.value) {
      const idx = events.findIndex((ev) => ev.id === fId.value);
      if (idx !== -1) events[idx] = data;
    } else {
      events.push(data);
    }

    saveEvents(events);
    renderEvents();
    closeModal();
  });

  deleteBtn.addEventListener("click", () => {
    events = events.filter((ev) => ev.id !== fId.value);
    saveEvents(events);
    renderEvents();
    closeModal();
  });

  document.getElementById("cancelBtn").addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.classList.contains("hidden")) closeModal();
  });

  document.getElementById("addEventBtn").addEventListener("click", () => openAddModal(0, "09:00"));

  document.getElementById("exportBtn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(events, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "timetable.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  const importInput = document.getElementById("importFile");
  document.getElementById("importBtn").addEventListener("click", () => importInput.click());
  importInput.addEventListener("change", () => {
    const file = importInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!Array.isArray(parsed)) throw new Error("Invalid file format");
        const valid = parsed.every(
          (ev) => ev && typeof ev.title === "string" && typeof ev.start === "string" && typeof ev.end === "string"
        );
        if (!valid) throw new Error("Invalid event data");
        events = parsed.map((ev) => ({ ...ev, id: ev.id || uid() }));
        saveEvents(events);
        renderEvents();
      } catch (err) {
        alert("Could not import file: " + err.message);
      }
      importInput.value = "";
    };
    reader.readAsText(file);
  });

  // ---- Tab navigation ----
  const PAGE_TITLES = { schedule: "Ashwin's Timetable", todo: "To-Do", notes: "Notes" };

  function initTabs() {
    const tabs = document.querySelectorAll(".tab");
    const views = { schedule: document.getElementById("viewSchedule"), todo: document.getElementById("viewTodo"), notes: document.getElementById("viewNotes") };
    const scheduleActions = document.getElementById("scheduleActions");
    const pageTitle = document.getElementById("pageTitle");

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const target = tab.dataset.view;
        tabs.forEach((t) => t.classList.toggle("active", t === tab));
        Object.entries(views).forEach(([key, el]) => el.classList.toggle("hidden", key !== target));
        scheduleActions.classList.toggle("hidden", target !== "schedule");
        pageTitle.textContent = PAGE_TITLES[target];
      });
    });
  }

  // ---- To-Do list ----
  const TODO_KEY = "timetable_todos_v1";
  let todos = [];

  function loadTodos() {
    try {
      const parsed = JSON.parse(localStorage.getItem(TODO_KEY));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveTodos() {
    localStorage.setItem(TODO_KEY, JSON.stringify(todos));
  }

  function renderTodos() {
    const list = document.getElementById("todoList");
    if (!list) return;
    if (!todos.length) {
      list.innerHTML = `<li class="todo-empty">Nothing on your list yet.</li>`;
      return;
    }
    list.innerHTML = todos
      .map(
        (t) => `
          <li class="todo-item ${t.done ? "done" : ""}" data-id="${t.id}">
            <input type="checkbox" ${t.done ? "checked" : ""}>
            <span class="todo-text">${escapeHtml(t.text)}</span>
            <button type="button" class="todo-delete" aria-label="Delete task">✕</button>
          </li>
        `
      )
      .join("");

    list.querySelectorAll(".todo-item").forEach((li) => {
      const id = li.dataset.id;
      li.querySelector('input[type="checkbox"]').addEventListener("change", (e) => {
        const t = todos.find((x) => x.id === id);
        if (t) { t.done = e.target.checked; saveTodos(); renderTodos(); }
      });
      li.querySelector(".todo-delete").addEventListener("click", () => {
        todos = todos.filter((x) => x.id !== id);
        saveTodos();
        renderTodos();
      });
    });
  }

  function initTodos() {
    todos = loadTodos();
    const form = document.getElementById("todoForm");
    const input = document.getElementById("todoInput");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      todos.push({ id: uid(), text, done: false });
      saveTodos();
      renderTodos();
      input.value = "";
      input.focus();
    });
    renderTodos();
  }

  // ---- Notes ----
  const NOTES_KEY = "timetable_notes_v1";
  let notes = [];

  function loadNotes() {
    try {
      const parsed = JSON.parse(localStorage.getItem(NOTES_KEY));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveNotes() {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  }

  function renderNotes() {
    const gridEl = document.getElementById("notesGrid");
    if (!gridEl) return;
    gridEl.innerHTML = notes
      .map(
        (n) => `
          <div class="note-card" data-id="${n.id}">
            <button type="button" class="note-delete" aria-label="Delete note">✕</button>
            <input type="text" class="note-title" placeholder="Title" value="${escapeHtml(n.title)}">
            <textarea class="note-body" placeholder="Write a note…">${escapeHtml(n.body)}</textarea>
          </div>
        `
      )
      .join("");

    gridEl.querySelectorAll(".note-card").forEach((card) => {
      const id = card.dataset.id;
      const titleEl = card.querySelector(".note-title");
      const bodyEl = card.querySelector(".note-body");
      titleEl.addEventListener("input", () => {
        const n = notes.find((x) => x.id === id);
        if (n) { n.title = titleEl.value; saveNotes(); }
      });
      bodyEl.addEventListener("input", () => {
        const n = notes.find((x) => x.id === id);
        if (n) { n.body = bodyEl.value; saveNotes(); }
      });
      card.querySelector(".note-delete").addEventListener("click", () => {
        notes = notes.filter((x) => x.id !== id);
        saveNotes();
        renderNotes();
      });
    });
  }

  function initNotes() {
    notes = loadNotes();
    document.getElementById("addNoteBtn").addEventListener("click", () => {
      notes.unshift({ id: uid(), title: "", body: "" });
      saveNotes();
      renderNotes();
      const firstTitle = document.querySelector(".note-card .note-title");
      if (firstTitle) firstTitle.focus();
    });
    renderNotes();
  }

  buildGrid();
  renderDeadlines();
  initTabs();
  initTodos();
  initNotes();
})();
