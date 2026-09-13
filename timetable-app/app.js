(function () {
  "use strict";

  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const START_HOUR = 7; // 7:00
  const END_HOUR = 22; // up to 22:00
  const SLOT_MIN = 30;
  const SLOTS_PER_HOUR = 60 / SLOT_MIN;
  const TOTAL_SLOTS = (END_HOUR - START_HOUR) * SLOTS_PER_HOUR;
  const STORAGE_KEY = "timetable_events_v1";
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
        { id: uid(), title: "Calculus 101", day: 0, start: "09:00", end: "10:30", location: "Room 204", color: "#5b8def" },
        { id: uid(), title: "Physics Lab", day: 2, start: "13:00", end: "15:00", location: "Lab B", color: "#4cb782" },
        { id: uid(), title: "Study Group", day: 4, start: "16:00", end: "17:00", location: "Library", color: "#e0a23c" }
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

  function renderEvents() {
    grid.querySelectorAll(".event-block").forEach((el) => el.remove());

    events.forEach((ev) => {
      const startMin = timeToMinutes(ev.start);
      const endMin = timeToMinutes(ev.end);
      const gridStartMin = START_HOUR * 60;
      const rowStart = 2 + Math.round((startMin - gridStartMin) / SLOT_MIN);
      const rowSpan = Math.max(1, Math.round((endMin - startMin) / SLOT_MIN));

      const block = document.createElement("div");
      block.className = "event-block";
      block.style.gridRow = `${rowStart} / span ${rowSpan}`;
      block.style.gridColumn = String(Number(ev.day) + 2);
      block.style.background = ev.color || "#5b8def";
      block.style.position = "relative";
      block.style.zIndex = "2";
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
    fColor.value = "#5b8def";
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
    fColor.value = ev.color || "#5b8def";
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
})();
