const STORAGE_KEYS = {
  stocks: "dividendMonstersStocks",
  expenses: "dividendMonstersExpenses",
  sort: "dividendMonstersSort"
};

const stockTypeLabels = {
  communication: "通信",
  finance: "金融",
  trading: "商社",
  reit: "REIT",
  etf: "ETF",
  technology: "テクノロジー",
  energy: "エネルギー",
  other: "その他"
};

const defaultExpenses = {
  housing: 0,
  food: 0,
  utility: 0,
  communication: 0,
  other: 0
};

let stocks = loadData(STORAGE_KEYS.stocks, []);
let expenses = loadData(
  STORAGE_KEYS.expenses,
  defaultExpenses
);
let sortMode =
  localStorage.getItem(STORAGE_KEYS.sort) ||
  "dividend-desc";
let editingStockId = null;

const totalAnnualDividendElement =
  document.getElementById("totalAnnualDividend");
const monthlyDividendElement =
  document.getElementById("monthlyDividend");
const freedomRateElement =
  document.getElementById("freedomRate");
const freedomBarElement =
  document.getElementById("freedomBar");
const freedomMessageElement =
  document.getElementById("freedomMessage");
const stockCountElement =
  document.getElementById("stockCount");
const stockListElement =
  document.getElementById("stockList");
const expenseListElement =
  document.getElementById("expenseList");

const stockDialog =
  document.getElementById("stockDialog");
const expenseDialog =
  document.getElementById("expenseDialog");
const stockForm =
  document.getElementById("stockForm");
const expenseForm =
  document.getElementById("expenseForm");

const stockDialogTitle =
  stockDialog.querySelector(".dialog-header h2");
const stockSubmitButton =
  stockForm.querySelector(".primary-button");

createSortControl();

document
  .getElementById("openStockFormButton")
  .addEventListener("click", openNewStockDialog);

document
  .getElementById("openExpenseFormButton")
  .addEventListener("click", () => {
    fillExpenseForm();
    expenseDialog.showModal();
  });

document
  .querySelectorAll("[data-close-dialog]")
  .forEach((button) => {
    button.addEventListener("click", () => {
      const dialogId =
        button.getAttribute("data-close-dialog");

      document.getElementById(dialogId).close();
    });
  });

stockDialog.addEventListener("close", resetStockForm);

stockForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name =
    document.getElementById("stockName").value.trim();
  const shares =
    Number(document.getElementById("shareCount").value);
  const dividendPerShare =
    Number(
      document.getElementById("dividendPerShare").value
    );
  const type =
    document.getElementById("stockType").value;

  if (
    !name ||
    !Number.isFinite(shares) ||
    !Number.isFinite(dividendPerShare) ||
    shares <= 0 ||
    dividendPerShare < 0
  ) {
    alert(
      "銘柄名、株数、1株あたり年間配当を確認してください。"
    );
    return;
  }

  if (editingStockId) {
    stocks = stocks.map((stock) => {
      if (stock.id !== editingStockId) {
        return stock;
      }

      return {
        ...stock,
        name,
        shares,
        dividendPerShare,
        type
      };
    });
  } else {
    stocks.push({
      id: createId(),
      name,
      shares,
      dividendPerShare,
      type
    });
  }

  saveData(STORAGE_KEYS.stocks, stocks);
  stockDialog.close();
  render();
});

expenseForm.addEventListener("submit", (event) => {
  event.preventDefault();

  expenses = {
    housing: getNonNegativeNumber("housingExpense"),
    food: getNonNegativeNumber("foodExpense"),
    utility: getNonNegativeNumber("utilityExpense"),
    communication:
      getNonNegativeNumber("communicationExpense"),
    other: getNonNegativeNumber("otherExpense")
  };

  saveData(STORAGE_KEYS.expenses, expenses);
  expenseDialog.close();
  render();
});

function openNewStockDialog() {
  editingStockId = null;
  stockForm.reset();
  stockDialogTitle.textContent = "銘柄を追加";
  stockSubmitButton.textContent = "軍団に追加する";
  stockDialog.showModal();
}

function openEditStockDialog(stockId) {
  const stock =
    stocks.find((item) => item.id === stockId);

  if (!stock) {
    return;
  }

  editingStockId = stockId;

  document.getElementById("stockName").value =
    stock.name;
  document.getElementById("shareCount").value =
    stock.shares;
  document.getElementById(
    "dividendPerShare"
  ).value = stock.dividendPerShare;
  document.getElementById("stockType").value =
    stock.type;

  stockDialogTitle.textContent = "銘柄を編集";
  stockSubmitButton.textContent = "変更を保存する";
  stockDialog.showModal();
}

function resetStockForm() {
  editingStockId = null;
  stockForm.reset();
  stockDialogTitle.textContent = "銘柄を追加";
  stockSubmitButton.textContent = "軍団に追加する";
}

function createSortControl() {
  const heading =
    stockCountElement.closest(".section-heading");

  if (!heading) {
    return;
  }

  const controls = document.createElement("div");
  controls.className = "stock-heading-controls";

  const select = document.createElement("select");
  select.id = "stockSort";
  select.className = "sort-select";
  select.setAttribute("aria-label", "銘柄の並び順");

  select.innerHTML = `
    <option value="dividend-desc">
      年間配当が多い順
    </option>
    <option value="dividend-asc">
      年間配当が少ない順
    </option>
    <option value="name-asc">
      銘柄名順
    </option>
    <option value="shares-desc">
      株数が多い順
    </option>
  `;

  select.value = sortMode;

  select.addEventListener("change", () => {
    sortMode = select.value;
    localStorage.setItem(
      STORAGE_KEYS.sort,
      sortMode
    );
    renderStocks();
  });

  stockCountElement.replaceWith(controls);
  controls.append(stockCountElement, select);
}

function render() {
  renderSummary();
  renderStocks();
  renderExpenses();
}

function renderSummary() {
  const totalAnnualDividend =
    calculateTotalAnnualDividend();
  const monthlyDividend =
    totalAnnualDividend / 12;
  const annualExpenses =
    calculateMonthlyExpensesTotal() * 12;

  const freedomRate =
    annualExpenses > 0
      ? (totalAnnualDividend / annualExpenses) * 100
      : 0;

  totalAnnualDividendElement.textContent =
    formatNumber(totalAnnualDividend);

  monthlyDividendElement.textContent =
    formatNumber(monthlyDividend);

  freedomRateElement.textContent =
    formatPercent(freedomRate);

  freedomBarElement.style.width =
    Math.min(freedomRate, 100) + "%";

  freedomMessageElement.textContent =
    createFreedomMessage(
      totalAnnualDividend,
      annualExpenses,
      freedomRate
    );
}

function renderStocks() {
  stockCountElement.textContent =
    `${stocks.length}体`;

  if (stocks.length === 0) {
    stockListElement.innerHTML = `
      <div class="empty-state">
        <div class="empty-orb"></div>
        <h3>まだ軍団はいません</h3>
        <p>
          銘柄・株数・1株配当を登録すると、
          配当を表す個体が誕生します。
        </p>
      </div>
    `;
    return;
  }

  const sortedStocks = sortStocks(stocks);

  stockListElement.innerHTML =
    sortedStocks
      .map((stock) => {
        const annualDividend =
          calculateStockDividend(stock);

        return `
          <article class="stock-card">
            <div
              class="creature-mark"
              aria-hidden="true"
            ></div>

            <div>
              <h3>${escapeHtml(stock.name)}</h3>

              <div class="stock-meta">
                <span>
                  ${formatNumber(stock.shares)}株
                </span>

                <span>
                  1株配当
                  ¥${formatNumber(
                    stock.dividendPerShare
                  )}
                </span>

                <span>
                  ${
                    stockTypeLabels[stock.type] ||
                    stockTypeLabels.other
                  }
                </span>
              </div>
            </div>

            <div class="stock-dividend">
              <span>年間配当</span>
              <strong>
                ¥${formatNumber(annualDividend)}
              </strong>
            </div>

            <div class="stock-actions">
              <button
                class="edit-stock-button"
                type="button"
                data-edit-stock="${stock.id}"
              >
                編集
              </button>

              <button
                class="delete-stock-button"
                type="button"
                data-delete-stock="${stock.id}"
              >
                削除
              </button>
            </div>
          </article>
        `;
      })
      .join("");

  document
    .querySelectorAll("[data-edit-stock]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        openEditStockDialog(
          button.getAttribute("data-edit-stock")
        );
      });
    });

  document
    .querySelectorAll("[data-delete-stock]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        deleteStock(
          button.getAttribute("data-delete-stock")
        );
      });
    });
}

function sortStocks(stockItems) {
  const copiedStocks = [...stockItems];

  switch (sortMode) {
    case "dividend-asc":
      return copiedStocks.sort(
        (a, b) =>
          calculateStockDividend(a) -
          calculateStockDividend(b)
      );

    case "name-asc":
      return copiedStocks.sort((a, b) =>
        a.name.localeCompare(b.name, "ja")
      );

    case "shares-desc":
      return copiedStocks.sort(
        (a, b) => b.shares - a.shares
      );

    case "dividend-desc":
    default:
      return copiedStocks.sort(
        (a, b) =>
          calculateStockDividend(b) -
          calculateStockDividend(a)
      );
  }
}

function deleteStock(stockId) {
  const targetStock =
    stocks.find((stock) => stock.id === stockId);

  if (!targetStock) {
    return;
  }

  const confirmed = confirm(
    `${targetStock.name}を削除しますか？`
  );

  if (!confirmed) {
    return;
  }

  stocks = stocks.filter(
    (stock) => stock.id !== stockId
  );

  saveData(STORAGE_KEYS.stocks, stocks);
  render();
}

function renderExpenses() {
  const expenseItems = [
    { key: "housing", label: "住居費" },
    { key: "food", label: "食費" },
    { key: "utility", label: "光熱費" },
    { key: "communication", label: "通信費" },
    { key: "other", label: "その他" }
  ];

  const activeExpenses =
    expenseItems.filter(
      (item) => expenses[item.key] > 0
    );

  if (activeExpenses.length === 0) {
    expenseListElement.innerHTML = `
      <div class="empty-state compact">
        <h3>生活費を登録してください</h3>
        <p>
          家賃、食費、光熱費などを
          配当でどこまで支えられるか計算します。
        </p>
      </div>
    `;
    return;
  }

  const totalAnnualDividend =
    calculateTotalAnnualDividend();

  let remainingDividend =
    totalAnnualDividend;

  expenseListElement.innerHTML =
    activeExpenses
      .map((item) => {
        const annualExpense =
          expenses[item.key] * 12;

        const coveredAmount =
          Math.min(
            remainingDividend,
            annualExpense
          );

        const coverageRate =
          annualExpense > 0
            ? (coveredAmount / annualExpense) * 100
            : 0;

        remainingDividend =
          Math.max(
            remainingDividend - annualExpense,
            0
          );

        return `
          <article class="expense-card">
            <div class="expense-top">
              <h3>${item.label}</h3>

              <strong>
                ${formatPercent(coverageRate)}%
              </strong>
            </div>

            <div class="expense-values">
              年間
              ¥${formatNumber(annualExpense)}
              のうち
              ¥${formatNumber(coveredAmount)}
            </div>

            <div class="expense-track">
              <div
                class="expense-progress"
                style="width:
                  ${Math.min(
                    coverageRate,
                    100
                  )}%"
              ></div>
            </div>
          </article>
        `;
      })
      .join("");
}

function calculateStockDividend(stock) {
  return stock.shares * stock.dividendPerShare;
}

function calculateTotalAnnualDividend() {
  return stocks.reduce(
    (total, stock) =>
      total + calculateStockDividend(stock),
    0
  );
}

function calculateMonthlyExpensesTotal() {
  return Object.values(expenses).reduce(
    (total, value) =>
      total + Number(value || 0),
    0
  );
}

function createFreedomMessage(
  totalAnnualDividend,
  annualExpenses,
  freedomRate
) {
  if (annualExpenses <= 0) {
    return "生活費を登録すると、配当で支えられる割合が表示されます。";
  }

  if (totalAnnualDividend <= 0) {
    return "銘柄を登録すると、生活費カバー率が計算されます。";
  }

  if (freedomRate >= 100) {
    const surplus =
      totalAnnualDividend - annualExpenses;

    return `年間生活費を100%カバーしています。余剰配当は約¥${formatNumber(
      surplus
    )}です。`;
  }

  const remaining =
    annualExpenses - totalAnnualDividend;

  return `年間生活費100%まで、あと約¥${formatNumber(
    remaining
  )}です。`;
}

function fillExpenseForm() {
  document.getElementById(
    "housingExpense"
  ).value = expenses.housing;

  document.getElementById(
    "foodExpense"
  ).value = expenses.food;

  document.getElementById(
    "utilityExpense"
  ).value = expenses.utility;

  document.getElementById(
    "communicationExpense"
  ).value = expenses.communication;

  document.getElementById(
    "otherExpense"
  ).value = expenses.other;
}

function getNonNegativeNumber(elementId) {
  const value =
    Number(
      document.getElementById(elementId).value
    );

  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return value;
}

function createId() {
  if (
    window.crypto &&
    typeof window.crypto.randomUUID === "function"
  ) {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()}`;
}

function formatNumber(value) {
  return Math.round(value).toLocaleString("ja-JP");
}

function formatPercent(value) {
  if (!Number.isFinite(value)) {
    return "0";
  }

  if (value >= 100) {
    return "100";
  }

  return value.toFixed(1);
}

function saveData(key, value) {
  localStorage.setItem(
    key,
    JSON.stringify(value)
  );
}

function loadData(key, fallbackValue) {
  try {
    const storedValue =
      localStorage.getItem(key);

    if (!storedValue) {
      return fallbackValue;
    }

    return JSON.parse(storedValue);
  } catch (error) {
    console.error(
      "保存データの読み込みに失敗しました。",
      error
    );

    return fallbackValue;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

render();
