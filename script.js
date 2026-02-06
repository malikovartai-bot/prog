const scheduleData = [
  {
    name: "Анна Смирнова",
    role: "Главная героиня",
    items: [
      {
        title: "Читка сценария",
        start: 1,
        end: 3,
        type: "rehearsal",
      },
      {
        title: "Съемка, блок А",
        start: 5,
        end: 8,
        type: "shooting",
      },
    ],
  },
  {
    name: "Илья Котов",
    role: "Второстепенная роль",
    items: [
      {
        title: "Репетиция сцены 5",
        start: 2,
        end: 4,
        type: "rehearsal",
      },
      {
        title: "Резерв под съемку",
        start: 9,
        end: 11,
        type: "hold",
      },
    ],
  },
  {
    name: "Мария Павлова",
    role: "Антагонист",
    items: [
      {
        title: "Съемка, блок B",
        start: 1,
        end: 6,
        type: "shooting",
      },
      {
        title: "Согласование костюмов",
        start: 10,
        end: 12,
        type: "rehearsal",
      },
    ],
  },
  {
    name: "Сергей Орлов",
    role: "Эпизод",
    items: [
      {
        title: "Резерв под дубль",
        start: 4,
        end: 6,
        type: "hold",
      },
    ],
  },
];

const periodSelect = document.getElementById("period");
const searchInput = document.getElementById("search");
const scheduleHead = document.getElementById("scheduleHead");
const scheduleBody = document.getElementById("scheduleBody");

function createHead(days) {
  scheduleHead.innerHTML = "";
  for (let day = 1; day <= days; day += 1) {
    const cell = document.createElement("div");
    cell.textContent = `День ${day}`;
    scheduleHead.appendChild(cell);
  }
}

function createTimeline(items, days) {
  const timeline = document.createElement("div");
  timeline.className = "timeline";
  timeline.style.setProperty("--columns", days);

  items.forEach((item) => {
    const block = document.createElement("div");
    block.className = `timeline__item timeline__item--${item.type}`;

    const startPercent = ((item.start - 1) / days) * 100;
    const endPercent = (item.end / days) * 100;
    block.style.left = `${startPercent}%`;
    block.style.width = `${endPercent - startPercent}%`;

    const title = document.createElement("span");
    title.textContent = item.title;

    const period = document.createElement("small");
    period.textContent = `Дни ${item.start}–${item.end}`;

    block.appendChild(title);
    block.appendChild(period);
    timeline.appendChild(block);
  });

  return timeline;
}

function renderSchedule() {
  const days = Number(periodSelect.value);
  const searchValue = searchInput.value.trim().toLowerCase();

  const filtered = scheduleData.filter((actor) =>
    actor.name.toLowerCase().includes(searchValue)
  );

  createHead(days);
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
    row.appendChild(createTimeline(actor.items, days));

    scheduleBody.appendChild(row);
  });
}

periodSelect.addEventListener("change", renderSchedule);
searchInput.addEventListener("input", renderSchedule);

renderSchedule();
