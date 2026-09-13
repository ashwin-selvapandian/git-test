(function () {
  "use strict";

  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const START_HOUR = 7; // 7:00
  const END_HOUR = 22; // up to 22:00
  const SLOT_MIN = 30;
  const SLOTS_PER_HOUR = 60 / SLOT_MIN;
  const TOTAL_SLOTS = (END_HOUR - START_HOUR) * SLOTS_PER_HOUR;
  const STORAGE_KEY = "timetable_events_v3";
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
        { id: uid(), title: "ECO466H5 – Empirical Macro", day: 1, start: "11:00", end: "13:00", location: "", color: "#a8763e" },
        { id: uid(), title: "ECO312H5 – Firms and Markets", day: 1, start: "17:00", end: "19:00", location: "MN 2190", color: "#5c6b8a" },
        { id: uid(), title: "CSC108H1 – Intro to Computer Sci", day: 2, start: "13:00", end: "15:00", location: "MB 128", color: "#8a5a44" },
        { id: uid(), title: "ECO466H5 – Empirical Macro", day: 3, start: "11:00", end: "13:00", location: "", color: "#a8763e" },
        { id: uid(), title: "ECO365H5 – International Monetary", day: 4, start: "09:00", end: "11:00", location: "IB 150", color: "#6b4c8a" },
        { id: uid(), title: "STA220H5 – TA Tutorial (TUT0102)", day: 2, start: "17:00", end: "18:00", location: "MN 3180", color: "#4a6b73" },
        { id: uid(), title: "STA220H5 – TA Tutorial (TUT0103)", day: 2, start: "18:00", end: "19:00", location: "DH 2080", color: "#4a6b73" },
        { id: uid(), title: "Jiu Jitsu", day: 0, start: "12:00", end: "13:00", location: "", color: "#5c7a3d" },
        { id: uid(), title: "Jiu Jitsu", day: 2, start: "12:00", end: "13:00", location: "", color: "#5c7a3d" },
        { id: uid(), title: "Jiu Jitsu", day: 5, start: "12:00", end: "13:30", location: "", color: "#5c7a3d" },
        { id: uid(), title: "Part-time Job", day: 1, start: "15:00", end: "19:00", location: "", color: "#734a5c" },
        { id: uid(), title: "Part-time Job", day: 3, start: "15:00", end: "19:00", location: "", color: "#734a5c" }
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
    { date: "2026-09-28", time: "12:00 PM", course: "CSC108H1", title: "Prepare exercise due" },
    { date: "2026-09-30", time: "All day", course: "Holiday", title: "Truth and Reconciliation Day" },
    { date: "2026-10-02", time: "4:00 PM", course: "CSC108H1", title: "Perform exercise due" },
    { date: "2026-10-05", time: "12:00 PM", course: "CSC108H1", title: "Prepare exercise due" },
    { date: "2026-10-05", time: "1:00 PM", course: "CSC108H1", title: "Quiz 1 (Lecture Classroom)" },
    { date: "2026-10-09", time: "4:00 PM", course: "CSC108H1", title: "Perform exercise due" },
    { date: "2026-10-12", time: "All day", course: "Holiday", title: "Thanksgiving Day" }
  ];

  function renderDeadlines() {
    const list = document.getElementById("deadlinesList");
    if (!list) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = DEADLINES.filter((d) => new Date(`${d.date}T00:00:00`) >= today);

    list.innerHTML = upcoming
      .map((d) => {
        const dt = new Date(`${d.date}T00:00:00`);
        const dow = dt.toLocaleDateString(undefined, { weekday: "short" });
        const dom = dt.getDate();
        return `
          <li class="deadline-item">
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

  buildGrid();
  renderDeadlines();
})();
