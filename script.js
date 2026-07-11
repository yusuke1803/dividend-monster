// ===============================
// Dividend Monsters Ver.1 Final
// script.js Part 1/6
// ===============================

const STORAGE_KEY = "dividend-monsters-data-v1";

let portfolio = [];
let expenses = {};

let editingIndex = -1;

// --------------------
// DOM
// --------------------

const stockList = document.getElementById("stockList");
const stockCount = document.getElementById("stockCount");

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

// --------------------
// Buttons
// --------------------

document
.getElementById("openStockFormButton")
.addEventListener("click", () => {

    editingIndex = -1;

    document
    .getElementById("stockForm")
    .reset();

    document
    .getElementById("stockDialogTitle")
    .textContent = "銘柄を追加";

    stockDialog.showModal();

});

document
.getElementById("openExpenseFormButton")
.addEventListener("click", () => {

    loadExpenseForm();

    expenseDialog.showModal();

});

// --------------------
// Close Dialog
// --------------------

document
.querySelectorAll("[data-close-dialog]")
.forEach(button => {

    button.addEventListener("click", () => {

        const dialog =
        document.getElementById(
            button.dataset.closeDialog
        );

        dialog.close();

    });

});

// --------------------
// Save
// --------------------

function saveData(){

    localStorage.setItem(

        STORAGE_KEY,

        JSON.stringify({

            portfolio,

            expenses

        })

    );

}

function loadData(){

    const data =
    JSON.parse(
        localStorage.getItem(STORAGE_KEY)
    );

    if(!data){

        return;

    }

    portfolio =
    data.portfolio || [];

    expenses =
    data.expenses || {};

}
// ===============================
// Dividend Monsters Ver.1 Final
// script.js Part 2/6
// ===============================

// --------------------
// Toast
// --------------------

function showToast(message){

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {

        toast.classList.remove("show");

    }, 2500);

}

// --------------------
// Annual Dividend
// --------------------

function calculateAnnualDividend(){

    return portfolio.reduce((sum, stock) => {

        return sum +
        (stock.shares * stock.dividend);

    }, 0);

}

// --------------------
// Expense
// --------------------

function calculateMonthlyExpense(){

    return (

        Number(expenses.housing || 0) +

        Number(expenses.food || 0) +

        Number(expenses.utility || 0) +

        Number(expenses.communication || 0) +

        Number(expenses.other || 0)

    );

}

// --------------------
// Format
// --------------------

function formatYen(value){

    return Number(value).toLocaleString("ja-JP");

}

// --------------------
// Dashboard
// --------------------

function updateDashboard(){

    const annual =
    calculateAnnualDividend();

    const monthly =
    annual / 12;

    totalAnnualDividend.textContent =
    formatYen(annual);

    monthlyDividend.textContent =
    formatYen(monthly);

    const expense =
    calculateMonthlyExpense();

    let rate = 0;

    if(expense > 0){

        rate =
        Math.min(
            100,
            (monthly / expense) * 100
        );

    }

    freedomRate.textContent =
    rate.toFixed(0);

    freedomBar.style.width =
    rate + "%";

    freedomMessage.textContent =

        expense === 0

        ? "生活費を登録すると生活防衛率を計算します。"

        : `毎月 ${formatYen(monthly)} 円の配当収入があります。`;

    const remain =

        Math.max(

            0,

            expense * 12 - annual

        );

    nextGoalAmount.textContent =
    "あと ¥" + formatYen(remain);

}
// ===============================
// Dividend Monsters Ver.1 Final
// script.js Part 3/6
// ===============================

// --------------------
// Render Portfolio
// --------------------

function renderPortfolio(){

    stockList.innerHTML = "";

    stockCount.textContent =
    `${portfolio.length}銘柄`;

    if(portfolio.length === 0){

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
                最初のポートフォリオを登録してください。

            </p>

        </div>

        `;

        return;

    }

    portfolio.forEach((stock,index)=>{

        const annual =
        stock.shares * stock.dividend;

        stockList.insertAdjacentHTML(

            "beforeend",

            `

<div class="stock-card">

    <div class="asset-symbol">

        ${stock.name.substring(0,2)}

    </div>

    <div class="stock-info">

        <h3>

            ${stock.name}

        </h3>

        <div class="stock-meta">

            <span>

                ${stock.shares.toLocaleString()}株

            </span>

            <span>

                ¥${stock.dividend}/株

            </span>

        </div>

    </div>

    <div class="stock-dividend">

        <small>

            年間配当

        </small>

        <strong>

            ¥${formatYen(annual)}

        </strong>

    </div>

    <div class="stock-actions">

        <button

            class="edit-stock-button"

            data-index="${index}">

            ✏️

        </button>

        <button

            class="delete-stock-button"

            data-index="${index}">

            🗑️

        </button>

    </div>

</div>

`

        );

    });

    bindPortfolioButtons();

}
// ===============================
// Dividend Monsters Ver.1 Final
// script.js Part 4/6
// ===============================

// --------------------
// Portfolio Buttons
// --------------------

function bindPortfolioButtons(){

    document
    .querySelectorAll(".edit-stock-button")
    .forEach(button=>{

        button.onclick=()=>{

            editingIndex =
            Number(button.dataset.index);

            const stock =
            portfolio[editingIndex];

            document.getElementById("stockName").value =
            stock.name;

            document.getElementById("shareCount").value =
            stock.shares;

            document.getElementById("dividendPerShare").value =
            stock.dividend;

            document.getElementById("stockType").value =
            stock.type;

            document.getElementById("stockDialogTitle").textContent =
            "銘柄を編集";

            stockDialog.showModal();

        };

    });

    document
    .querySelectorAll(".delete-stock-button")
    .forEach(button=>{

        button.onclick=()=>{

            const index =
            Number(button.dataset.index);

            if(!confirm("この銘柄を削除しますか？")){

                return;

            }

            portfolio.splice(index,1);

            saveData();

            render();

            showToast("削除しました");

        };

    });

}

// --------------------
// Render Expense
// --------------------

function renderExpense(){

    const total =
    calculateMonthlyExpense();

    if(total===0){

        expenseList.innerHTML=`

        <div class="empty-state compact">

            <h3>

                生活費を登録してください

            </h3>

            <p>

                編集ボタンから生活費を入力すると、
                配当カバー率を表示します。

            </p>

        </div>

        `;

        return;

    }

    const monthly =
    calculateAnnualDividend()/12;

    const rate =
    Math.min(100,(monthly/total)*100);

    expenseList.innerHTML=`

<div class="expense-card">

    <div class="expense-top">

        <h3>

            毎月の生活費

        </h3>

        <div class="expense-rate ${rate>=100?"complete":""}">

            ${rate.toFixed(0)}%

        </div>

    </div>

    <div class="expense-values">

        配当 ¥${formatYen(monthly)}
        ／
        生活費 ¥${formatYen(total)}

    </div>

    <div class="expense-track">

        <div
            class="expense-progress"
            style="width:${rate}%">

        </div>

    </div>

</div>

`;

}
// ===============================
// Dividend Monsters Ver.1 Final
// script.js Part 5/6
// ===============================

// --------------------
// Stock Form
// --------------------

document
.getElementById("stockForm")
.addEventListener("submit",(event)=>{

    event.preventDefault();

    const stock={

        name:
        document
        .getElementById("stockName")
        .value
        .trim(),

        shares:
        Number(
            document
            .getElementById("shareCount")
            .value
        ),

        dividend:
        Number(
            document
            .getElementById("dividendPerShare")
            .value
        ),

        type:
        document
        .getElementById("stockType")
        .value

    };

    if(

        !stock.name ||

        stock.shares<=0 ||

        stock.dividend<0

    ){

        showToast("入力内容を確認してください");

        return;

    }

    if(editingIndex>=0){

        portfolio[editingIndex]=stock;

        showToast("更新しました");

    }else{

        portfolio.push(stock);

        showToast("追加しました");

    }

    saveData();

    render();

    stockDialog.close();

});

// --------------------
// Expense Form
// --------------------

document
.getElementById("expenseForm")
.addEventListener("submit",(event)=>{

    event.preventDefault();

    expenses={

        housing:
        Number(document.getElementById("housingExpense").value),

        food:
        Number(document.getElementById("foodExpense").value),

        utility:
        Number(document.getElementById("utilityExpense").value),

        communication:
        Number(document.getElementById("communicationExpense").value),

        other:
        Number(document.getElementById("otherExpense").value)

    };

    saveData();

    render();

    expenseDialog.close();

    showToast("生活費を保存しました");

});

function loadExpenseForm(){

    document.getElementById("housingExpense").value=
    expenses.housing||"";

    document.getElementById("foodExpense").value=
    expenses.food||"";

    document.getElementById("utilityExpense").value=
    expenses.utility||"";

    document.getElementById("communicationExpense").value=
    expenses.communication||"";

    document.getElementById("otherExpense").value=
    expenses.other||"";

}
// ===============================
// Dividend Monsters Ver.1 Final
// script.js Part 6/6
// ===============================

// --------------------
// Sort
// --------------------

document
.getElementById("stockSort")
.addEventListener("change",(event)=>{

    const sort=event.target.value;

    switch(sort){

        case "dividend-desc":

            portfolio.sort((a,b)=>

                (b.shares*b.dividend)-
                (a.shares*a.dividend)

            );

            break;

        case "shares-desc":

            portfolio.sort((a,b)=>

                b.shares-a.shares

            );

            break;

        case "name-asc":

            portfolio.sort((a,b)=>

                a.name.localeCompare(
                    b.name,
                    "ja"
                )

            );

            break;

    }

    saveData();

    renderPortfolio();

});

// --------------------
// Render
// --------------------

function render(){

    updateDashboard();

    renderPortfolio();

    renderExpense();

}

// --------------------
// Initialize
// --------------------

loadData();

render();

// --------------------
// Enter Key
// --------------------

document.addEventListener("keydown",(event)=>{

    if(

        event.key==="Escape"

    ){

        if(stockDialog.open){

            stockDialog.close();

        }

        if(expenseDialog.open){

            expenseDialog.close();

        }

    }

});
