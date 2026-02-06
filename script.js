const actors = [
  {
    id: 1,
    name: "Анна Смирнова",
    role: "Главная героиня",
    availability: {
      3: "busy",
      4: "busy",
      10: "maybe",
      15: "busy",
      22: "busy",
    },
  },
  {
    id: 2,
    name: "Илья Котов",
    role: "Второстепенная роль",
    availability: {
      1: "maybe",
      8: "busy",
      9: "busy",
      18: "busy",
    },
  },
  {
    id: 3,
    name: "Мария Павлова",
    role: "Антагонист",
    availability: {
      5: "busy",
      6: "busy",
      7: "busy",
      19: "maybe",
    },
  },
  {
    id: 4,
    name: "Сергей Орлов",
    role: "Эпизод",
    availability: {
      12: "busy",
      13: "busy",
      25: "maybe",
    },
  },
];

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

const pendingChanges = new Map();
const newActors = [];
 main
function getDaysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function formatDateKey(date, day) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const dayString = String(day).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${dayString}`;
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
  const filteredActors = actors.filter((actor) =>main
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

function serializeChanges() {
  const changes = [];
  pendingChanges.forEach((status, key) => {
    const [actorId, day] = key.split("-").map(Number);
    changes.push({
      actorId,
      date: formatDateKey(currentDate, day),
      status,
    });
  });
  return changes;
}

async function saveChanges() {
  const changes = serializeChanges();
  saveStatus.textContent = "Сохраняем изменения...";

  try {
    await fetch("/api/availability", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        month: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`,
        changes,
      }),
    });

    pendingChanges.clear();
    saveStatus.textContent = "Изменения сохранены.";
  } catch (error) {
    saveStatus.textContent = "Не удалось сохранить. Проверьте подключение к базе данных.";
  }
}

async function saveNewActor(actor) {
  try {
    await fetch("/api/actors", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(actor),
    });
    saveStatus.textContent = `Актер ${actor.name} добавлен.`;
  } catch (error) {
    saveStatus.textContent = "Не удалось добавить актера.";
  }
}

actorForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = actorNameInput.value.trim();
  const role = actorRoleInput.value.trim();

  if (!name || !role) {
    return;
  }

  const newActor = {
    id: Date.now(),
    name,
    role,
    availability: {},
  };

  actors.unshift(newActor);
  newActors.push(newActor);
  actorNameInput.value = "";
  actorRoleInput.value = "";
  renderCalendar();
  await saveNewActor({ name, role });
});

prevMonthButton.addEventListener("click", () => {
  currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  pendingChanges.clear();
  renderCalendar();
});

nextMonthButton.addEventListener("click", () => {
  currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);codex
  pendingChanges.clear();
  renderCalendar();
});

searchInput.addEventListener("input", renderCalendar);
saveButton.addEventListener("click", saveChanges);

renderCalendar();main
