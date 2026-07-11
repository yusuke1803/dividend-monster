// Dividend Monsters Ver.2
// script.js 1/4

const STORAGE_KEY = "dividend-monsters-data-v1";

let portfolio = [];
let expenses = {};
let stockDatabase = {};
let editingStockId = null;

const stockList = document.getElementById("stockList");
const stockCount = document.getElementById("stockCount");
const stockSort = document.getElementById("stockSort");

const totalAnnualDividend =
  document.getElementById("totalAnnualDividend");

const monthlyDividend =
  document.getElementById("monthlyDividend");

const freedomRate =
  document.getElementById("freedomRate");

const freedomBar =
  document.getElementById("freedomBar");

const freedomMessage =
  document.getElementById("freedomMessage");

const nextGoalTitle =
  document.getElementById("nextGoalTitle");

const nextGoalAmount =
  document.getElementById("nextGoalAmount");

const expenseList =
  document.getElementById("expenseList");

const toast =
  document.getElementById("toast");

const stockDialog =
  document.getElementById("stockDialog");

const expenseDialog =
  document.getElementById("expenseDialog");

const stockForm =
  document.getElementById("stockForm");

const expenseForm =
  document.getElementById("expenseForm");

const stockFormError =
  document.getElementById("stockFormError");

const stockDialogTitle =
  document.getElementById("stockDialogTitle");

const stockSubmitButton =
  document.getElementById("stockSubmitButton");

document
  .getElementById("openStockFormButton")
  .addEventListener("click", openNewStockDialog);

document
  .getElementById("openExpenseFormButton")
  .addEventListener("click", openExpenseDialog);

document
  .querySelectorAll("[data-close-dialog]")
  .forEach((button) => {
    button.addEventListener("click", () => {
      const dialogId =
        button.dataset.closeDialog;

      document
        .getElementById(dialogId)
        .close();
    });
  });

stockSort.addEventListener("change", () => {
  renderPortfolio();
});

stockDialog.addEventListener("close", () => {
  resetStockForm();
});

function openNewStockDialog() {
  editingStockId = null;

  stockForm.reset();

  hideStockError();

  stockDialogTitle.textContent =
    "銘柄を追加";

  stockSubmitButton.textContent =
    "ポートフォリオに追加";

  stockDialog.showModal();
}

function openEditStockDialog(stockId) {
  const stock = portfolio.find(
    (item) => item.id === stockId
  );

  if (!stock) {
    return;
  }

  editingStockId = stockId;

  hideStockError();

  document.getElementById("stockCode").value =
    stock.code;

  document.getElementById("shareCount").value =
    stock.shares;

  stockDialogTitle.textContent =
    "銘柄を編集";

  stockSubmitButton.textContent =
    "変更を保存";

  stockDialog.showModal();
}

function openExpenseDialog() {
  document.getElementById(
    "housingExpense"
  ).value = expenses.housing || "";

  document.getElementById(
    "foodExpense"
  ).value = expenses.food || "";

  document.getElementById(
    "utilityExpense"
  ).value = expenses.utility || "";

  document.getElementById(
    "communicationExpense"
  ).value = expenses.communication || "";

  document.getElementById(
    "otherExpense"
  ).value = expenses.other || "";

  expenseDialog.showModal();
}

function resetStockForm() {
  editingStockId = null;

  stockForm.reset();

  hideStockError();

  stockDialogTitle.textContent =
    "銘柄を追加";

  stockSubmitButton.textContent =
    "ポートフォリオに追加";
}

function showStockError(message) {
  stockFormError.textContent = message;
  stockFormError.hidden = false;
}

function hideStockError() {
  stockFormError.textContent = "";
  stockFormError.hidden = true;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

function saveData() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      portfolio,
      expenses
    })
  );
}

function loadData() {
  try {
    const savedData =
      localStorage.getItem(STORAGE_KEY);

    if (!savedData) {
      return;
    }

    const parsedData =
      JSON.parse(savedData);

    portfolio =
      Array.isArray(parsedData.portfolio)
        ? parsedData.portfolio
        : [];

    expenses =
      parsedData.expenses || {};
  } catch (error) {
    console.error(
      "保存データの読み込みに失敗しました。",
      error
    );

    portfolio = [];
    expenses = {};
  }
}

async function loadStockDatabase() {
  try {
    const response =
      await fetch("./stocks.json", {
        cache: "no-store"
      });

    if (!response.ok) {
      throw new Error(
        "stocks.jsonを取得できませんでした。"
      );
    }

    stockDatabase =
      await response.json();
  } catch (error) {
    console.error(
      "銘柄データの読み込みに失敗しました。",
      error
    );

    stockDatabase = {};

    showToast(
      "銘柄データを読み込めませんでした。"
    );
  }
}

stockForm.addEventListener(
  "submit",
  (event) => {
    event.preventDefault();

    hideStockError();

    const code =
      document
        .getElementById("stockCode")
        .value
        .trim()
        .toUpperCase();

    const shares =
      Number(
        document.getElementById(
          "shareCount"
        ).value
      );

    if (!code) {
      showStockError(
        "銘柄コードを入力してください。"
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

    const stockInfo =
      stockDatabase[code];

    if (!stockInfo) {
      showStockError(
        "この銘柄コードは登録されていません。"
      );
      return;
    }

    if (
      stockInfo.dataStatus ===
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
      name: stockInfo.name,
      shares,

      dividend:
        Number(
          stockInfo
            .annualDividendPerShare
        ),

      type:
        stockInfo.sector ||
        "other",

      market:
        stockInfo.market ||
        "JP",

      currency:
        stockInfo.currency ||
        "JPY"
    };

    if (editingStockId) {
      portfolio =
        portfolio.map((stock) =>
          stock.id === editingStockId
            ? stockData
            : stock
        );

      showToast(
        `${stockData.name}を更新しました。`
      );
    } else {
      portfolio.push(stockData);

      showToast(
        `${stockData.name}を追加しました。`
      );
    }

    saveData();
    stockDialog.close();
    render();
  }
); 
expenseForm.addEventListener(
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

    expenseDialog.close();

    showToast(
      "生活費を保存しました。"
    );

    render();
  }
);

function getNonNegativeNumber(
  elementId
) {
  const value =
    Number(
      document.getElementById(
        elementId
      ).value
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
      .randomUUID === "function"
  ) {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()}`;
}

function calculateStockDividend(
  stock
) {
  return (
    Number(stock.shares) *
    Number(stock.dividend)
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

function calculateMonthlyExpense() {
  return Object.values(
    expenses
  ).reduce(
    (total, value) =>
      total +
      Number(value || 0),
    0
  );
}

function formatYen(value) {
  return Math.round(
    Number(value) || 0
  ).toLocaleString("ja-JP");
}

function formatShares(value) {
  return Number(
    value || 0
  ).toLocaleString(
    "ja-JP",
    {
      maximumFractionDigits: 4
    }
  );
}

function formatPercent(value) {
  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    return "0";
  }

  if (value >= 100) {
    return "100";
  }

  return value.toFixed(1);
}

function updateDashboard() {
  const annualDividend =
    calculateAnnualDividend();

  const monthlyDividendValue =
    annualDividend / 12;

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

  totalAnnualDividend.textContent =
    formatYen(
      annualDividend
    );

  monthlyDividend.textContent =
    formatYen(
      monthlyDividendValue
    );

  freedomRate.textContent =
    formatPercent(
      coverageRate
    );

  freedomBar.style.width =
    `${Math.min(
      coverageRate,
      100
    )}%`;

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

function sortPortfolio(
  stockItems
) {
  const copiedStocks =
    [...stockItems];

  switch (
    stockSort.value
  ) {
    case "shares-desc":
      return copiedStocks.sort(
        (a, b) =>
          Number(b.shares) -
          Number(a.shares)
      );

    case "name-asc":
      return copiedStocks.sort(
        (a, b) =>
          a.name.localeCompare(
            b.name,
            "ja"
          )
      );

    case "dividend-desc":
    default:
      return copiedStocks.sort(
        (a, b) =>
          calculateStockDividend(
            b
          ) -
          calculateStockDividend(
            a
          )
      );
  }
}
function renderPortfolio() {
  stockCount.textContent =
    `${portfolio.length}銘柄`;

  if (portfolio.length === 0) {
    stockList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          DM
        </div>

        <h3>
          保有銘柄がありません
        </h3>

        <p>
          「銘柄追加」から最初のポートフォリオを登録してください。
        </p>
      </div>
    `;

    return;
  }

  const sortedPortfolio =
    sortPortfolio(portfolio);

  stockList.innerHTML =
    sortedPortfolio
      .map((stock) => {
        const annualDividend =
          calculateStockDividend(stock);

        const symbolText =
          String(stock.name || stock.code)
            .slice(0, 2)
            .toUpperCase();

        return `
          <article class="stock-card">

            <div
              class="asset-symbol"
              aria-hidden="true"
            >
              ${escapeHtml(symbolText)}
            </div>

            <div class="stock-info">

              <h3>
                ${escapeHtml(stock.name)}
              </h3>

              <div class="stock-meta">

                <span>
                  ${escapeHtml(stock.code || "登録済み")}
                </span>

                <span>
                  ${formatShares(stock.shares)}株
                </span>

                <span>
                  1株配当
                  ¥${formatYen(stock.dividend)}
                </span>

              </div>

            </div>

            <div class="stock-dividend">

              <small>
                年間配当
              </small>

              <strong>
                ¥${formatYen(annualDividend)}
              </strong>

            </div>

            <div class="stock-actions">

              <button
                class="edit-stock-button"
                type="button"
                data-edit-stock="${escapeHtml(stock.id)}"
                aria-label="${escapeHtml(stock.name)}を編集"
              >
                編集
              </button>

              <button
                class="delete-stock-button"
                type="button"
                data-delete-stock="${escapeHtml(stock.id)}"
                aria-label="${escapeHtml(stock.name)}を削除"
              >
                削除
              </button>

            </div>

          </article>
        `;
      })
      .join("");

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

function deleteStock(stockId) {
  const targetStock =
    portfolio.find(
      (stock) =>
        stock.id === stockId
    );

  if (!targetStock) {
    return;
  }

  const confirmed =
    window.confirm(
      `${targetStock.name}を削除しますか？`
    );

  if (!confirmed) {
    return;
  }

  portfolio =
    portfolio.filter(
      (stock) =>
        stock.id !== stockId
    );

  saveData();
  render();

  showToast(
    `${targetStock.name}を削除しました。`
  );
}

function renderExpenses() {
  const monthlyExpense =
    calculateMonthlyExpense();

  if (monthlyExpense <= 0) {
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
    calculateAnnualDividend() / 12;

  const coverageRate =
    (
      monthlyDividendValue /
      monthlyExpense
    ) * 100;

  const displayedRate =
    Math.min(
      coverageRate,
      100
    );

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
          ${formatPercent(coverageRate)}%
        </strong>

      </div>

      <div class="expense-values">

        月平均配当
        ¥${formatYen(monthlyDividendValue)}

        ／

        毎月の生活費
        ¥${formatYen(monthlyExpense)}

      </div>

      <div class="expense-track">

        <div
          class="expense-progress"
          style="width:${displayedRate}%"
        ></div>

      </div>

    </article>
  `;
}

function migratePortfolioData() {
  portfolio =
    portfolio.map((stock) => {
      const matchedEntry =
        Object.values(
          stockDatabase
        ).find(
          (entry) =>
            entry.name === stock.name
        );

      return {
        id:
          stock.id ||
          createId(),

        code:
          stock.code ||
          matchedEntry?.ticker ||
          "",

        name:
          stock.name ||
          matchedEntry?.name ||
          "名称未登録",

        shares:
          Number(
            stock.shares || 0
          ),

        dividend:
          Number(
            stock.dividend ??
            stock.dividendPerShare ??
            matchedEntry
              ?.annualDividendPerShare ??
            0
          ),

        type:
          stock.type ||
          matchedEntry?.sector ||
          "other",

        market:
          stock.market ||
          matchedEntry?.market ||
          "JP",

        currency:
          stock.currency ||
          matchedEntry?.currency ||
          "JPY"
      };
    });

  saveData();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function render() {
  updateDashboard();
  renderPortfolio();
  renderExpenses();
}

async function initializeApp() {
  loadData();

  await loadStockDatabase();

  migratePortfolioData();

  render();
}

initializeApp();
