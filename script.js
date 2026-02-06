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

const storageKey = "amma-portal-data";

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

let actors = [];

function getDaysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function formatDateKey(date, day) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const dayString = String(day).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${dayString}`;
}

function saveToStorage() {
  localStorage.setItem(storageKey, JSON.stringify({ actors }));
}

function loadFromStorage() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function getInitialActors() {
  return [
    {
      id: 1,
      name: "Анна Смирнова",
      role: "Главная героиня",
      availability: {
        "2024-04-03": "busy",
        "2024-04-04": "busy",
        "2024-04-10": "maybe",
        "2024-04-15": "busy",
        "2024-04-22": "busy",
      },
    },
    {
      id: 2,
      name: "Илья Котов",
      role: "Второстепенная роль",
      availability: {
        "2024-04-01": "maybe",
        "2024-04-08": "busy",
        "2024-04-09": "busy",
        "2024-04-18": "busy",
      },
    },
    {
      id: 3,
      name: "Мария Павлова",
      role: "Антагонист",
      availability: {
        "2024-04-05": "busy",
        "2024-04-06": "busy",
        "2024-04-07": "busy",
        "2024-04-19": "maybe",
      },
    },
    {
      id: 4,
      name: "Сергей Орлов",
      role: "Эпизод",
      availability: {
        "2024-04-12": "busy",
        "2024-04-13": "busy",
        "2024-04-25": "maybe",
      },
    },
  ];
}

function hydrateActors() {
  const stored = loadFromStorage();
  if (stored && Array.isArray(stored.actors)) {
    actors = stored.actors;
    return;
  }
  actors = getInitialActors();
  saveToStorage();
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
  const key = formatDateKey(currentDate, day);
  return actor.availability[key] ?? "free";
}

function cycleStatus(status) {
  const index = statusOrder.indexOf(status);
  const nextIndex = (index + 1) % statusOrder.length;
  return statusOrder[nextIndex];
}

function handleCellClick(actor, day) {
  const key = formatDateKey(currentDate, day);
  const current = getStatus(actor, day);
  const next = cycleStatus(current);
  actor.availability[key] = next;
  saveToStorage();
  saveStatus.textContent = "Изменения сохранены.";
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

function saveNewActor(name, role) {
  const newActor = {
    id: Date.now(),
    name,
    role,
    availability: {},
  };
  actors.unshift(newActor);
  saveToStorage();
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
  renderCalendar();
});

prevMonthButton.addEventListener("click", () => {
  currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  renderCalendar();
});

nextMonthButton.addEventListener("click", () => {
  currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  renderCalendar();
});

searchInput.addEventListener("input", renderCalendar);
saveButton.addEventListener("click", () => {
  saveToStorage();
  saveStatus.textContent = "Все изменения сохранены.";
});

hydrateActors();
renderCalendar();
