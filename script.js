const game = {
  money: 0,
  dividend: 100,
  level: 1
};

const evolutions = [
  { money: 0, emoji: "🥚", name: "タマゴン Lv.1" },
  { money: 500, emoji: "🐣", name: "ヒヨコ Lv.2" },
  { money: 1500, emoji: "🐺", name: "オオカミ Lv.3" },
  { money: 3000, emoji: "🐉", name: "ドラゴン Lv.4" },
  { money: 6000, emoji: "👑", name: "キングモンスター Lv.5" }
];

const money = document.getElementById("money");
const dividend = document.getElementById("dividend");
const currentMoney = document.getElementById("currentMoney");
const nextEvolution = document.getElementById("nextEvolution");
const monster = document.getElementById("monster");
const monsterName = document.getElementById("monsterName");
const progress = document.getElementById("progress");

document
  .getElementById("collectButton")
  .addEventListener("click", collectDividend);

function collectDividend() {
  game.money += game.dividend;
  updateGame();
}

function updateGame() {
  money.textContent = game.money;
  dividend.textContent = game.dividend;
  currentMoney.textContent = game.money;

  let next = 6000;

  evolutions.forEach(e => {
    if (game.money >= e.money) {
      monster.textContent = e.emoji;
      monsterName.textContent = e.name;
    } else if (next === 6000) {
      next = e.money;
    }
  });

  nextEvolution.textContent = next;

  let percent = Math.min(game.money / next * 100, 100);
  progress.style.width = percent + "%";
}

updateGame();
