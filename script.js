const monthNames = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

const statusOrder = ["free", "maybe", "busy"];
const statusLabels = {
  busy: "Занят",
  free: "Свободен",
  maybe: "Под вопросом",
};

const schemaSql = `
CREATE TABLE IF NOT EXISTS actors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  role_name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS availability_statuses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  color_hex TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS actor_availability (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  status_id INTEGER NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (actor_id, date)
);

INSERT INTO availability_statuses (code, label, color_hex)
  VALUES
    ('busy', 'Занят', '#ef4444'),
    ('free', 'Свободен', '#22c55e'),
    ('maybe', 'Под вопросом', '#facc15')
  ON CONFLICT(code) DO NOTHING;
`;

const calendarHead = document.getElementById("calendarHead");
const calendarBody = document.getElementById("calendarBody");
const monthLabel = document.getElementById("monthLabel");
const prevMonthButton = document.getElementById("prevMonth");
const nextMonthButton = document.getElementById("nextMonth");
const searchInput = document.getElementById("search");
const saveButton = document.getElementById("saveChanges");
const saveStatus = document.getElementById("saveStatus");
const actorForm = document.getElementById("actorForm");
const actorNameInput = document.getElementById("actorName");
const actorRoleInput = document.getElementById("actorRole");

let currentDate = new Date();
currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

let db;
let actors = [];
const pendingChanges = new Map();

function getDaysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function formatDateKey(date, day) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const dayString = String(day).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${dayString}`;
}

function persistDatabase() {
  const data = db.export();
  const encoded = btoa(String.fromCharCode(...data));
  localStorage.setItem("amma-portal-db", encoded);
}

function loadDatabase(SQL) {
  const stored = localStorage.getItem("amma-portal-db");
  if (stored) {
    const bytes = Uint8Array.from(atob(stored), (char) => char.charCodeAt(0));
    return new SQL.Database(bytes);
  }
  const database = new SQL.Database();
  database.exec(schemaSql);
  return database;
}

function queryRows(statement, params = []) {
  const rows = [];
  const stmt = db.prepare(statement);
  stmt.bind(params);
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function refreshActors() {
  const rows = queryRows(
    "SELECT id, full_name, role_name FROM actors WHERE is_active = 1 ORDER BY id DESC"
  );
  const daysInMonth = getDaysInMonth(currentDate);
  actors = rows.map((row) => ({
    id: row.id,
    name: row.full_name,
    role: row.role_name,
    availability: {},
  }));

  if (actors.length === 0) {
    return;
  }

  const startDate = formatDateKey(currentDate, 1);
  const endDate = formatDateKey(currentDate, daysInMonth);
  const availabilityRows = queryRows(
    `
      SELECT aa.actor_id, aa.date, s.code AS status
      FROM actor_availability aa
      JOIN availability_statuses s ON s.id = aa.status_id
      WHERE aa.date BETWEEN ? AND ?
    `,
    [startDate, endDate]
  );

  availabilityRows.forEach((row) => {
    const day = Number(row.date.split("-")[2]);
    const actor = actors.find((item) => item.id === row.actor_id);
    if (actor && day) {
      actor.availability[day] = row.status;
    }
  });
}

function createHead(date) {
  calendarHead.innerHTML = "";
  const row = document.createElement("tr");
  const actorHeader = document.createElement("th");
  actorHeader.className = "actor-header";
  actorHeader.textContent = "Актер";
  row.appendChild(actorHeader);

  const daysInMonth = getDaysInMonth(date);
  for (let day = 1; day <= daysInMonth; day += 1) {
    const th = document.createElement("th");
    th.textContent = day;
    row.appendChild(th);
  }

  calendarHead.appendChild(row);
}

function getStatus(actor, day) {
  const override = pendingChanges.get(`${actor.id}-${day}`);
  if (override) {
    return override;
  }
  return actor.availability[day] ?? "free";
}

function cycleStatus(status) {
  const index = statusOrder.indexOf(status);
  const nextIndex = (index + 1) % statusOrder.length;
  return statusOrder[nextIndex];
}

function handleCellClick(actor, day) {
  const current = getStatus(actor, day);
  const next = cycleStatus(current);
  pendingChanges.set(`${actor.id}-${day}`, next);
  renderCalendar();
}

function renderCalendar() {
  const searchValue = searchInput.value.trim().toLowerCase();
  const filteredActors = actors.filter((actor) =>
    actor.name.toLowerCase().includes(searchValue)
  );

  monthLabel.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  createHead(currentDate);
  calendarBody.innerHTML = "";

  if (filteredActors.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = getDaysInMonth(currentDate) + 1;
    cell.className = "empty-state";
    cell.textContent = "Нет актеров по заданному фильтру.";
    row.appendChild(cell);
    calendarBody.appendChild(row);
    return;
  }

  const daysInMonth = getDaysInMonth(currentDate);
  filteredActors.forEach((actor) => {
    const row = document.createElement("tr");
    const actorCell = document.createElement("td");
    actorCell.className = "actor-cell";
    actorCell.innerHTML = `${actor.name}<span class="actor-subtitle">${actor.role}</span>`;
    row.appendChild(actorCell);

    for (let day = 1; day <= daysInMonth; day += 1) {
      const status = getStatus(actor, day);
      const cell = document.createElement("td");
      cell.className = "day-cell";

      const button = document.createElement("button");
      button.type = "button";
      button.className = `status-${status}`;
      button.title = `${statusLabels[status]} · ${day} ${monthNames[currentDate.getMonth()]}`;
      button.setAttribute("aria-label", `${actor.name}: ${statusLabels[status]} на ${day}`);
      button.addEventListener("click", () => handleCellClick(actor, day));

      cell.appendChild(button);
      row.appendChild(cell);
    }

    calendarBody.appendChild(row);
  });
}

function saveChanges() {
  const changes = [];
  pendingChanges.forEach((status, key) => {
    const [actorId, day] = key.split("-").map(Number);
    changes.push({
      actorId,
      date: formatDateKey(currentDate, day),
      status,
    });
  });

  if (changes.length === 0) {
    saveStatus.textContent = "Нет изменений для сохранения.";
    return;
  }

  const statusRows = queryRows("SELECT id, code FROM availability_statuses");
  const statusMap = new Map(statusRows.map((row) => [row.code, row.id]));

  changes.forEach((change) => {
    const statusId = statusMap.get(change.status);
    db.run(
      `
      INSERT INTO actor_availability (actor_id, date, status_id)
      VALUES (?, ?, ?)
      ON CONFLICT(actor_id, date)
      DO UPDATE SET status_id = excluded.status_id, updated_at = CURRENT_TIMESTAMP
      `,
      [change.actorId, change.date, statusId]
    );
  });

  pendingChanges.clear();
  persistDatabase();
  refreshActors();
  renderCalendar();
  saveStatus.textContent = "Изменения сохранены.";
}

function saveNewActor(name, role) {
  db.run("INSERT INTO actors (full_name, role_name) VALUES (?, ?)", [name, role]);
  persistDatabase();
}

actorForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = actorNameInput.value.trim();
  const role = actorRoleInput.value.trim();

  if (!name || !role) {
    return;
  }

  saveNewActor(name, role);
  actorNameInput.value = "";
  actorRoleInput.value = "";
  saveStatus.textContent = `Актер ${name} добавлен.`;
  refreshActors();
  renderCalendar();
});

prevMonthButton.addEventListener("click", () => {
  currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  pendingChanges.clear();
  refreshActors();
  renderCalendar();
});

nextMonthButton.addEventListener("click", () => {
  currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  pendingChanges.clear();
  refreshActors();
  renderCalendar();
});

searchInput.addEventListener("input", renderCalendar);
saveButton.addEventListener("click", saveChanges);

(async () => {
  const SQL = await initSqlJs({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/sql.js@1.10.2/dist/${file}`,
  });
  db = loadDatabase(SQL);
  db.exec(schemaSql);
  refreshActors();
  renderCalendar();
})();
