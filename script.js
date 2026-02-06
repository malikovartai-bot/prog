
const actors = [
  {
    name: "Анна Смирнова",
    role: "Главная героиня",
    pattern: [
      { day: 3, status: "busy" },
      { day: 4, status: "busy" },
      { day: 10, status: "maybe" },
      { day: 15, status: "busy" },
      { day: 22, status: "busy" },
    ],
  },
  {
    name: "Илья Котов",
    role: "Второстепенная роль",
    pattern: [
      { day: 1, status: "maybe" },
      { day: 8, status: "busy" },
      { day: 9, status: "busy" },
      { day: 18, status: "busy" },
    ],
  },
  {
    name: "Мария Павлова",
    role: "Антагонист",
    pattern: [
      { day: 5, status: "busy" },
      { day: 6, status: "busy" },
      { day: 7, status: "busy" },
      { day: 19, status: "maybe" },
    ],
  },
  {
    name: "Сергей Орлов",
    role: "Эпизод",
    pattern: [
      { day: 12, status: "busy" },
      { day: 13, status: "busy" },
      { day: 25, status: "maybe" },
    ],
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

const weekDays = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

const statusLabels = {
  busy: "Занят",
  free: "Свободен",
  maybe: "Под вопросом",
};

const scheduleHead = document.getElementById("scheduleHead");
const scheduleBody = document.getElementById("scheduleBody");
const monthLabel = document.getElementById("monthLabel");
const prevMonthButton = document.getElementById("prevMonth");
const nextMonthButton = document.getElementById("nextMonth");
const searchInput = document.getElementById("search");

let currentDate = new Date();
currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

function getDaysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function createHead(date) {
  scheduleHead.innerHTML = "";
  const daysInMonth = getDaysInMonth(date);

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dayDate = new Date(date.getFullYear(), date.getMonth(), day);
    const cell = document.createElement("div");
    cell.innerHTML = `<strong>${day}</strong><br /><span>${weekDays[dayDate.getDay()]}</span>`;
    scheduleHead.appendChild(cell);
  }
}

function buildAvailability(pattern, daysInMonth) {
  const availability = {};
  pattern.forEach(({ day, status }) => {
    if (day <= daysInMonth) {
      availability[day] = status;
    }
  });
  return availability;
}

function createTimeline(actor, date) {
  const daysInMonth = getDaysInMonth(date);
  const timeline = document.createElement("div");
  timeline.className = "timeline";
  timeline.style.setProperty("--columns", daysInMonth);

  const availability = buildAvailability(actor.pattern, daysInMonth);

  for (let day = 1; day <= daysInMonth; day += 1) {
    const status = availability[day] ?? "free";

    const cell = document.createElement("div");
    cell.className = `timeline__day timeline__day--${status}`;
    cell.title = `${statusLabels[status]} · ${day} ${monthNames[date.getMonth()]}`;

    timeline.appendChild(cell);
  }

  return timeline;
}

function renderSchedule() {
  const searchValue = searchInput.value.trim().toLowerCase();
  const filtered = actors.filter((actor) =>
    actor.name.toLowerCase().includes(searchValue)
  );

  monthLabel.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  createHead(currentDate);
  scheduleBody.innerHTML = "";

  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Нет актеров по заданному фильтру.";
    scheduleBody.appendChild(empty);
    return;
  }

  filtered.forEach((actor) => {
    const row = document.createElement("div");
    row.className = "actor-row";

    const card = document.createElement("div");
    card.className = "actor-card";

    const name = document.createElement("h3");
    name.textContent = actor.name;

    const role = document.createElement("p");
    role.textContent = actor.role;

    card.appendChild(name);
    card.appendChild(role);

    row.appendChild(card);
    row.appendChild(createTimeline(actor, currentDate));

    scheduleBody.appendChild(row);
  });
}

prevMonthButton.addEventListener("click", () => {
  currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  renderSchedule();
});

nextMonthButton.addEventListener("click", () => {
  currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  renderSchedule();
});

searchInput.addEventListener("input", renderSchedule);

renderSchedule();
