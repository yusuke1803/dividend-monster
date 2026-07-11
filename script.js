const savedGame = JSON.parse(localStorage.getItem("dividendMonsterSave"));

const game = savedGame || {
  money: 0,
  dividend: 100
};

const evolutions = [
  {
    money: 0,
    emoji: "🥚",
    name: "タマゴン Lv.1",
    message: "配当を集めてモンスターを育てよう！"
  },
  {
    money: 500,
    emoji: "🐣",
    name: "ヒヨコ Lv.2",
    message: "小さなモンスターが誕生した！"
  },
  {
    money: 1500,
    emoji: "🐺",
    name: "オオカミ Lv.3",
    message: "配当の力でたくましく成長した！"
  },
  {
    money: 3000,
    emoji: "🐉",
    name: "ドラゴン Lv.4",
    message: "ついに伝説のドラゴンへ進化！"
  },
  {
    money: 6000,
    emoji: "👑",
    name: "キングモンスター Lv.5",
    message: "配当モンスターの王になった！"
  }
];

const moneyElement = document.getElementById("money");
const dividendElement = document.getElementById("dividend");
const currentMoneyElement = document.getElementById("currentMoney");
const nextEvolutionElement = document.getElementById("nextEvolution");
const monsterElement = document.getElementById("monster");
const monsterNameElement = document.getElementById("monsterName");
const stageTextElement = document.getElementById("stageText");
const progressElement = document.getElementById("progress");
const collectButton = document.getElementById("collectButton");

collectButton.addEventListener("click", collectDividend);

function collectDividend() {
  game.money += game.dividend;
  updateGame();
  saveGame();
}

function updateGame() {
  moneyElement.textContent = game.money.toLocaleString();
  dividendElement.textContent = game.dividend.toLocaleString();
  currentMoneyElement.textContent = game.money.toLocaleString();

  let currentEvolution = evolutions[0];
  let nextEvolution = null;

  for (const evolution of evolutions) {
    if (game.money >= evolution.money) {
      currentEvolution = evolution;
    } else {
      nextEvolution = evolution;
      break;
    }
  }

  monsterElement.textContent = currentEvolution.emoji;
  monsterNameElement.textContent = currentEvolution.name;
  stageTextElement.textContent = currentEvolution.message;

  if (nextEvolution) {
    nextEvolutionElement.textContent =
      nextEvolution.money.toLocaleString();

    const currentStart = currentEvolution.money;
    const requiredAmount = nextEvolution.money - currentStart;
    const earnedAmount = game.money - currentStart;
    const progressPercent = Math.min(
      (earnedAmount / requiredAmount) * 100,
      100
    );

    progressElement.style.width = progressPercent + "%";
  } else {
    nextEvolutionElement.textContent = "進化完了";
    progressElement.style.width = "100%";
  }
}

function saveGame() {
  localStorage.setItem(
    "dividendMonsterSave",
    JSON.stringify(game)
  );
}

// 5秒ごとに自動で配当を受け取る
setInterval(() => {
  game.money += game.dividend;
  updateGame();
  saveGame();
}, 5000);

updateGame();
