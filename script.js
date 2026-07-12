// ========================================
// Dividend Monsters Ver.3.1
// script.js
// Part 1 / 4
// ========================================

const STORAGE_KEY = "dividend-monsters-data-v3";
const OLD_STORAGE_KEY = "dividend-monsters-data-v1";

let portfolio = [];
let expenses = {};
let dividendHistory = [];
let stockDatabase = {};

let editingStockId = null;

// ========================================
// DOM
// ========================================

const stockList = document.getElementById("stockList");
const stockCount = document.getElementById("stockCount");
const summaryStockCount = document.getElementById("summaryStockCount");
const stockSort = document.getElementById("stockSort");

const totalAnnualDividend = document.getElementById("totalAnnualDividend");
const monthlyDividend = document.getElementById("monthlyDividend");
const portfolioValue = document.getElementById("portfolioValue");
const freedomRate = document.getElementById("freedomRate");
const freedomBar = document.getElementById("freedomBar");
const freedomMessage = document.getElementById("freedomMessage");
const nextGoalTitle = document.getElementById("nextGoalTitle");
const nextGoalAmount = document.getElementById("nextGoalAmount");

const expenseList = document.getElementById("expenseList");

const dividendCalendar = document.getElementById("dividendCalendar");
const calendarYear = document.getElementById("calendarYear");
const dividendHistoryList = document.getElementById("dividendHistoryList");
const receivedDividendTotal = document.getElementById("receivedDividendTotal");

const monsterName = document.getElementById("monsterName");
const monsterLevel = document.getElementById("monsterLevel");
const monsterExp = document.getElementById("monsterExp");
const monsterNextExp = document.getElementById("monsterNextExp");
const monsterExpBar = document.getElementById("monsterExpBar");
const monsterMessage = document.getElementById("monsterMessage");
const monsterImage = document.querySelector(".monster-image");

const monsterStageEgg = document.getElementById("monsterStageEgg");
const monsterStageChick = document.getElementById("monsterStageChick");
const monsterStageDragon = document.getElementById("monsterStageDragon");
const monsterBookCount = document.getElementById("monsterBookCount");

const stockDialog = document.getElementById("stockDialog");
const expenseDialog = document.getElementById("expenseDialog");
const dividendDialog = document.getElementById("dividendDialog");
const levelUpDialog = document.getElementById("levelUpDialog");

const stockForm = document.getElementById("stockForm");
const expenseForm = document.getElementById("expenseForm");
const dividendForm = document.getElementById("dividendForm");

const stockCodeInput = document.getElementById("stockCode");
const stockSuggestions = document.getElementById("stockSuggestions");
const stockPreview = document.getElementById("stockPreview");
const stockFormError = document.getElementById("stockFormError");
const dividendFormError = document.getElementById("dividendFormError");

const stockDialogTitle = document.getElementById("stockDialogTitle");
const stockSubmitButton = document.getElementById("stockSubmitButton");
const dividendStockCode = document.getElementById("dividendStockCode");

const toast = document.getElementById("toast");

// ========================================
// イベント登録
// ========================================

document
  .getElementById("openStockFormButton")
  ?.addEventListener("click", openNewStockDialog);

document
  .getElementById("openExpenseFormButton")
  ?.addEventListener("click", openExpenseDialog);

document
  .getElementById("openDividendFormButton")
  ?.addEventListener("click", openDividendDialog);

document
  .getElementById("openDividendFormHeroButton")
  ?.addEventListener("click", openDividendDialog);

document
  .getElementById("openDividendHistoryButton")
  ?.addEventListener("click", openDividendDialog);

document
  .getElementById("clearDividendHistoryButton")
  ?.addEventListener("click", clearDividendHistory);

document
  .getElementById("closeLevelUpButton")
  ?.addEventListener("click", () => {
    levelUpDialog?.close();
  });

document
  .querySelectorAll("[data-close-dialog]")
  .forEach((button) => {
    button.addEventListener("click", () => {
      const dialogId = button.dataset.closeDialog;
      const dialog = document.getElementById(dialogId);

      if (dialog && typeof dialog.close === "function") {
        dialog.close();
      }
    });
  });

stockSort?.addEventListener("change", renderPortfolio);
stockDialog?.addEventListener("close", resetStockForm);

stockCodeInput?.addEventListener("input", () => {
  updateStockPreview(stockCodeInput.value);
});

// ========================================
// ダイアログ
// ========================================

function openNewStockDialog() {
  editingStockId = null;
  stockForm?.reset();
  hideStockError();

  if (stockPreview) {
    stockPreview.textContent = "";
  }

  if (stockDialogTitle) {
    stockDialogTitle.textContent = "銘柄を追加";
  }

  if (stockSubmitButton) {
    stockSubmitButton.textContent = "ポートフォリオに追加";
  }

  stockDialog?.showModal();
}

function openEditStockDialog(stockId) {
  const stock = portfolio.find((item) => item.id === stockId);

  if (!stock) {
    return;
  }

  editingStockId = stockId;
  hideStockError();

  if (stockCodeInput) {
    stockCodeInput.value = stock.code;
  }

  const shareCountInput = document.getElementById("shareCount");

  if (shareCountInput) {
    shareCountInput.value = stock.shares;
  }

  if (stockDialogTitle) {
    stockDialogTitle.textContent = "銘柄を編集";
  }

  if (stockSubmitButton) {
    stockSubmitButton.textContent = "変更を保存";
  }

  updateStockPreview(stock.code);
  stockDialog?.showModal();
}

function resetStockForm() {
  editingStockId = null;
  stockForm?.reset();
  hideStockError();

  if (stockPreview) {
    stockPreview.textContent = "";
  }

  if (stockDialogTitle) {
    stockDialogTitle.textContent = "銘柄を追加";
  }

  if (stockSubmitButton) {
    stockSubmitButton.textContent = "ポートフォリオに追加";
  }
}

function openExpenseDialog() {
  setInputValue("housingExpense", expenses.housing);
  setInputValue("foodExpense", expenses.food);
  setInputValue("utilityExpense", expenses.utility);
  setInputValue("communicationExpense", expenses.communication);
  setInputValue("otherExpense", expenses.other);

  expenseDialog?.showModal();
}

function openDividendDialog() {
  hideDividendError();
  renderDividendStockOptions();

  const dateInput = document.getElementById("receivedDividendDate");

  if (dateInput && !dateInput.value) {
    dateInput.value = getLocalDateString(new Date());
  }

  dividendDialog?.showModal();
}

// ========================================
// 保存・読込
// ========================================

function saveData() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      portfolio,
      expenses,
      dividendHistory
    })
  );
}

function loadData() {
  try {
    const currentData = localStorage.getItem(STORAGE_KEY);

    if (currentData) {
      const parsed = JSON.parse(currentData);

      portfolio = Array.isArray(parsed.portfolio) ? parsed.portfolio : [];
      expenses = parsed.expenses || {};
      dividendHistory = Array.isArray(parsed.dividendHistory)
        ? parsed.dividendHistory
        : [];

      return;
    }

    const oldData = localStorage.getItem(OLD_STORAGE_KEY);

    if (!oldData) {
      return;
    }

    const parsedOldData = JSON.parse(oldData);

    portfolio = Array.isArray(parsedOldData.portfolio)
      ? parsedOldData.portfolio
      : [];

    expenses = parsedOldData.expenses || {};
    dividendHistory = [];

    saveData();
  } catch (error) {
    console.error("保存データの読込に失敗しました。", error);

    portfolio = [];
    expenses = {};
    dividendHistory = [];
  }
}

// ========================================
// stocks.json
// ========================================

async function loadStockDatabase() {
  try {
    const response = await fetch("./stocks.json", {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("stocks.jsonを取得できませんでした。");
    }

    stockDatabase = await response.json();
    renderStockSuggestions();
  } catch (error) {
    console.error("銘柄データの読込に失敗しました。", error);

    stockDatabase = {};
    showToast("銘柄データを読み込めませんでした。");
  }
}

function renderStockSuggestions() {
  if (!stockSuggestions) {
    return;
  }

  stockSuggestions.innerHTML = Object.entries(stockDatabase)
    .map(
      ([code, stock]) => `
        <option
          value="${escapeHtml(code)}"
          label="${escapeHtml(stock.name)}"
        ></option>
      `
    )
    .join("");
}

// ========================================
// 銘柄検索・プレビュー
// ========================================

function updateStockPreview(inputValue) {
  if (!stockPreview) {
    return;
  }

  const keyword = String(inputValue || "")
    .trim()
    .toUpperCase();

  if (!keyword) {
    stockPreview.textContent = "";
    return;
  }

  const matched = findStock(keyword);

  if (!matched) {
    stockPreview.textContent = "銘柄が見つかりません。";
    return;
  }

  const { code, stock } = matched;

  const dividend = Number(stock.annualDividendPerShare || 0);
  const price = Number(stock.currentPrice || 0);
  const currency = stock.currency || "JPY";

  stockPreview.innerHTML = `
    <strong>${escapeHtml(stock.name)}</strong><br>
    コード：${escapeHtml(code)}<br>
    年間配当：${formatNumber(dividend)} ${escapeHtml(currency)}
    ${
      price > 0
        ? `<br>参考株価：${formatNumber(price)} ${escapeHtml(currency)}`
        : ""
    }
  `;
}

function findStock(keyword) {
  const normalizedKeyword = String(keyword || "")
    .trim()
    .toUpperCase();

  if (!normalizedKeyword) {
    return null;
  }

  const directStock = stockDatabase[normalizedKeyword];

  if (directStock) {
    return {
      code: normalizedKeyword,
      stock: directStock
    };
  }

  const matchedEntry = Object.entries(stockDatabase).find(([code, stock]) => {
    const normalizedCode = String(code || "").toUpperCase();
    const normalizedName = String(stock.name || "").toUpperCase();

    return (
      normalizedCode.includes(normalizedKeyword) ||
      normalizedName.includes(normalizedKeyword)
    );
  });

  if (!matchedEntry) {
    return null;
  }

  return {
    code: matchedEntry[0],
    stock: matchedEntry[1]
  };
}
// ========================================
// 銘柄フォーム
// ========================================

stockForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  hideStockError();

  const keyword = stockCodeInput?.value
    .trim()
    .toUpperCase();

  const shareCountInput =
    document.getElementById("shareCount");

  const shares =
    Number(shareCountInput?.value);

  if (!keyword) {
    showStockError(
      "銘柄コードまたは銘柄名を入力してください。"
    );

    return;
  }

  if (
    !Number.isFinite(shares) ||
    shares <= 0
  ) {
    showStockError(
      "保有株数を正しく入力してください。"
    );

    return;
  }

  const matched =
    findStock(keyword);

  if (!matched) {
    showStockError(
      "この銘柄はstocks.jsonに登録されていません。"
    );

    return;
  }

  const {
    code,
    stock
  } = matched;

  if (
    stock.dataStatus ===
    "manual-required"
  ) {
    showStockError(
      "この銘柄は配当データ未登録です。"
    );

    return;
  }

  const stockData = {
    id:
      editingStockId ||
      createId(),

    code,

    name:
      stock.name ||
      code,

    shares,

    dividend:
      Number(
        stock
          .annualDividendPerShare ||
        0
      ),

    price:
      Number(
        stock.currentPrice ||
        0
      ),

    type:
      stock.sector ||
      "other",

    market:
      stock.market ||
      "JP",

    currency:
      stock.currency ||
      "JPY"
  };

  if (editingStockId) {
    portfolio =
      portfolio.map((item) =>
        item.id === editingStockId
          ? stockData
          : item
      );

    showToast(
      `${stockData.name}を更新しました。`
    );
  } else {
    const existingStock =
      portfolio.find(
        (item) =>
          item.code === code
      );

    if (existingStock) {
      existingStock.shares =
        Number(
          existingStock.shares || 0
        ) +
        Number(shares);

      existingStock.dividend =
        stockData.dividend;

      existingStock.price =
        stockData.price;

      existingStock.type =
        stockData.type;

      existingStock.market =
        stockData.market;

      existingStock.currency =
        stockData.currency;

      showToast(
        `${stockData.name}の株数を追加しました。`
      );
    } else {
      portfolio.push(
        stockData
      );

      showToast(
        `${stockData.name}を追加しました。`
      );
    }
  }

  saveData();

  stockDialog?.close();

  render();
});


// ========================================
// 生活費フォーム
// ========================================

expenseForm?.addEventListener(
  "submit",
  (event) => {
    event.preventDefault();

    expenses = {
      housing:
        getNonNegativeNumber(
          "housingExpense"
        ),

      food:
        getNonNegativeNumber(
          "foodExpense"
        ),

      utility:
        getNonNegativeNumber(
          "utilityExpense"
        ),

      communication:
        getNonNegativeNumber(
          "communicationExpense"
        ),

      other:
        getNonNegativeNumber(
          "otherExpense"
        )
    };

    saveData();

    expenseDialog?.close();

    showToast(
      "生活費を保存しました。"
    );

    render();
  }
);


// ========================================
// 配当記録フォーム
// ========================================

dividendForm?.addEventListener(
  "submit",
  (event) => {
    event.preventDefault();

    hideDividendError();

    const stockCode =
      dividendStockCode?.value;

    const amount =
      Number(
        document
          .getElementById(
            "receivedDividendAmount"
          )
          ?.value
      );

    const date =
      document
        .getElementById(
          "receivedDividendDate"
        )
        ?.value;

    const memo =
      String(
        document
          .getElementById(
            "receivedDividendMemo"
          )
          ?.value ||
        ""
      )
        .trim();

    if (!stockCode) {
      showDividendError(
        "銘柄を選択してください。"
      );

      return;
    }

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      showDividendError(
        "受取金額を正しく入力してください。"
      );

      return;
    }

    if (!date) {
      showDividendError(
        "受取日を入力してください。"
      );

      return;
    }

    const stock =
      portfolio.find(
        (item) =>
          item.code === stockCode
      );

    if (!stock) {
      showDividendError(
        "対象の銘柄が見つかりません。"
      );

      return;
    }

    const oldStatus =
      getMonsterStatus();

    dividendHistory.push({
      id:
        createId(),

      stockCode:
        stock.code,

      stockName:
        stock.name,

      amount,

      date,

      memo,

      createdAt:
        new Date()
          .toISOString()
    });

    saveData();

    dividendDialog?.close();

    dividendForm.reset();

    render();

    const newStatus =
      getMonsterStatus();

    const gainedExp =
      calculateExpFromDividend(
        amount
      );

    showToast(
      `${stock.name}の配当を記録しました。＋${gainedExp} EXP`
    );

    if (
      newStatus.level >
      oldStatus.level
    ) {
      showLevelUpDialog(
        newStatus
      );
    }
  }
);


// ========================================
// 計算
// ========================================

function calculateStockDividend(
  stock
) {
  return (
    Number(
      stock.shares || 0
    ) *
    Number(
      stock.dividend || 0
    )
  );
}


function calculateAnnualDividend() {
  return portfolio.reduce(
    (total, stock) =>
      total +
      calculateStockDividend(
        stock
      ),
    0
  );
}


function calculatePortfolioValue() {
  return portfolio.reduce(
    (total, stock) =>
      total +
      Number(
        stock.shares || 0
      ) *
      Number(
        stock.price || 0
      ),
    0
  );
}


function calculateMonthlyExpense() {
  return Object
    .values(expenses)
    .reduce(
      (total, value) =>
        total +
        Number(value || 0),
      0
    );
}


function calculateReceivedDividendTotal() {
  return dividendHistory.reduce(
    (total, record) =>
      total +
      Number(
        record.amount || 0
      ),
    0
  );
}


function calculateExpFromDividend(
  amount
) {
  return Math.max(
    1,
    Math.floor(
      Number(
        amount || 0
      ) /
      100
    )
  );
}


function calculateTotalExp() {
  return dividendHistory.reduce(
    (total, record) =>
      total +
      calculateExpFromDividend(
        record.amount
      ),
    0
  );
}


// ========================================
// モンスター
// ========================================

function getMonsterStatus() {
  const totalExp =
    calculateTotalExp();

  let level = 1;
  let usedExp = 0;

  while (level < 100) {
    const requiredExp =
      level * 100;

    if (
      totalExp <
      usedExp + requiredExp
    ) {
      break;
    }

    usedExp +=
      requiredExp;

    level += 1;
  }

  const currentExp =
    totalExp -
    usedExp;

  const nextExp =
    level * 100;

  const progressRate =
    nextExp > 0
      ? (
          currentExp /
          nextExp
        ) * 100
      : 0;

  let name =
    "タマゴン";

  let image =
    "🥚";

  let message =
    `Lv.10まであと${Math.max(
      10 - level,
      0
    )}レベルです。`;

  if (level >= 20) {
    name =
      "ドラゴン";

    image =
      "🐲";

    message =
      "ドラゴンへ進化しました！";
  } else if (level >= 10) {
    name =
      "ヒナモン";

    image =
      "🐣";

    message =
      `Lv.20まであと${Math.max(
        20 - level,
        0
      )}レベルです。`;
  }

  return {
    totalExp,
    level,
    currentExp,
    nextExp,
    progressRate,
    name,
    image,
    message
  };
}


function updateMonster() {
  const status =
    getMonsterStatus();

  if (monsterName) {
    monsterName.textContent =
      status.name;
  }

  if (monsterLevel) {
    monsterLevel.textContent =
      status.level;
  }

  if (monsterExp) {
    monsterExp.textContent =
      formatNumber(
        status.currentExp
      );
  }

  if (monsterNextExp) {
    monsterNextExp.textContent =
      formatNumber(
        status.nextExp
      );
  }

  if (monsterExpBar) {
    monsterExpBar.style.width =
      `${Math.min(
        status.progressRate,
        100
      )}%`;
  }

  if (monsterMessage) {
    monsterMessage.textContent =
      status.message;
  }

  if (monsterImage) {
    monsterImage.textContent =
      status.image;
  }

  if (receivedDividendTotal) {
    receivedDividendTotal.textContent =
      formatYen(
        calculateReceivedDividendTotal()
      );
  }

  updateMonsterBook(
    status.level
  );
}


function updateMonsterBook(
  level
) {
  unlockMonsterCard(
    monsterStageEgg,
    true
  );

  unlockMonsterCard(
    monsterStageChick,
    level >= 10
  );

  unlockMonsterCard(
    monsterStageDragon,
    level >= 20
  );

  const unlockedCount =
    level >= 20
      ? 3
      : level >= 10
        ? 2
        : 1;

  if (monsterBookCount) {
    monsterBookCount.textContent =
      `${unlockedCount} / 3`;
  }
}


function unlockMonsterCard(
  element,
  unlocked
) {
  if (!element) {
    return;
  }

  element
    .classList
    .toggle(
      "unlocked",
      unlocked
    );

  element
    .classList
    .toggle(
      "locked",
      !unlocked
    );
}


function showLevelUpDialog(
  status
) {
  const levelUpMonsterImage =
    document.getElementById(
      "levelUpMonsterImage"
    );

  const levelUpTitle =
    document.getElementById(
      "levelUpTitle"
    );

  const levelUpMessage =
    document.getElementById(
      "levelUpMessage"
    );

  if (levelUpMonsterImage) {
    levelUpMonsterImage.textContent =
      status.image;
  }

  if (levelUpTitle) {
    levelUpTitle.textContent =
      `Lv.${status.level}になりました`;
  }

  if (levelUpMessage) {
    levelUpMessage.textContent =
      status.message;
  }

  levelUpDialog?.showModal();
}
// ========================================
// ダッシュボード
// ========================================

function updateDashboard() {

  const annualDividend =
    calculateAnnualDividend();

  const monthlyDividendValue =
    annualDividend / 12;

  const totalValue =
    calculatePortfolioValue();

  const monthlyExpense =
    calculateMonthlyExpense();

  const annualExpense =
    monthlyExpense * 12;

  const coverageRate =
    annualExpense > 0
      ? (
          annualDividend /
          annualExpense
        ) * 100
      : 0;

  if (totalAnnualDividend) {
    totalAnnualDividend.textContent =
      formatYen(
        annualDividend
      );
  }

  if (monthlyDividend) {
    monthlyDividend.textContent =
      formatYen(
        monthlyDividendValue
      );
  }

  if (portfolioValue) {
    portfolioValue.textContent =
      formatYen(
        totalValue
      );
  }

  if (freedomRate) {
    freedomRate.textContent =
      formatPercent(
        coverageRate
      );
  }

  if (freedomBar) {
    freedomBar.style.width =
      `${Math.min(
        coverageRate,
        100
      )}%`;
  }

  if (stockCount) {
    stockCount.textContent =
      `${portfolio.length}銘柄`;
  }

  if (summaryStockCount) {
    summaryStockCount.textContent =
      `${portfolio.length}銘柄`;
  }

  if (
    !freedomMessage ||
    !nextGoalTitle ||
    !nextGoalAmount
  ) {
    return;
  }

  if (annualExpense <= 0) {

    freedomMessage.textContent =
      "生活費を登録すると生活防衛率を計算します。";

    nextGoalTitle.textContent =
      "生活費100%達成";

    nextGoalAmount.textContent =
      "あと ¥0";

    return;
  }

  if (annualDividend <= 0) {

    freedomMessage.textContent =
      "銘柄を登録すると生活防衛率を計算します。";

    nextGoalTitle.textContent =
      "生活費100%達成";

    nextGoalAmount.textContent =
      `あと ¥${formatYen(
        annualExpense
      )}`;

    return;
  }

  if (coverageRate >= 100) {

    const surplus =
      annualDividend -
      annualExpense;

    freedomMessage.textContent =
      "年間生活費を100%カバーしています。";

    nextGoalTitle.textContent =
      "年間生活費達成";

    nextGoalAmount.textContent =
      `余剰 ¥${formatYen(
        surplus
      )}`;

    return;
  }

  const remaining =
    annualExpense -
    annualDividend;

  freedomMessage.textContent =
    `年間生活費の${formatPercent(
      coverageRate
    )}%を配当で支えています。`;

  nextGoalTitle.textContent =
    "生活費100%達成";

  nextGoalAmount.textContent =
    `あと ¥${formatYen(
      remaining
    )}`;
}


// ========================================
// ポートフォリオ
// ========================================

function sortPortfolio(
  stockItems
) {

  const copied =
    [...stockItems];

  switch (
    stockSort?.value
  ) {

    case "shares-desc":

      return copied.sort(
        (a, b) =>
          Number(b.shares) -
          Number(a.shares)
      );

    case "name-asc":

      return copied.sort(
        (a, b) =>
          String(a.name)
            .localeCompare(
              String(b.name),
              "ja"
            )
      );

    case "dividend-desc":

    default:

      return copied.sort(
        (a, b) =>
          calculateStockDividend(b) -
          calculateStockDividend(a)
      );

  }

}


function renderPortfolio() {

  if (!stockList) {
    return;
  }

  if (stockCount) {
    stockCount.textContent =
      `${portfolio.length}銘柄`;
  }

  if (summaryStockCount) {
    summaryStockCount.textContent =
      `${portfolio.length}銘柄`;
  }

  if (
    portfolio.length === 0
  ) {

    stockList.innerHTML = `
      <div class="empty-state">

        <div class="empty-icon">
          DM
        </div>

        <h3>
          保有銘柄がありません
        </h3>

        <p>
          「銘柄追加」から
          最初のポートフォリオを
          登録してください。
        </p>

      </div>
    `;

    renderDividendStockOptions();

    return;

  }

  const totalDividend =
    calculateAnnualDividend();

  const sorted =
    sortPortfolio(
      portfolio
    );

  stockList.innerHTML =
    sorted
      .map((stock) => {

        const annualDividend =
          calculateStockDividend(
            stock
          );

        const stockValue =
          Number(stock.shares) *
          Number(stock.price);

        const dividendYield =
          stockValue > 0
            ? (
                annualDividend /
                stockValue
              ) * 100
            : 0;

        const ratio =
          totalDividend > 0
            ? (
                annualDividend /
                totalDividend
              ) * 100
            : 0;

        const symbol =
          String(
            stock.name ||
            stock.code
          )
            .slice(0, 2)
            .toUpperCase();

        return `
                  <article class="stock-card">

            <div
              class="asset-symbol"
              aria-hidden="true"
            >
              ${escapeHtml(symbol)}
            </div>

            <div class="stock-info">

              <h3>
                ${escapeHtml(
                  stock.name
                )}
              </h3>

              <div class="stock-meta">

                <span>
                  ${escapeHtml(
                    stock.code
                  )}
                </span>

                <span>
                  ${formatShares(
                    stock.shares
                  )}株
                </span>

                <span>
                  1株配当
                  ${formatNumber(
                    stock.dividend
                  )}
                  ${escapeHtml(
                    stock.currency
                  )}
                </span>

              </div>

            </div>

            <div class="stock-dividend">

              <small>
                年間配当
              </small>

              <strong>
                ¥${formatYen(
                  annualDividend
                )}
              </strong>

            </div>

            <div class="stock-value">

              <div>

                <small>
                  資産評価額
                </small>

                <strong>
                  ¥${formatYen(
                    stockValue
                  )}
                </strong>

              </div>

              <small>
                配当利回り
                ${formatPercent(
                  dividendYield
                )}%
              </small>

            </div>

            <div class="stock-ratio">

              <div class="ratio-track">

                <div
                  class="ratio-bar"
                  style="width:${Math.min(
                    ratio,
                    100
                  )}%"
                ></div>

              </div>

              <small>
                ポートフォリオ比率
                ${formatPercent(
                  ratio
                )}%
              </small>

            </div>

            <div class="stock-actions">

              <button
                class="edit-stock-button"
                type="button"
                data-edit-stock="${escapeHtml(
                  stock.id
                )}"
              >
                編集
              </button>

              <button
                class="delete-stock-button"
                type="button"
                data-delete-stock="${escapeHtml(
                  stock.id
                )}"
              >
                削除
              </button>

            </div>

          </article>
        `;

      })
      .join("");

  bindPortfolioButtons();

  renderDividendStockOptions();

}


function bindPortfolioButtons() {

  document
    .querySelectorAll(
      "[data-edit-stock]"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          openEditStockDialog(
            button.dataset.editStock
          );

        }
      );

    });


  document
    .querySelectorAll(
      "[data-delete-stock]"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          deleteStock(
            button.dataset.deleteStock
          );

        }
      );

    });

}


function deleteStock(
  stockId
) {

  const stock =
    portfolio.find(
      (item) =>
        item.id === stockId
    );

  if (!stock) {
    return;
  }

  const confirmed =
    window.confirm(
      `${stock.name}を削除しますか？`
    );

  if (!confirmed) {
    return;
  }

  portfolio =
    portfolio.filter(
      (item) =>
        item.id !== stockId
    );

  saveData();

  render();

  showToast(
    `${stock.name}を削除しました。`
  );

}


// ========================================
// 生活費
// ========================================

function renderExpenses() {

  if (!expenseList) {
    return;
  }

  const monthlyExpense =
    calculateMonthlyExpense();

  if (
    monthlyExpense <= 0
  ) {

    expenseList.innerHTML = `
      <div class="empty-state compact">

        <h3>
          生活費を登録してください
        </h3>

        <p>
          住居費・食費・光熱費などを登録すると、
          配当でどこまで生活を支えられるか表示します。
        </p>

      </div>
    `;

    return;

  }

  const monthlyDividendValue =
    calculateAnnualDividend() /
    12;

  const coverageRate =
    (
      monthlyDividendValue /
      monthlyExpense
    ) * 100;

  expenseList.innerHTML = `
    <article class="expense-card">

      <div class="expense-top">

        <h3>
          毎月の生活費
        </h3>

        <strong
          class="expense-rate ${
            coverageRate >= 100
              ? "complete"
              : ""
          }"
        >
          ${formatPercent(
            coverageRate
          )}%
        </strong>

      </div>

      <div class="expense-values">

        月平均配当
        ¥${formatYen(
          monthlyDividendValue
        )}

        ／

        毎月の生活費
        ¥${formatYen(
          monthlyExpense
        )}

      </div>

      <div class="expense-track">

        <div
          class="expense-progress"
          style="width:${Math.min(
            coverageRate,
            100
          )}%"
        ></div>

      </div>

    </article>
  `;

}


// ========================================
// 配当履歴
// ========================================

function renderDividendStockOptions() {

  if (!dividendStockCode) {
    return;
  }

  const currentValue =
    dividendStockCode.value;

  dividendStockCode.innerHTML = `
    <option value="">
      銘柄を選択
    </option>

    ${portfolio
      .map(
        (stock) => `
          <option
            value="${escapeHtml(
              stock.code
            )}"
          >
            ${escapeHtml(
              stock.name
            )}
            （${escapeHtml(
              stock.code
            )}）
          </option>
        `
      )
      .join("")}
  `;

  if (
    portfolio.some(
      (stock) =>
        stock.code ===
        currentValue
    )
  ) {

    dividendStockCode.value =
      currentValue;

  }

}


function renderDividendHistory() {

  if (!dividendHistoryList) {
    return;
  }

  if (
    dividendHistory.length === 0
  ) {

    dividendHistoryList.innerHTML = `
      <div class="empty-state compact">

        <h3>
          配当履歴はまだありません
        </h3>

        <p>
          配当を受け取ったら記録して、
          モンスターにEXPを与えましょう。
        </p>

      </div>
    `;

    return;

  }

  const sortedHistory =
    [...dividendHistory]
      .sort(
        (a, b) => {

          const dateDifference =
            new Date(
              b.date
            ).getTime() -
            new Date(
              a.date
            ).getTime();

          if (
            dateDifference !== 0
          ) {
            return dateDifference;
          }

          return (
            new Date(
              b.createdAt || 0
            ).getTime() -
            new Date(
              a.createdAt || 0
            ).getTime()
          );

        }
      );

  dividendHistoryList.innerHTML =
    sortedHistory
      .map(
        (record) => `
          <article class="history-card">

            <div class="history-main">

              <h3>
                ${escapeHtml(
                  record.stockName
                )}
              </h3>

              <p class="history-meta">

                ${formatDate(
                  record.date
                )}

                ${
                  record.memo
                    ? `・${escapeHtml(
                        record.memo
                      )}`
                    : ""
                }

              </p>

            </div>

            <strong class="history-amount">
              ¥${formatYen(
                record.amount
              )}
            </strong>

            <button
              class="history-delete-button"
              type="button"
              data-delete-history="${escapeHtml(
                record.id
              )}"
            >
              削除
            </button>

          </article>
        `
      )
      .join("");

  document
    .querySelectorAll(
      "[data-delete-history]"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          deleteDividendHistory(
            button.dataset
              .deleteHistory
          );

        }
      );

    });

}
function deleteDividendHistory(
  historyId
) {

  const record =
    dividendHistory.find(
      (item) =>
        item.id === historyId
    );

  if (!record) {
    return;
  }

  const confirmed =
    window.confirm(
      `${record.stockName}の配当記録を削除しますか？`
    );

  if (!confirmed) {
    return;
  }

  dividendHistory =
    dividendHistory.filter(
      (item) =>
        item.id !== historyId
    );

  saveData();

  render();

  showToast(
    "配当記録を削除しました。"
  );

}


function clearDividendHistory() {

  if (
    dividendHistory.length === 0
  ) {

    showToast(
      "削除する配当履歴がありません。"
    );

    return;

  }

  const confirmed =
    window.confirm(
      "配当履歴をすべて削除しますか？"
    );

  if (!confirmed) {
    return;
  }

  dividendHistory = [];

  saveData();

  render();

  showToast(
    "配当履歴をすべて削除しました。"
  );

}


// ========================================
// 配当カレンダー
// ========================================

function renderDividendCalendar() {

  if (
    !dividendCalendar ||
    !calendarYear
  ) {
    return;
  }

  const currentYear =
    new Date()
      .getFullYear();

  calendarYear.textContent =
    `${currentYear}年`;

  const monthlyTotals =
    Array(12)
      .fill(0);

  dividendHistory
    .filter((record) => {

      const date =
        parseLocalDate(
          record.date
        );

      return (
        date &&
        date.getFullYear() ===
        currentYear
      );

    })
    .forEach((record) => {

      const date =
        parseLocalDate(
          record.date
        );

      if (!date) {
        return;
      }

      const month =
        date.getMonth();

      monthlyTotals[month] +=
        Number(
          record.amount || 0
        );

    });

  dividendCalendar.innerHTML =
    monthlyTotals
      .map(
        (amount, index) => `
          <article class="month-item">

            <span>
              ${index + 1}月
            </span>

            <strong>
              ¥${formatYen(
                amount
              )}
            </strong>

          </article>
        `
      )
      .join("");

}


// ========================================
// ナビゲーション
// ========================================

document
  .querySelectorAll(
    "[data-scroll-target]"
  )
  .forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(
            ".nav-button"
          )
          .forEach(
            (navButton) => {

              navButton
                .classList
                .remove(
                  "active"
                );

            }
          );

        button
          .classList
          .add(
            "active"
          );

        const targetId =
          button.dataset
            .scrollTarget;

        if (
          targetId === "top"
        ) {

          window.scrollTo({
            top: 0,
            behavior: "smooth"
          });

          return;

        }

        const target =
          document
            .getElementById(
              targetId
            );

        if (target) {

          target.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });

        }

      }
    );

  });


// ========================================
// データ移行
// ========================================

function migratePortfolioData() {

  portfolio =
    portfolio.map(
      (stock) => {

        const matched =
          findStock(
            String(
              stock.code ||
              stock.name ||
              ""
            )
              .toUpperCase()
          );

        const stockInfo =
          matched?.stock ||
          {};

        return {

          id:
            stock.id ||
            createId(),

          code:
            stock.code ||
            matched?.code ||
            "",

          name:
            stock.name ||
            stockInfo.name ||
            "名称未登録",

          shares:
            Number(
              stock.shares ||
              0
            ),

          dividend:
            Number(
              stock.dividend ??
              stock.dividendPerShare ??
              stockInfo
                .annualDividendPerShare ??
              0
            ),

          price:
            Number(
              stock.price ??
              stockInfo.currentPrice ??
              0
            ),

          type:
            stock.type ||
            stockInfo.sector ||
            "other",

          market:
            stock.market ||
            stockInfo.market ||
            "JP",

          currency:
            stock.currency ||
            stockInfo.currency ||
            "JPY"

        };

      }
    );

  saveData();

}


// ========================================
// 共通
// ========================================

function render() {

  updateDashboard();

  updateMonster();

  renderPortfolio();

  renderExpenses();

  renderDividendHistory();

  renderDividendCalendar();

}


async function initializeApp() {

  loadData();

  await loadStockDatabase();

  migratePortfolioData();

  render();

}


function showStockError(
  message
) {

  if (!stockFormError) {
    return;
  }

  stockFormError.textContent =
    message;

  stockFormError.hidden =
    false;

}


function hideStockError() {

  if (!stockFormError) {
    return;
  }

  stockFormError.textContent =
    "";

  stockFormError.hidden =
    true;

}


function showDividendError(
  message
) {

  if (!dividendFormError) {
    return;
  }

  dividendFormError.textContent =
    message;

  dividendFormError.hidden =
    false;

}


function hideDividendError() {

  if (!dividendFormError) {
    return;
  }

  dividendFormError.textContent =
    "";

  dividendFormError.hidden =
    true;

}


function showToast(
  message
) {

  if (!toast) {
    return;
  }

  toast.textContent =
    message;

  toast.classList.add(
    "show"
  );

  clearTimeout(
    showToast.timer
  );

  showToast.timer =
    setTimeout(
      () => {

        toast
          .classList
          .remove(
            "show"
          );

      },
      2500
    );

}


function setInputValue(
  elementId,
  value
) {

  const element =
    document
      .getElementById(
        elementId
      );

  if (!element) {
    return;
  }

  element.value =
    Number(
      value || 0
    ) > 0
      ? value
      : "";

}


function getNonNegativeNumber(
  elementId
) {

  const element =
    document
      .getElementById(
        elementId
      );

  const value =
    Number(
      element?.value
    );

  if (
    !Number.isFinite(value) ||
    value < 0
  ) {
    return 0;
  }

  return value;

}


function createId() {

  if (
    window.crypto &&
    typeof window.crypto
      .randomUUID ===
      "function"
  ) {

    return window.crypto
      .randomUUID();

  }

  return (
    `${Date.now()}-` +
    Math.random()
      .toString(16)
      .slice(2)
  );

}


function formatYen(
  value
) {

  return Math.round(
    Number(value) || 0
  )
    .toLocaleString(
      "ja-JP"
    );

}


function formatNumber(
  value
) {

  return Number(
    value || 0
  )
    .toLocaleString(
      "ja-JP",
      {
        maximumFractionDigits: 4
      }
    );

}


function formatShares(
  value
) {

  return Number(
    value || 0
  )
    .toLocaleString(
      "ja-JP",
      {
        maximumFractionDigits: 4
      }
    );

}


function formatPercent(
  value
) {

  const number =
    Number(value);

  if (
    !Number.isFinite(number) ||
    number <= 0
  ) {
    return "0";
  }

  if (
    number >= 100
  ) {
    return "100";
  }

  return number
    .toFixed(1);

}


function parseLocalDate(
  dateString
) {

  const match =
    String(
      dateString || ""
    )
      .match(
        /^(\d{4})-(\d{2})-(\d{2})$/
      );

  if (!match) {
    return null;
  }

  const [
    ,
    year,
    month,
    day
  ] = match;

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day)
  );

}


function formatDate(
  dateString
) {

  const date =
    parseLocalDate(
      dateString
    );

  if (!date) {
    return dateString;
  }

  return date
    .toLocaleDateString(
      "ja-JP",
      {
        year: "numeric",
        month: "short",
        day: "numeric"
      }
    );

}


function getLocalDateString(
  date
) {

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    )
      .padStart(
        2,
        "0"
      );

  const day =
    String(
      date.getDate()
    )
      .padStart(
        2,
        "0"
      );

  return (
    `${year}-` +
    `${month}-` +
    `${day}`
  );

}


function escapeHtml(
  value
) {

  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}


// ========================================
// 起動
// ========================================

initializeApp();
