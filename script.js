// ========================================
// Dividend Monsters Ver4.0
// Main Controller
// Part 1 / 8
// ========================================

// ---------- Storage ----------

const STORAGE_KEY = "dividend-monsters-v4";

// ---------- Global ----------

let stockDatabase = {};

let portfolio = [];

let expenses = {};

let dividendHistory = [];

let upcomingDividends = [];

let harvestedDividends = [];

let settings = {

    exchangeRate:150,

    lastRateUpdate:null,

    notifications:true,

    theme:"forest"

};

let monster={

    name:"タマゴン",

    level:1,

    exp:0,

    stage:1

};

// ---------- DOM ----------

const stockList=document.getElementById("stockList");

const dividendCalendar=document.getElementById("dividendCalendar");

const dividendHistoryList=document.getElementById("dividendHistoryList");

const totalAnnualDividend=document.getElementById("totalAnnualDividend");

const monthlyDividend=document.getElementById("monthlyDividend");

const portfolioValue=document.getElementById("portfolioValue");

const freedomRate=document.getElementById("freedomRate");

const freedomBar=document.getElementById("freedomBar");

const monsterName=document.getElementById("monsterName");

const monsterLevel=document.getElementById("monsterLevel");

const monsterExp=document.getElementById("monsterExp");

const monsterNextExp=document.getElementById("monsterNextExp");

const monsterExpBar=document.getElementById("monsterExpBar");

const monsterMessage=document.getElementById("monsterMessage");

const monsterImage=document.querySelector(".monster-image");

// ---------- Initialize ----------



// ========================================
// Load stocks.json
// ========================================

async function loadStockDatabase(){

    const response=await fetch("./stocks.json",{cache:"no-store"});

    stockDatabase=await response.json();

}

// ========================================
// Save
// ========================================
function saveData(){

    localStorage.setItem(

        STORAGE_KEY,

        JSON.stringify({

            portfolio,

            expenses,

            dividendHistory,

            harvestedDividends,

            upcomingDividends,

            monster,

            settings

        })

    );

}
// ========================================
// Load
// ========================================

function loadData(){

    const raw=

        localStorage.getItem(STORAGE_KEY);

    if(!raw){

        return;

    }

    const data=JSON.parse(raw);

    portfolio=data.portfolio||[];

    expenses=data.expenses||{};

    dividendHistory=data.dividendHistory||[];

harvestedDividends=data.harvestedDividends||[];

upcomingDividends=data.upcomingDividends||[];

monster=data.monster||monster;

settings=data.settings||settings;

}
// ========================================
// Dividend Monsters Ver4.0
// Part 2 / 8
// ========================================

// ========================================
// Portfolio Migration
// ========================================

function migratePortfolio() {

    portfolio = portfolio.map((item) => {

        const master = stockDatabase[item.code];

        if (!master) {

            return item;

        }

        return {

            id: item.id || crypto.randomUUID(),

            code: master.ticker,

            shares: Number(item.shares || 0),

            market: master.market,

            currency: master.currency

        };

    });

}

// ========================================
// Annual Dividend
// ========================================

function calculateAnnualDividend() {

    let total = 0;

    portfolio.forEach((stock) => {

        const master = stockDatabase[stock.code];

        if (!master) return;

        let dividend =

            Number(master.annualDividendPerShare) *

            Number(stock.shares);

        if (master.currency === "USD") {

            dividend *= settings.exchangeRate;

        }

        total += dividend;

    });

    return Math.round(total);

}

// ========================================
// Portfolio Value
// ========================================

function calculatePortfolioValue() {

    let total = 0;

    portfolio.forEach((stock) => {

        const master = stockDatabase[stock.code];

        if (!master) return;

        let value =

            Number(master.currentPrice || 0) *

            Number(stock.shares);

        if (master.currency === "USD") {

            value *= settings.exchangeRate;

        }

        total += value;

    });

    return Math.round(total);

}

// ========================================
// Expense
// ========================================

function calculateMonthlyExpense() {

    return Object.values(expenses)

        .reduce((a, b) =>

            a + Number(b || 0)

        , 0);

}

// ========================================
// Dashboard
// ========================================

function renderDashboard() {

    const annual = calculateAnnualDividend();

    const monthly = annual / 12;

    const value = calculatePortfolioValue();

    const annualExpense =

        calculateMonthlyExpense() * 12;

    const rate = annualExpense > 0

        ? (annual / annualExpense) * 100

        : 0;

    totalAnnualDividend.textContent =

        formatYen(annual);

    monthlyDividend.textContent =

        formatYen(monthly);

    portfolioValue.textContent =

        formatYen(value);

    freedomRate.textContent =

        rate.toFixed(1);

    freedomBar.style.width =

        `${Math.min(rate,100)}%`;

}

// ========================================
// Render
// ========================================


// ========================================
// Dividend Monsters Ver4.0
// Part 3 / 8
// Harvest System
// ========================================

// ========================================
// 配当予定生成
// ========================================

function generateUpcomingDividends() {

    const previousHarvest = new Set(

        harvestedDividends.map(item =>

            `${item.code}_${item.paymentDate}`

        )

    );

    upcomingDividends = [];

    const today = new Date();

    portfolio.forEach((stock) => {

        const master = stockDatabase[stock.code];

        if (!master) return;

        const months = master.paymentMonths || [];

        const timings = master.paymentTiming || [];

        months.forEach((month, index) => {

            const timing = timings[index] || "mid";

            let day = 15;

            if (timing === "early") day = 5;
            if (timing === "mid") day = 15;
            if (timing === "late") day = 28;

            const year =
    today.getFullYear();

const paymentDate =
    new Date(
        year,
        month - 1,
        day
    );

            let amount =
                Number(master.annualDividendPerShare) *
                Number(stock.shares);

            if (master.distributionType === "monthly") {

                amount /= 12;

            } else if (master.distributionType === "quarterly") {

                amount /= 4;

            } else if (master.distributionType === "semiannual") {

                amount /= 2;

            }

            if (master.currency === "USD") {

                amount *= settings.exchangeRate;

            }

            upcomingDividends.push({

                id: crypto.randomUUID(),

                code: stock.code,

                name: master.name,

                amount: Math.round(amount),

                paymentDate: getLocalDateString(paymentDate),

                harvested: previousHarvest.has(
    `${stock.code}_${getLocalDateString(paymentDate)}`
)

            });

        });

    });

    upcomingDividends.sort(

        (a,b)=>

            new Date(a.paymentDate)-

            new Date(b.paymentDate)

    );

}

// ========================================
// 今日収穫できる一覧
// ========================================

function getHarvestableDividends(){

    const today=

        getLocalDateString(new Date());

    return upcomingDividends.filter(item=>{

        if(item.harvested){

            return false;

        }

        return item.paymentDate<=today;

    });

}

// ========================================
// 次回収穫
// ========================================

function getNextDividend(){

    const today=

        getLocalDateString(new Date());

    return upcomingDividends.find(item=>

        !item.harvested &&

        item.paymentDate>today

    );

}

// ========================================
// 収穫
// ========================================

function harvestDividend(id){

    const item=

        upcomingDividends.find(

            x=>x.id===id

        );

if (!item) {

    return;

}

const alreadyHarvested =
    harvestedDividends.some(
        harvestedItem =>
            harvestedItem.code === item.code &&
            harvestedItem.paymentDate === item.paymentDate
    );

if (alreadyHarvested) {

    showToast("この配当はすでに収穫済みです。");

    return;

}

item.harvested = true;

    harvestedDividends.push(item);

    dividendHistory.push({

        id:crypto.randomUUID(),

        stockCode:item.code,

        stockName:item.name,

        amount:item.amount,

        date:item.paymentDate,

        memo:"自動収穫",

        createdAt:new Date().toISOString()

    });

    monster.exp+=

        Math.floor(item.amount/100);

    updateMonsterLevel();

    saveData();

    render();

    showToast(

        `${item.name}を収穫しました！`

    );

}

// ========================================
// 一括収穫
// ========================================

function harvestAll(){

    getHarvestableDividends()

        .forEach(item=>{

            harvestDividend(item.id);

        });

}
// ========================================
// Dividend Monsters Ver4.0
// Part 4 / 8
// Monster System
// ========================================

// ========================================
// モンスター10段階
// ========================================

const MONSTER_STAGES = [

{
level:1,
name:"タマゴン",
image:"🥚"
},

{
level:5,
name:"プチモン",
image:"🐥"
},

{
level:10,
name:"リーフモン",
image:"🦎"
},

{
level:15,
name:"ウッドモン",
image:"🦖"
},

{
level:20,
name:"フレイムモン",
image:"🐉"
},

{
level:30,
name:"アースドラゴン",
image:"🐲"
},

{
level:40,
name:"エメラルドドラゴン",
image:"🐲"
},

{
level:55,
name:"セレスドラゴン",
image:"🐉"
},

{
level:75,
name:"レジェンドドラゴン",
image:"👑"
},

{
level:100,
name:"ディビデンドキング",
image:"🌟"

}

];

// ========================================
// レベル更新
// ========================================

function updateMonsterLevel(){

    while(

        monster.exp >=

        monster.level*100

    ){

        monster.exp-=

            monster.level*100;

        monster.level++;

    }

    updateMonsterStage();

}

// ========================================
// 進化判定
// ========================================

function updateMonsterStage(){

    let current=

        MONSTER_STAGES[0];

    MONSTER_STAGES.forEach(stage=>{

        if(monster.level>=stage.level){

            current=stage;

        }

    });

    monster.stage=current.level;

    monster.name=current.name;

}

// ========================================
// 表示
// ========================================

function renderMonster(){

    updateMonsterStage();

    const current=

        MONSTER_STAGES.find(

            x=>x.level===monster.stage

        );

    monsterName.textContent=

        monster.name;

    monsterLevel.textContent=

        monster.level;

    monsterExp.textContent=

        formatNumber(monster.exp);

    monsterNextExp.textContent=

        formatNumber(

            monster.level*100

        );

    monsterExpBar.style.width=

        `${
            Math.min(

                monster.exp/

                (monster.level*100)

                *100,

                100

            )

        }%`;

    monsterImage.textContent=

        current.image;

    monsterMessage.textContent=

        getMonsterMessage();

}

// ========================================
// メッセージ
// ========================================

function getMonsterMessage(){

    const harvest=

        getHarvestableDividends();

    if(harvest.length>0){

        return "今日は収穫できるよ！";

    }

    const next=

        getNextDividend();

    if(next){

        const days=

            daysUntil(

                next.paymentDate

            );

        return `次の収穫まであと${days}日`;

    }

    return "新しい銘柄を追加しよう！";

}

// ========================================
// 日数
// ========================================

function daysUntil(dateString){

    const today=

        new Date();

    const target=

        new Date(dateString);

    return Math.max(

        0,

        Math.ceil(

            (target-today)/

            86400000

        )

    );

}
// ========================================
// Dividend Monsters Ver4.0
// Part 5 / 8
// Analytics + Calendar
// ========================================

// ========================================
// セクター集計
// ========================================

function calculateSectorData(){

    const sectors={};

    portfolio.forEach(stock=>{

        const master=stockDatabase[stock.code];

        if(!master)return;

        let value=

            Number(master.annualDividendPerShare)*
            Number(stock.shares);

        if(master.distributionType==="monthly"){

            value*=12;

        }

        if(master.currency==="USD"){

            value*=settings.exchangeRate;

        }

        const sector=

            master.sector||"その他";

        sectors[sector]=(sectors[sector]||0)+value;

    });

    return sectors;

}

// ========================================
// 円グラフデータ
// ========================================

function getPieChartData(){

    const sectors=

        calculateSectorData();

    return Object.entries(sectors)

        .map(([name,value])=>({

            name,

            value:Math.round(value)

        }));

}

// ========================================
// ツリーマップデータ
// ========================================

function getTreeMapData(){

    return portfolio.map(stock=>{

        const master=

            stockDatabase[stock.code];

        if(!master)return null;

        let value=

            Number(master.annualDividendPerShare)*
            Number(stock.shares);

        if(master.distributionType==="monthly"){

            value*=12;

        }

        if(master.currency==="USD"){

            value*=settings.exchangeRate;

        }

        return{

            name:master.name,

            value:Math.round(value)

        };

    }).filter(Boolean);

}

// ========================================
// 年間推移
// ========================================

function getMonthlyDividendData(){

    const monthly=

        Array(12).fill(0);

    harvestedDividends.forEach(item=>{

        const month=

            new Date(item.paymentDate)

            .getMonth();

        monthly[month]+=

            Number(item.amount);

    });

    return monthly.map((value,index)=>({

        month:index+1,

        value:Math.round(value)

    }));

}

// ========================================
// カレンダー
// ========================================

function renderCalendar(){

    if(!dividendCalendar)return;

    const months=

        Array(12).fill(0);

    upcomingDividends.forEach(item=>{

        const month=

            new Date(item.paymentDate)

            .getMonth();

        months[month]+=

            Number(item.amount);

    });

    dividendCalendar.innerHTML=

        months.map((amount,index)=>`

        <article class="month-item">

            <span>${index+1}月</span>

            <strong>

                ¥${formatYen(amount)}

            </strong>

        </article>

        `).join("");

}

// ========================================
// 分析画面描画
// ========================================

function renderAnalytics(){

    console.table(

        getPieChartData()

    );

    console.table(

        getTreeMapData()

    );

    console.table(

        getMonthlyDividendData()

    );

}
// ========================================
// Dividend Monsters Ver4.0
// Part 6 / 8
// Portfolio + History + Harvest Card
// ========================================

// ========================================
// ポートフォリオ
// ========================================

function renderPortfolio(){

    if(!stockList)return;

    if(portfolio.length===0){

        stockList.innerHTML=`

        <div class="empty-state">

            <div class="empty-icon">DM</div>

            <h3>保有銘柄がありません</h3>

            <p>「銘柄追加」から登録してください。</p>

        </div>

        `;

        return;

    }

    stockList.innerHTML=

    portfolio.map(stock=>{

        const master=

            stockDatabase[stock.code];

        if(!master)return"";

        let annual=

            Number(master.annualDividendPerShare)*

            Number(stock.shares);

        if(master.currency==="USD"){

            annual*=settings.exchangeRate;

        }

        let value=

            Number(master.currentPrice||0)*

            Number(stock.shares);

        if(master.currency==="USD"){

            value*=settings.exchangeRate;

        }

        const next=

            upcomingDividends.find(

                x=>x.code===stock.code &&

                !x.harvested

            );

        return `

        <article class="stock-card">

            <div class="stock-info">

                <h3>${master.name}</h3>

                <p>

                    ${stock.shares}株

                    ・

                    ${master.market}

                </p>

            </div>

            <div class="stock-dividend">

                <small>年間配当</small>

                <strong>

                    ¥${formatYen(annual)}

                </strong>

            </div>

            <div class="stock-value">

                <small>評価額</small>

                <strong>

                    ¥${formatYen(value)}

                </strong>

            </div>

            <div class="stock-next">

                <small>次回収穫</small>

                <strong>

                ${

                    next

                    ?

                    formatDate(next.paymentDate)

                    :

                    "-"

                }

                </strong>

            </div>

        </article>

        `;

    }).join("");

}

// ========================================
// 履歴
// ========================================

function renderHistory(){

    if(!dividendHistoryList)return;

    if(dividendHistory.length===0){

        dividendHistoryList.innerHTML=`

        <div class="empty-state compact">

            <h3>

                まだ収穫がありません

            </h3>

            <p>

                配当日になると

                自動で収穫できます。

            </p>

        </div>

        `;

        return;

    }

    const history=

        [...dividendHistory]

        .sort(

            (a,b)=>

            new Date(b.date)-

            new Date(a.date)

        );

    dividendHistoryList.innerHTML=

        history.map(item=>`

        <article class="history-card">

            <div>

                <h3>

                    ${item.stockName}

                </h3>

                <p>

                    ${formatDate(item.date)}

                </p>

            </div>

            <strong>

                ¥${formatYen(item.amount)}

            </strong>

        </article>

        `).join("");

}

// ========================================
// ホーム収穫カード
// ========================================

function renderHarvest(){

    const card=

        document.getElementById(

            "harvestCard"

        );

    if(!card){

        return;

    }

    const harvest=

        getHarvestableDividends();

    if(harvest.length===0){

        const next=

            getNextDividend();

        card.innerHTML=`

        <h2>

            🌳 今日の収穫

        </h2>

        <p>

            今日は収穫はありません。

        </p>

        <small>

            次回：

            ${

                next

                ?

                `${next.name}

                (${formatDate(next.paymentDate)})`

                :

                "予定なし"

            }

        </small>

        `;

        return;

    }

    card.innerHTML=`

    <h2>

        🌳 今日収穫できます

    </h2>

    ${harvest.map(item=>`

        <div class="harvest-item">

            <span>

                ${item.name}

            </span>

            <strong>

                ¥${formatYen(item.amount)}

            </strong>

        </div>

    `).join("")}

    <button

        class="primary-button"

        onclick="harvestAll()"

    >

        🌳まとめて収穫

    </button>

    `;

}

// ========================================
// 今日の収穫総額
// ========================================

function getTodayHarvestAmount(){

    return getHarvestableDividends()

        .reduce(

            (sum,item)=>

                sum+

                Number(item.amount),

            0

        );

}
// ========================================
// Dividend Monsters Ver4.0
// Part 7 / 8
// Utility + Exchange Rate + Notifications
// ========================================

// ========================================
// 為替レート更新
// ========================================

async function updateExchangeRate(){

    try{

        const response=

            await fetch(

                "https://open.er-api.com/v6/latest/USD"

            );

        const json=

            await response.json();

        if(json.result==="success"){

            settings.exchangeRate=

                Number(json.rates.JPY);

            settings.lastRateUpdate=

                new Date().toISOString();

            saveData();

        }

    }catch(error){

        console.warn(

            "為替取得失敗"

        );

    }

}

// ========================================
// 毎日更新判定
// ========================================

async function checkExchangeRate(){

    const today=

        getLocalDateString(

            new Date()

        );

    const updated=

        settings.lastRateUpdate

        ?

        getLocalDateString(

            new Date(

                settings.lastRateUpdate

            )

        )

        :

        "";

    if(today!==updated){

        await updateExchangeRate();

    }

}

// ========================================
// 通知
// ========================================

function showHarvestNotification(){

    if(

        !settings.notifications

    ){

        return;

    }

    const harvest=

        getHarvestableDividends();

    if(

        harvest.length===0

    ){

        return;

    }

    showToast(

        `🌳 今日は${harvest.length}件収穫できます`

    );

}

// ========================================
// 今日のメッセージ
// ========================================

function getDailyMessage(){

    const harvest=

        getHarvestableDividends();

    if(harvest.length){

        return "🌳今日は収穫日です！";

    }

    const next=

        getNextDividend();

    if(next){

        const days=

            daysUntil(

                next.paymentDate

            );

        return `📅 次の収穫まであと${days}日`;

    }

    if(portfolio.length===0){

        return "📈 最初の銘柄を登録しましょう";

    }

    return "🐲 今日もコツコツ育てよう";

}

// ========================================
// トースト
// ========================================

function showToast(message){

    const toast=

        document.getElementById(

            "toast"

        );

    if(!toast){

        return;

    }

    toast.textContent=

        message;

    toast.classList.add(

        "show"

    );

    clearTimeout(

        showToast.timer

    );

    showToast.timer=

        setTimeout(()=>{

            toast.classList.remove(

                "show"

            );

        },2500);

}

// ========================================
// 数値フォーマット
// ========================================

function formatYen(value){

    return Math.round(

        Number(value)||0

    ).toLocaleString("ja-JP");

}

function formatNumber(value){

    return Number(

        value||0

    ).toLocaleString(

        "ja-JP",

        {

            maximumFractionDigits:2

        }

    );

}

function formatDate(date){

    return new Date(date)

        .toLocaleDateString(

            "ja-JP",

            {

                year:"numeric",

                month:"short",

                day:"numeric"

            }

        );

}

function getLocalDateString(date){

    return date

        .toISOString()

        .slice(0,10);

}

// ========================================
// 起動時処理
// ========================================

// ========================================
// Dividend Monsters Ver4.0
// Part 8 / 8
// Final Initialize + Future Ready
// ========================================

// ========================================
// 初回モンスター名
// ========================================

function initializeMonster() {

    if (!monster.name || monster.name === "タマゴン") {

        const input = prompt(
            "相棒の名前を決めましょう！",
            "タマゴン"
        );

        if (input && input.trim()) {

            monster.name = input.trim();

        }

        saveData();

    }

}

// ========================================
// 将来API更新
// ========================================

async function refreshPrices() {

    // Ver4ではダミー
    // Ver5でGoogle Finance / TwelveDataへ接続予定

    console.log("価格更新");

}

// ========================================
// 将来配当更新
// ========================================

async function refreshDividendDatabase() {

    // Ver5予定

    console.log("配当更新");

}

// ========================================
// 毎日起動処理
// ========================================

async function dailyBoot() {

    await checkExchangeRate();

    await refreshPrices();

    await refreshDividendDatabase();

    generateUpcomingDividends();

}

// ========================================
// 初期化
// ========================================

async function initializeApp() {

    loadData();

    await loadStockDatabase();

    migratePortfolio();

    initializeMonster();

    await checkExchangeRate();

    generateUpcomingDividends();

    render();

    showHarvestNotification();

    console.log("Dividend Monsters Ver4.1 Started");

}

// ========================================
// Render Override
// ========================================

function render() {

    renderDashboard();

    renderMonster();

    renderHarvest();

    renderPortfolio();

    renderHistory();

    renderCalendar();

    renderAnalytics();

}

// ========================================
// Debug
// ========================================

window.dm = {

    portfolio,

    stockDatabase,

    monster,

    expenses,

    dividendHistory,

    upcomingDividends,

    harvestedDividends,

    settings

};

// ========================================
// App Start
// ========================================

document.addEventListener(

    "DOMContentLoaded",

    () => {

        initializeApp();

    }

);
