(function () {
  "use strict";

  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const START_HOUR = 7; // 7:00
  const END_HOUR = 22; // up to 22:00
  const SLOT_MIN = 30;
  const SLOTS_PER_HOUR = 60 / SLOT_MIN;
  const TOTAL_SLOTS = (END_HOUR - START_HOUR) * SLOTS_PER_HOUR;
  const STORAGE_KEY = "timetable_events_v8";
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
        { id: uid(), title: "Meeting Prof. Eduardo", day: 2, start: "11:00", end: "11:30", location: "TBD", color: "#73573d" },
        { id: uid(), title: "Mark STA220H5 Worksheets", day: 3, start: "19:30", end: "20:15", location: "", color: "#4a6b73" },
        { id: uid(), title: "ECO311H5 – Weekly Problem Set", day: 0, start: "19:00", end: "20:00", location: "", color: "#3d6b5c", isStudy: true, course: "ECO311H5" },
        { id: uid(), title: "ECO312H5 – Weekly Concept Review", day: 2, start: "15:00", end: "16:00", location: "", color: "#5c6b8a", isStudy: true, course: "ECO312H5" },
        { id: uid(), title: "ECO365H5 – Weekly Problem Set", day: 3, start: "13:00", end: "14:00", location: "", color: "#6b4c8a", isStudy: true, course: "ECO365H5" },
        { id: uid(), title: "ECO466H5 – Canadian Economy Reading", day: 4, start: "11:15", end: "12:00", location: "", color: "#a8763e", isStudy: true, course: "ECO466H5" }
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

  // ---- Study check-ins & progress tracking ----
  const STUDY_LOG_KEY = "timetable_studylog_v1";
  const TRACKED_COURSES = ["ECO311H5", "ECO312H5", "ECO365H5", "ECO466H5"];
  const COURSE_COLORS = { ECO311H5: "#3d6b5c", ECO312H5: "#5c6b8a", ECO365H5: "#6b4c8a", ECO466H5: "#a8763e" };
  const COURSE_RE = /(ECO\d{3}H5|CSC\d{3}H1|STA\d{3}H5)/;

  function extractCourseCode(title) {
    const m = title.match(COURSE_RE);
    return m ? m[1] : null;
  }

  function loadStudyLog() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STUDY_LOG_KEY));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveStudyLog(log) {
    localStorage.setItem(STUDY_LOG_KEY, JSON.stringify(log));
  }

  function getLogEntry(course, dateKey) {
    return studyLog.find((e) => e.course === course && e.dateKey === dateKey) || null;
  }

  function setLogEntry(course, dateKey, status) {
    const existing = getLogEntry(course, dateKey);
    if (existing) {
      existing.status = status;
      existing.loggedAt = new Date().toISOString();
    } else {
      studyLog.push({ course, dateKey, status, loggedAt: new Date().toISOString() });
    }
    saveStudyLog(studyLog);
  }

  function getCourseStats(course) {
    const entries = studyLog.filter((e) => e.course === course);
    const studied = entries.filter((e) => e.status === "studied").length;
    const other = entries.filter((e) => e.status === "other").length;
    const skipped = entries.filter((e) => e.status === "skipped").length;
    const total = entries.length;
    return { studied, other, skipped, total, pct: total ? Math.round((studied / total) * 100) : null };
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function isoDate(d) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }

  function getThisWeekDate(dayIndex) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDow = (today.getDay() + 6) % 7; // Mon=0..Sun=6
    const monday = new Date(today);
    monday.setDate(today.getDate() - todayDow);
    const target = new Date(monday);
    target.setDate(monday.getDate() + dayIndex);
    return isoDate(target);
  }

  function minutesToTime(mins) {
    return `${pad2(Math.floor(mins / 60))}:${pad2(mins % 60)}`;
  }

  function isSlotFree(dayIndex, startMin, endMin, occupied) {
    return !occupied.some((ev) => {
      if (Number(ev.day) !== dayIndex) return false;
      const s = timeToMinutes(ev.start);
      const e = timeToMinutes(ev.end);
      return startMin < e && s < endMin;
    });
  }

  function findFreeSlot(dayIndex, occupied, durationMin) {
    for (let h = 9; h < 21; h++) {
      for (const m of [0, 30]) {
        const s = h * 60 + m;
        const e = s + durationMin;
        if (e > 21 * 60) continue;
        if (isSlotFree(dayIndex, s, e, occupied)) return { start: minutesToTime(s), end: minutesToTime(e) };
      }
    }
    return null;
  }

  function needsCatchUp(course) {
    const entries = studyLog
      .filter((e) => e.course === course)
      .sort((a, b) => b.dateKey.localeCompare(a.dateKey));
    if (!entries.length) return false;
    const latest = entries[0];
    const daysAgo = daysUntil(latest.dateKey) * -1;
    return latest.status === "skipped" && daysAgo >= 0 && daysAgo <= 14;
  }

  function computeCatchUps() {
    const needing = TRACKED_COURSES.filter(needsCatchUp);
    if (!needing.length) return [];
    const occupied = events.slice();
    const searchDays = [5, 6, 0, 1, 2, 3, 4];
    const result = [];
    for (const course of needing) {
      if (result.length >= 2) break;
      let slot = null;
      let chosenDay = null;
      for (const d of searchDays) {
        slot = findFreeSlot(d, occupied, 45);
        if (slot) {
          chosenDay = d;
          break;
        }
      }
      if (slot) {
        const synth = {
          id: `catchup-${course}`,
          title: `Catch-up: ${course}`,
          day: chosenDay,
          start: slot.start,
          end: slot.end,
          color: COURSE_COLORS[course] || "#73573d",
          location: "",
          isStudy: true,
          isCatchUp: true,
          course
        };
        result.push(synth);
        occupied.push(synth);
      }
    }
    return result;
  }

  const studyLog = loadStudyLog();

  const DEADLINES = [
    { date: "2026-09-14", time: "All day", course: "Personal", title: "Greg's birthday" },
    { date: "2026-09-14", time: "12:00 PM", course: "CSC108H1", title: "Prepare exercise due" },
    { date: "2026-09-15", time: "7:30–8:30 PM", course: "Study session", title: "Start reviewing: ECO312H5 Quiz 1", type: "study", due: "2026-09-29" },
    { date: "2026-09-18", time: "4:00 PM", course: "CSC108H1", title: "Perform exercise due" },
    { date: "2026-09-21", time: "12:00 PM", course: "CSC108H1", title: "Prepare exercise due" },
    { date: "2026-09-21", time: "7:00–8:00 PM", course: "Study session", title: "Start reviewing: ECO311H5 Quiz 1", type: "study", due: "2026-10-05" },
    { date: "2026-09-22", time: "7:30–8:30 PM", course: "Study session", title: "Review: ECO312H5 Quiz 1 (practice problems)", type: "study", due: "2026-09-29" },
    { date: "2026-09-23", time: "11:59 PM", course: "CSC108H1", title: "Survey One due" },
    { date: "2026-09-25", time: "4:00 PM", course: "CSC108H1", title: "Perform exercise due" },
    { date: "2026-09-26", time: "10:00–11:30 AM", course: "Study session", title: "Work: ECO466H5 Macro Assignment", type: "study", due: "2026-10-01" },
    { date: "2026-09-26", time: "2:00–3:30 PM", course: "Study session", title: "Final review: ECO312H5 Quiz 1 (lectures 1–3)", type: "study", due: "2026-09-29" },
    { date: "2026-09-28", time: "12:00 PM", course: "CSC108H1", title: "Prepare exercise due" },
    { date: "2026-09-28", time: "7:00–8:00 PM", course: "Study session", title: "Review: ECO311H5 Quiz 1 (practice problems)", type: "study", due: "2026-10-05" },
    { date: "2026-09-29", time: "In class", course: "ECO312H5", title: "Quiz 1 (lectures 1–3) — 20%" },
    { date: "2026-09-29", time: "7:30–8:30 PM", course: "Study session", title: "Start reviewing: ECO466H5 Tests", type: "study", due: "2026-10-13" },
    { date: "2026-09-30", time: "All day", course: "Holiday", title: "Truth and Reconciliation Day" },
    { date: "2026-10-01", time: "Due", course: "ECO466H5", title: "Macroeconomics Assignment — 10%" },
    { date: "2026-10-02", time: "4:00 PM", course: "CSC108H1", title: "Perform exercise due" },
    { date: "2026-10-02", time: "7:00–8:30 PM", course: "Study session", title: "Final review: ECO311H5 Quiz 1 (Price Discrimination)", type: "study", due: "2026-10-05" },
    { date: "2026-10-04", time: "2:00–4:00 PM", course: "Study session", title: "Work: ECO466H5 Econometrics Assignment", type: "study", due: "2026-10-06" },
    { date: "2026-10-05", time: "12:00 PM", course: "CSC108H1", title: "Prepare exercise due" },
    { date: "2026-10-05", time: "In class", course: "ECO311H5", title: "Quiz 1" },
    { date: "2026-10-05", time: "1:00 PM", course: "CSC108H1", title: "Quiz 1 (Lecture Classroom)" },
    { date: "2026-10-06", time: "Due", course: "ECO466H5", title: "Econometrics Assignment — 10%" },
    { date: "2026-10-06", time: "7:30–8:30 PM", course: "Study session", title: "Review: ECO466H5 Tests (practice problems)", type: "study", due: "2026-10-13" },
    { date: "2026-10-09", time: "4:00 PM", course: "CSC108H1", title: "Perform exercise due" },
    { date: "2026-10-09", time: "7:00–8:30 PM", course: "Study session", title: "Start reviewing: ECO365H5 Midterm", type: "study", due: "2026-10-23" },
    { date: "2026-10-10", time: "2:00–4:30 PM", course: "Study session", title: "Final review: ECO466H5 Tests (Macro & Econometrics)", type: "study", due: "2026-10-13" },
    { date: "2026-10-12", time: "All day", course: "Holiday", title: "Thanksgiving Day (no ECO311H5 class)" },
    { date: "2026-10-12", time: "2:00–4:00 PM", course: "Study session", title: "Prep: ECO466H5 Group Report", type: "study", due: "2026-10-14" },
    { date: "2026-10-13", time: "In class", course: "ECO466H5", title: "Test: Macroeconomics — 10%" },
    { date: "2026-10-13", time: "In class", course: "ECO466H5", title: "Test: Econometrics — 10%" },
    { date: "2026-10-14", time: "Midnight", course: "ECO466H5", title: "Group Report Slides due — 20%" },
    { date: "2026-10-15", time: "In class", course: "ECO466H5", title: "Group Report Presentation + Q&A — 40% (last class)" },
    { date: "2026-10-16", time: "7:00–8:30 PM", course: "Study session", title: "Review: ECO365H5 Midterm (practice problems)", type: "study", due: "2026-10-23" },
    { date: "2026-10-19", time: "1:00–4:00 PM", course: "Study session", title: "Final review: ECO365H5 Midterm", type: "study", due: "2026-10-23" },
    { date: "2026-10-20", time: "7:30–8:30 PM", course: "Study session", title: "Start reviewing: ECO312H5 Quiz 2", type: "study", due: "2026-11-03" },
    { date: "2026-10-23", time: "11:59 PM", course: "ECO365H5", title: "Midterm due" },
    { date: "2026-10-26", time: "All day", course: "Note", title: "Reading Week — no ECO311H5 / ECO312H5 classes" },
    { date: "2026-10-26", time: "7:00–8:00 PM", course: "Study session", title: "Start reviewing: ECO311H5 Quiz 2", type: "study", due: "2026-11-09" },
    { date: "2026-10-27", time: "All day", course: "Note", title: "No ECO312H5 class (reading week)" },
    { date: "2026-10-27", time: "7:30–8:30 PM", course: "Study session", title: "Review: ECO312H5 Quiz 2 (practice problems)", type: "study", due: "2026-11-03" },
    { date: "2026-10-31", time: "2:00–3:30 PM", course: "Study session", title: "Final review: ECO312H5 Quiz 2 (Mergers)", type: "study", due: "2026-11-03" },
    { date: "2026-11-02", time: "7:00–8:00 PM", course: "Study session", title: "Review: ECO311H5 Quiz 2 (practice problems)", type: "study", due: "2026-11-09" },
    { date: "2026-11-03", time: "In class", course: "ECO312H5", title: "Quiz 2 (lectures 4–6) — 20%" },
    { date: "2026-11-06", time: "7:00–8:30 PM", course: "Study session", title: "Final review: ECO311H5 Quiz 2 (Intertemporal & Product Diff.)", type: "study", due: "2026-11-09" },
    { date: "2026-11-07", time: "10:30–11:30 AM", course: "Study session", title: "Start reviewing: ECO365H5 Quiz", type: "study", due: "2026-11-20" },
    { date: "2026-11-09", time: "In class", course: "ECO311H5", title: "Quiz 2" },
    { date: "2026-11-13", time: "7:00–8:00 PM", course: "Study session", title: "Review: ECO365H5 Quiz (practice problems)", type: "study", due: "2026-11-20" },
    { date: "2026-11-16", time: "Released", course: "ECO311H5", title: "Final Assignment released (due Dec 8)" },
    { date: "2026-11-17", time: "7:30–8:30 PM", course: "Study session", title: "Start reviewing: ECO312H5 Quiz 3", type: "study", due: "2026-12-01" },
    { date: "2026-11-18", time: "7:00–8:30 PM", course: "Study session", title: "Final review: ECO365H5 Quiz", type: "study", due: "2026-11-20" },
    { date: "2026-11-20", time: "9:00 PM", course: "ECO365H5", title: "Quiz — /15" },
    { date: "2026-11-22", time: "1:00–4:00 PM", course: "Study session", title: "Work: ECO311H5 Final Assignment (early start)", type: "study", due: "2026-12-08" },
    { date: "2026-11-23", time: "7:00–8:00 PM", course: "Study session", title: "Start reviewing: ECO311H5 Quiz 3", type: "study", due: "2026-12-08" },
    { date: "2026-11-24", time: "7:30–8:30 PM", course: "Study session", title: "Review: ECO312H5 Quiz 3 (practice problems)", type: "study", due: "2026-12-01" },
    { date: "2026-11-28", time: "2:00–3:30 PM", course: "Study session", title: "Final review: ECO312H5 Quiz 3 (Market Entry, Hotelling, R&D)", type: "study", due: "2026-12-01" },
    { date: "2026-11-29", time: "1:00–4:00 PM", course: "Study session", title: "Work: ECO365H5 Trading Project", type: "study", due: "2026-12-04" },
    { date: "2026-11-30", time: "7:00–8:00 PM", course: "Study session", title: "Review: ECO311H5 Quiz 3 (practice problems)", type: "study", due: "2026-12-08" },
    { date: "2026-12-01", time: "In class", course: "ECO312H5", title: "Quiz 3 (lectures 7–9) — 20%" },
    { date: "2026-12-04", time: "9:00 AM", course: "ECO365H5", title: "Trading Project due — /100" },
    { date: "2026-12-05", time: "2:00–4:00 PM", course: "Study session", title: "Final review: ECO311H5 Quiz 3 + finish Final Assignment", type: "study", due: "2026-12-08" },
    { date: "2026-12-08", time: "In class", course: "ECO311H5", title: "Quiz 3" },
    { date: "2026-12-08", time: "11:59 PM", course: "ECO311H5", title: "Final Assignment due — 30%" },
    { date: "2026-12-09", time: "6:00–8:00 PM", course: "Study session", title: "Work: ECO312H5 Term Paper (due Dec 11)", type: "study", due: "2026-12-11" },
    { date: "2026-12-11", time: "Due", course: "ECO312H5", title: "Term Paper due — 40%" }
  ];

  function daysUntil(dateStr) {
    const target = new Date(`${dateStr}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((target - today) / 86400000);
  }

  function formatDueCountdown(dueStr) {
    const n = daysUntil(dueStr);
    const label = new Date(`${dueStr}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    if (n <= 0) return `due today (${label})`;
    if (n === 1) return `due tomorrow (${label})`;
    return `due in ${n} days (${label})`;
  }

  function renderDeadlines() {
    const list = document.getElementById("deadlinesList");
    if (!list) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = DEADLINES
      .filter((d) => new Date(`${d.date}T00:00:00`) >= today)
      .sort((a, b) => a.date.localeCompare(b.date));

    list.innerHTML = upcoming
      .map((d, i) => {
        const dt = new Date(`${d.date}T00:00:00`);
        const dow = dt.toLocaleDateString(undefined, { weekday: "short" });
        const dom = dt.getDate();
        const isStudy = d.type === "study";
        const course = isStudy ? extractCourseCode(d.title) : null;
        const logEntry = isStudy && course ? getLogEntry(course, d.date) : null;
        const cls = ["deadline-item", isStudy ? "study" : "", logEntry ? `logged-${logEntry.status}` : ""].filter(Boolean).join(" ");
        const countdown = d.due ? ` · ${formatDueCountdown(d.due)}` : "";
        const badge = logEntry ? { studied: " ✓", other: " ↔", skipped: " ✕" }[logEntry.status] : "";
        return `
          <li class="${cls}" ${isStudy ? `data-idx="${i}"` : ""}>
            <div class="deadline-date"><span class="dow">${dow}</span><span class="dom">${dom}</span></div>
            <div class="deadline-body">
              <div class="deadline-title">${escapeHtml(d.title)}${badge}</div>
              <div class="deadline-meta">${escapeHtml(d.course)} · ${escapeHtml(d.time)}${countdown}</div>
            </div>
          </li>
        `;
      })
      .join("");

    if (!upcoming.length) {
      list.innerHTML = `<li class="deadline-item"><div class="deadline-body"><div class="deadline-meta">Nothing upcoming — you're clear.</div></div></li>`;
    }

    list.querySelectorAll(".deadline-item.study").forEach((li) => {
      li.addEventListener("click", () => {
        const d = upcoming[Number(li.dataset.idx)];
        const course = extractCourseCode(d.title);
        if (!course) return;
        const dt = new Date(`${d.date}T00:00:00`);
        const label = `${d.title} — ${dt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
        openCheckin(course, d.date, label);
      });
    });
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

    const allEvents = events.concat(computeCatchUps());
    const byDay = {};
    allEvents.forEach((ev) => {
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
        let logEntry = null;
        if (ev.isStudy) {
          block.classList.add("study");
          if (ev.isCatchUp) block.classList.add("catchup");
          const dateKey = getThisWeekDate(Number(ev.day));
          logEntry = getLogEntry(ev.course, dateKey);
          if (logEntry) block.classList.add(`logged-${logEntry.status}`);
        }
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
        const badge = logEntry ? { studied: "✓", other: "↔", skipped: "✕" }[logEntry.status] : "";
        block.innerHTML = `
          ${badge ? `<span class="ev-badge">${badge}</span>` : ""}
          <div class="ev-title">${escapeHtml(ev.title)}</div>
          <div class="ev-meta">${formatTimeRange(ev.start, ev.end)}</div>
          ${ev.location ? `<div class="ev-meta">${escapeHtml(ev.location)}</div>` : ""}
        `;
        block.addEventListener("click", (e) => {
          e.stopPropagation();
          if (ev.isStudy) {
            const dateKey = getThisWeekDate(Number(ev.day));
            const dayLabel = DAYS[Number(ev.day)];
            openCheckin(ev.course, dateKey, `${ev.title} — ${dayLabel} (this week)`);
          } else {
            openEditModal(ev);
          }
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

  // ---- Study check-in modal ----
  const checkinOverlay = document.getElementById("checkinOverlay");
  const checkinTitle = document.getElementById("checkinTitle");
  const checkinSub = document.getElementById("checkinSub");
  const checkinCurrent = document.getElementById("checkinCurrent");
  const checkinCancel = document.getElementById("checkinCancel");
  let checkinContext = null;

  function openCheckin(course, dateKey, label) {
    if (!course) return;
    checkinContext = { course, dateKey };
    checkinTitle.textContent = course;
    checkinSub.textContent = label;
    const existing = getLogEntry(course, dateKey);
    if (existing) {
      const wording = { studied: "You logged this as studied.", other: "You logged this as: did something else.", skipped: "You logged this as skipped." }[existing.status];
      checkinCurrent.textContent = wording;
      checkinCurrent.classList.remove("hidden");
    } else {
      checkinCurrent.classList.add("hidden");
    }
    checkinOverlay.classList.remove("hidden");
  }

  function closeCheckin() {
    checkinOverlay.classList.add("hidden");
    checkinContext = null;
  }

  checkinOverlay.querySelectorAll(".checkin-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!checkinContext) return;
      setLogEntry(checkinContext.course, checkinContext.dateKey, btn.dataset.status);
      closeCheckin();
      renderEvents();
      renderDeadlines();
      renderProgress();
    });
  });

  checkinCancel.addEventListener("click", closeCheckin);
  checkinOverlay.addEventListener("click", (e) => {
    if (e.target === checkinOverlay) closeCheckin();
  });

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
  const PAGE_TITLES = { schedule: "Ashwin's Timetable", todo: "To-Do", notes: "Notes", progress: "Progress" };

  function initTabs() {
    const tabs = document.querySelectorAll(".tab");
    const views = {
      schedule: document.getElementById("viewSchedule"),
      todo: document.getElementById("viewTodo"),
      notes: document.getElementById("viewNotes"),
      progress: document.getElementById("viewProgress")
    };
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
  const TODO_KEY = "timetable_todos_v2";
  let todos = [];

  function loadTodos() {
    const raw = localStorage.getItem(TODO_KEY);
    if (raw === null) {
      const seed = [
        { id: uid(), text: "Get STA220H5 mailroom access code from Asal", done: false },
        { id: uid(), text: "Pick up STA220H5 worksheets from Asal's mailbox (watch for STA258 mix-ups)", done: false },
        { id: uid(), text: "Introduce myself in first STA220H5 tutorial", done: false },
        { id: uid(), text: "Log TA hours for the mid-course DDAH meeting", done: false }
      ];
      localStorage.setItem(TODO_KEY, JSON.stringify(seed));
      return seed;
    }
    try {
      const parsed = JSON.parse(raw);
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

  // ---- Progress tab ----
  const COURSE_LABELS = {
    ECO311H5: "ECO311H5 – Pricing Strategies",
    ECO312H5: "ECO312H5 – Firms and Markets",
    ECO365H5: "ECO365H5 – International Monetary",
    ECO466H5: "ECO466H5 – Empirical Macro"
  };

  function renderProgress() {
    const list = document.getElementById("progressList");
    if (!list) return;
    list.innerHTML = TRACKED_COURSES.map((course) => {
      const stats = getCourseStats(course);
      const color = COURSE_COLORS[course];
      const pctLabel = stats.pct === null ? "No check-ins yet" : `${stats.pct}%`;
      const barWidth = stats.pct === null ? 0 : stats.pct;
      return `
        <div class="progress-row">
          <div class="progress-row-head">
            <span class="progress-course">${escapeHtml(COURSE_LABELS[course] || course)}</span>
            <span class="progress-pct">${pctLabel}</span>
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width:${barWidth}%; background:${color};"></div>
          </div>
          <div class="progress-counts">
            ${stats.total ? `${stats.studied} studied · ${stats.other} other · ${stats.skipped} skipped` : "Check in on a study session to start tracking"}
          </div>
        </div>
      `;
    }).join("");
  }

  buildGrid();
  renderDeadlines();
  renderProgress();
  initTabs();
  initTodos();
  initNotes();
})();
