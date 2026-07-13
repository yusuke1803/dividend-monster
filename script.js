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
const monsterSpecies =
    document.getElementById("monsterSpecies");
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
// Dividend Monsters Ver4.1
// Part 3 / 8
// Harvest System
// ========================================


// ========================================
// 配当予定用の日付文字列
// タイムゾーンによる日付ずれを防止
// ========================================

function getScheduleDateString(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );

    return `${year}-${month}-${day}`;

}


// ========================================
// 配当予定用の日付解析
// Safariでも日付がずれないようにする
// ========================================

function parseScheduleDate(dateString) {

    const match =
        String(
            dateString || ""
        ).match(
            /^(\d{4})-(\d{2})-(\d{2})$/
        );

    if (!match) {

        return null;

    }

    return new Date(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3])
    );

}


// ========================================
// 配当予定の識別キー
// 同じ銘柄・同じ支払日の重複を防ぐ
// ========================================

function createDividendScheduleKey(
    code,
    paymentDate
) {

    return `${code}_${paymentDate}`;

}


// ========================================
// 配当予定ID
// crypto.randomUUIDに依存しない
// ========================================

function createDividendScheduleId(
    code,
    paymentDate
) {

    return createDividendScheduleKey(
        code,
        paymentDate
    );

}


// ========================================
// 支払時期から予想支払日を決定
// ========================================

function getPaymentDay(timing) {

    switch (
        String(
            timing || "mid"
        ).toLowerCase()
    ) {

        case "early":
            return 5;

        case "late":
            return 28;

        case "mid":
        default:
            return 15;

    }

}


// ========================================
// 1回分の予想配当額を計算
// annualDividendPerShareは年間配当単価
// ========================================

function calculateScheduledDividendAmount(
    stock,
    master
) {

    const annualDividendPerShare =
        Number(
            master
                .annualDividendPerShare ||
            0
        );

    const shares =
        Number(
            stock.shares ||
            0
        );

    const paymentCount =
        Array.isArray(
            master.paymentMonths
        ) &&
        master.paymentMonths.length > 0
            ? master.paymentMonths.length
            : 1;

    let amount =
        (
            annualDividendPerShare *
            shares
        ) /
        paymentCount;

    if (
        master.currency === "USD"
    ) {

        amount *=
            Number(
                settings.exchangeRate ||
                150
            );

    }

    return Math.max(
        0,
        Math.round(amount)
    );

}


// ========================================
// 収穫済みキー一覧を作成
// ========================================

function getHarvestedDividendKeySet() {

    const harvestedKeys =
        harvestedDividends.map(
            item =>
                createDividendScheduleKey(
                    item.code,
                    item.paymentDate
                )
        );

    dividendHistory.forEach(
        record => {

            if (
                !record.stockCode ||
                !record.date
            ) {

                return;

            }

            harvestedKeys.push(
                createDividendScheduleKey(
                    record.stockCode,
                    record.date
                )
            );

        }
    );

    return new Set(
        harvestedKeys
    );

}


// ========================================
// 配当予定生成
// 今年分と翌年分を生成する
// ========================================

function generateUpcomingDividends() {

    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );

    const currentYear =
        today.getFullYear();

    const years = [
        currentYear,
        currentYear + 1
    ];

    const harvestedKeySet =
        getHarvestedDividendKeySet();

    const generatedSchedule = [];

    portfolio.forEach(
        stock => {

            const master =
                stockDatabase[
                    stock.code
                ];

            if (!master) {

                return;

            }

            const paymentMonths =
                Array.isArray(
                    master.paymentMonths
                )
                    ? master.paymentMonths
                    : [];

            const paymentTimings =
                Array.isArray(
                    master.paymentTiming
                )
                    ? master.paymentTiming
                    : [];

            if (
                paymentMonths.length === 0
            ) {

                return;

            }

            const amount =
                calculateScheduledDividendAmount(
                    stock,
                    master
                );

            paymentMonths.forEach(
                (month, index) => {

                    const numericMonth =
                        Number(month);

                    if (
                        numericMonth < 1 ||
                        numericMonth > 12
                    ) {

                        return;

                    }

                    const timing =
                        paymentTimings[index] ||
                        "mid";

                    const paymentDay =
                        getPaymentDay(
                            timing
                        );

                    years.forEach(
                        year => {

                            const paymentDateObject =
                                new Date(
                                    year,
                                    numericMonth - 1,
                                    paymentDay
                                );

                            const paymentDate =
                                getScheduleDateString(
                                    paymentDateObject
                                );

                            const scheduleKey =
                                createDividendScheduleKey(
                                    stock.code,
                                    paymentDate
                                );

                            const harvested =
                                harvestedKeySet.has(
                                    scheduleKey
                                );

                            generatedSchedule.push({
                                id:
                                    createDividendScheduleId(
                                        stock.code,
                                        paymentDate
                                    ),

                                key:
                                    scheduleKey,

                                code:
                                    stock.code,

                                name:
                                    master.name ||
                                    stock.code,

                                market:
                                    master.market ||
                                    stock.market ||
                                    "JP",

                                currency:
                                    master.currency ||
                                    stock.currency ||
                                    "JPY",

                                exchangeRate:
                                    master.currency ===
                                    "USD"
                                        ? Number(
                                            settings.exchangeRate ||
                                            150
                                        )
                                        : 1,

                                amount,

                                paymentDate,

                                paymentMonth:
                                    numericMonth,

                                paymentTiming:
                                    timing,

                                harvested
                            });

                        }
                    );

                }
            );

        }
    );

    const uniqueSchedule =
        new Map();

    generatedSchedule.forEach(
        item => {

            if (
                !uniqueSchedule.has(
                    item.key
                )
            ) {

                uniqueSchedule.set(
                    item.key,
                    item
                );

            }

        }
    );

    upcomingDividends =
        Array.from(
            uniqueSchedule.values()
        ).sort(
            (a, b) => {

                const dateA =
                    parseScheduleDate(
                        a.paymentDate
                    );

                const dateB =
                    parseScheduleDate(
                        b.paymentDate
                    );

                return (
                    dateA?.getTime() || 0
                ) - (
                    dateB?.getTime() || 0
                );

            }
        );

}


// ========================================
// 今日収穫できる配当
// 予定日0:00以降に収穫可能
// ========================================

function getHarvestableDividends() {

    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );

    return upcomingDividends.filter(
        item => {

            if (
                item.harvested
            ) {

                return false;

            }

            const paymentDate =
                parseScheduleDate(
                    item.paymentDate
                );

            if (!paymentDate) {

                return false;

            }

            paymentDate.setHours(
                0,
                0,
                0,
                0
            );

            return (
                paymentDate.getTime() <=
                today.getTime()
            );

        }
    );

}


// ========================================
// 次回収穫予定
// ========================================

function getNextDividend() {

    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );

    return upcomingDividends.find(
        item => {

            if (
                item.harvested
            ) {

                return false;

            }

            const paymentDate =
                parseScheduleDate(
                    item.paymentDate
                );

            if (!paymentDate) {

                return false;

            }

            paymentDate.setHours(
                0,
                0,
                0,
                0
            );

            return (
                paymentDate.getTime() >
                today.getTime()
            );

        }
    ) || null;

}


// ========================================
// 配当額から獲得EXPを計算
// 100円 = 1EXP
// ========================================

function calculateHarvestExp(amount) {

    return Math.max(
        0,
        Math.floor(
            Number(
                amount || 0
            ) /
            100
        )
    );

}


// ========================================
// 配当1件を収穫
// ========================================

function harvestDividend(
    scheduleId
) {

    const item =
        upcomingDividends.find(
            dividend =>
                dividend.id ===
                scheduleId
        );

    if (!item) {

        showToast(
            "収穫する配当が見つかりません。"
        );

        return;

    }

    const scheduleKey =
        createDividendScheduleKey(
            item.code,
            item.paymentDate
        );

    const alreadyHarvested =
        harvestedDividends.some(
            harvestedItem =>
                createDividendScheduleKey(
                    harvestedItem.code,
                    harvestedItem.paymentDate
                ) ===
                scheduleKey
        ) ||
        dividendHistory.some(
            record =>
                createDividendScheduleKey(
                    record.stockCode,
                    record.date
                ) ===
                scheduleKey
        );

    if (
        item.harvested ||
        alreadyHarvested
    ) {

        item.harvested =
            true;

        showToast(
            "この配当はすでに収穫済みです。"
        );

        return;

    }

    const paymentDate =
        parseScheduleDate(
            item.paymentDate
        );

    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );

    if (
        !paymentDate ||
        paymentDate.getTime() >
        today.getTime()
    ) {

        showToast(
            "この配当はまだ収穫できません。"
        );

        return;

    }

    const previousLevel =
        Number(
            monster.level ||
            1
        );

    const gainedExp =
        calculateHarvestExp(
            item.amount
        );

    const harvestedAt =
        new Date()
            .toISOString();

    item.harvested =
        true;

    const harvestedRecord = {
        ...item,

        harvested:
            true,

        harvestedAt,

        gainedExp
    };

    harvestedDividends.push(
        harvestedRecord
    );

    dividendHistory.push({
        id:
            `history_${scheduleKey}`,

        scheduleKey,

        stockCode:
            item.code,

        stockName:
            item.name,

        amount:
            Number(
                item.amount || 0
            ),

        date:
            item.paymentDate,

        memo:
            "自動収穫",

        gainedExp,

        currency:
            item.currency,

        exchangeRate:
            item.exchangeRate,

        createdAt:
            harvestedAt,

        harvestedAt
    });

    monster.exp =
        Math.max(
            0,
            Number(
                monster.exp ||
                0
            )
        ) +
        gainedExp;

    updateMonsterLevel();

    saveData();

    render();

    const levelUpText =
        Number(monster.level) >
        previousLevel
            ? ` Lv.${monster.level}へレベルアップ！`
            : "";

    showToast(
        `${item.name}を収穫しました！ ＋${gainedExp}EXP${levelUpText}`
    );

}


// ========================================
// まとめて収穫
// ========================================

function harvestAll() {

    const harvestable =
        getHarvestableDividends();

    if (
        harvestable.length === 0
    ) {

        showToast(
            "今日収穫できる配当はありません。"
        );

        return;

    }

    const previousLevel =
        Number(
            monster.level ||
            1
        );

    let totalAmount = 0;
    let totalExp = 0;
    let harvestedCount = 0;

    const harvestedKeySet =
        getHarvestedDividendKeySet();

    const harvestedAt =
        new Date()
            .toISOString();

    harvestable.forEach(
        item => {

            const scheduleKey =
                createDividendScheduleKey(
                    item.code,
                    item.paymentDate
                );

            if (
                harvestedKeySet.has(
                    scheduleKey
                )
            ) {

                item.harvested =
                    true;

                return;

            }

            const gainedExp =
                calculateHarvestExp(
                    item.amount
                );

            item.harvested =
                true;

            harvestedDividends.push({
                ...item,

                harvested:
                    true,

                harvestedAt,

                gainedExp
            });

            dividendHistory.push({
                id:
                    `history_${scheduleKey}`,

                scheduleKey,

                stockCode:
                    item.code,

                stockName:
                    item.name,

                amount:
                    Number(
                        item.amount || 0
                    ),

                date:
                    item.paymentDate,

                memo:
                    "まとめて収穫",

                gainedExp,

                currency:
                    item.currency,

                exchangeRate:
                    item.exchangeRate,

                createdAt:
                    harvestedAt,

                harvestedAt
            });

            harvestedKeySet.add(
                scheduleKey
            );

            totalAmount +=
                Number(
                    item.amount || 0
                );

            totalExp +=
                gainedExp;

            harvestedCount +=
                1;

        }
    );

    if (
        harvestedCount === 0
    ) {

        showToast(
            "対象の配当はすでに収穫済みです。"
        );

        return;

    }

    monster.exp =
        Math.max(
            0,
            Number(
                monster.exp ||
                0
            )
        ) +
        totalExp;

    updateMonsterLevel();

    saveData();

    render();

    const levelUpText =
        Number(monster.level) >
        previousLevel
            ? ` Lv.${monster.level}へレベルアップ！`
            : "";

    showToast(
        `${harvestedCount}件・¥${formatYen(totalAmount)}を収穫！ ＋${totalExp}EXP${levelUpText}`
    );

}


// ========================================
// 今日の収穫可能額
// ========================================

function getTodayHarvestAmount() {

    return getHarvestableDividends()
        .reduce(
            (total, item) =>
                total +
                Number(
                    item.amount ||
                    0
                ),
            0
        );

}
// ========================================
// Dividend Monsters Ver4.1
// Part 4 / 8
// Monster System
// ========================================

// ========================================
// モンスター10段階
// ========================================

const MONSTER_STAGES = [
    {
        level: 1,
        name: "コインエッグ",
        image: "🥚"
    },
    {
        level: 5,
        name: "ミニホッパー",
        image: "🐣"
    },
    {
        level: 10,
        name: "リーフテイル",
        image: "🦎"
    },
    {
        level: 15,
        name: "グロウリザード",
        image: "🦖"
    },
    {
        level: 20,
        name: "フレアドレイク",
        image: "🐉"
    },
    {
        level: 30,
        name: "フォレストワイバーン",
        image: "🐲"
    },
    {
        level: 40,
        name: "アクアセラフ",
        image: "🌊"
    },
    {
        level: 55,
        name: "スカイロード",
        image: "⚡"
    },
    {
        level: 75,
        name: "ゴールドエンペラー",
        image: "👑"
    },
    {
        level: 100,
        name: "ディビデンドタイタン",
        image: "🌟"
    }
];


// ========================================
// レベルに対応する進化段階を取得
// ========================================

function getMonsterStageByLevel(level) {

    let currentStage =
        MONSTER_STAGES[0];

    MONSTER_STAGES.forEach(stage => {

        if (level >= stage.level) {

            currentStage = stage;

        }

    });

    return currentStage;

}


// ========================================
// 次のレベルに必要なEXP
// ========================================

function getRequiredExp(level) {

    return Math.max(
        100,
        Number(level || 1) * 100
    );

}


// ========================================
// モンスター種族判定
// 保有銘柄の年間配当が最も大きい
// セクターによって種族を決定
// ========================================

function getMonsterSpecies() {

    const sectors =
        calculateSectorData();

    let topSector = "";

    let highestDividend = 0;

    Object.entries(sectors)
        .forEach(([sector, value]) => {

            const dividend =
                Number(value || 0);

            if (
                dividend >
                highestDividend
            ) {

                highestDividend =
                    dividend;

                topSector =
                    sector;

            }

        });

    switch (topSector) {

        case "情報技術":
        case "IT":
        case "technology":
            return "⚡ サイバードラゴン";

        case "金融":
        case "finance":
            return "💰 ゴールドライオン";

        case "ヘルスケア":
        case "healthcare":
            return "🌿 セージフェニックス";

        case "エネルギー":
        case "energy":
            return "🔥 フレイムドラゴン";

        case "生活必需品":
        case "consumer staples":
            return "🌳 フォレストガーディアン";

        case "資本財":
        case "industrials":
            return "🛡️ アイアンガーディアン";

        case "通信":
        case "communication":
        case "communication services":
            return "📡 スカイホーク";

        case "公益":
        case "utilities":
            return "💧 アクアスピリット";

        case "不動産":
        case "REIT":
        case "real estate":
            return "🏰 ストーンゴーレム";

        case "ETF":
        case "etf":
            return "✨ ディビデンドスピリット";

        default:
            return "🐉 ノーマルドラゴン";

    }

}


// ========================================
// レベル更新
// ========================================

function updateMonsterLevel() {

    const previousLevel =
        Number(monster.level || 1);

    const previousStage =
        getMonsterStageByLevel(
            previousLevel
        );

    monster.level =
        previousLevel;

    monster.exp =
        Math.max(
            0,
            Number(monster.exp || 0)
        );

    while (
        monster.exp >=
        getRequiredExp(monster.level)
    ) {

        monster.exp -=
            getRequiredExp(
                monster.level
            );

        monster.level += 1;

    }

    updateMonsterStage();

    const currentStage =
        getMonsterStageByLevel(
            monster.level
        );

    if (
        monster.level >
        previousLevel
    ) {

        showToast(
            `🎉 Lv.${monster.level}になりました！`
        );

    }

    if (
        currentStage.level >
        previousStage.level
    ) {

        showEvolutionDialog(
            previousStage,
            currentStage
        );

    }

}


// ========================================
// 進化段階更新
// ========================================

function updateMonsterStage() {

    const currentStage =
        getMonsterStageByLevel(
            Number(monster.level || 1)
        );

    monster.stage =
        currentStage.level;

    monster.stageName =
        currentStage.name;

}


// ========================================
// 進化演出
// ========================================

function showEvolutionDialog(
    previousStage,
    currentStage
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
            currentStage.image;

    }

    if (levelUpTitle) {

        levelUpTitle.textContent =
            `${currentStage.name}へ進化！`;

    }

    if (levelUpMessage) {

        levelUpMessage.textContent =
            `${previousStage.name}から${currentStage.name}へ進化しました。`;

    }

    if (
        levelUpDialog &&
        typeof levelUpDialog.showModal ===
        "function"
    ) {

        levelUpDialog.showModal();

    } else {

        showToast(
            `✨ ${currentStage.name}へ進化しました！`
        );

    }

}


// ========================================
// モンスター表示
// ========================================

function renderMonster() {

    updateMonsterStage();

    const currentStage =
        getMonsterStageByLevel(
            Number(monster.level || 1)
        );

    const requiredExp =
        getRequiredExp(
            Number(monster.level || 1)
        );

    const currentExp =
        Math.max(
            0,
            Number(monster.exp || 0)
        );

    const progressRate =
        requiredExp > 0
            ? (
                currentExp /
                requiredExp
            ) * 100
            : 0;

    /*
     * monster.nameは相棒のニックネームとして維持。
     * 進化名はmonster.stageNameへ保存する。
     */
    if (!monster.name) {

        monster.name =
            "タマゴン";

    }

    if (monsterName) {

        monsterName.textContent =
            monster.name;

    }

    if (monsterSpecies) {

        monsterSpecies.textContent =
            getMonsterSpecies();

    }

    if (monsterLevel) {

        monsterLevel.textContent =
            monster.level;

    }

    if (monsterExp) {

        monsterExp.textContent =
            formatNumber(
                currentExp
            );

    }

    if (monsterNextExp) {

        monsterNextExp.textContent =
            formatNumber(
                requiredExp
            );

    }

    if (monsterExpBar) {

        monsterExpBar.style.width =
            `${Math.min(
                progressRate,
                100
            )}%`;

    }

    if (monsterImage) {

        monsterImage.textContent =
            currentStage.image;

        monsterImage.setAttribute(
            "title",
            currentStage.name
        );

    }

    if (monsterMessage) {

        monsterMessage.textContent =
            getMonsterMessage();

    }
renderMonsterBook();
}


// ========================================
// 状況別メッセージ
// ========================================

function getMonsterMessage() {

    const harvestable =
        getHarvestableDividends();

    if (
        harvestable.length > 0
    ) {

        return `今日は${harvestable.length}件の配当を収穫できるよ！`;

    }

    const nextDividend =
        getNextDividend();

    if (nextDividend) {

        const remainingDays =
            daysUntil(
                nextDividend.paymentDate
            );

        if (remainingDays === 0) {

            return "今日は収穫日だよ！";

        }

        if (remainingDays <= 3) {

            return `あと${remainingDays}日で${nextDividend.name}の配当だよ！`;

        }

        return `次の収穫まであと${remainingDays}日です。`;

    }

    if (
        portfolio.length === 0
    ) {

        return "最初の銘柄を登録して、冒険を始めよう！";

    }

    return "次の配当を楽しみに待とう！";

}


// ========================================
// 指定日までの日数
// ========================================

function daysUntil(dateString) {

    const target =
        new Date(
            `${dateString}T00:00:00`
        );

    if (
        Number.isNaN(
            target.getTime()
        )
    ) {

        return 0;

    }

    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );

    return Math.max(
        0,
        Math.ceil(
            (
                target.getTime() -
                today.getTime()
            ) /
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
// Dividend Monsters Ver4.2
// Part 8 / 8
// Initialize + Navigation
// ========================================


// ========================================
// Part4で使用する進化ダイアログ
// ========================================

const levelUpDialog =
    document.getElementById(
        "levelUpDialog"
    );


// ========================================
// モンスターデータの初期化
// ニックネームは一度だけ設定する
// ========================================

function initializeMonster() {

    monster =
        monster &&
        typeof monster === "object"
            ? monster
            : {};

    monster.level =
        Math.max(
            1,
            Number(
                monster.level ||
                1
            )
        );

    monster.exp =
        Math.max(
            0,
            Number(
                monster.exp ||
                0
            )
        );

    monster.stage =
        Math.max(
            1,
            Number(
                monster.stage ||
                1
            )
        );

    if (
        typeof monster.name !==
        "string"
    ) {

        monster.name =
            "";

    }

    /*
     * 初回だけニックネームを確認する。
     * 「タマゴン」のまま確定した場合も、
     * 次回以降は再表示しない。
     */
    if (
        monster.nameInitialized !==
        true
    ) {

        const input =
            window.prompt(
                "相棒の名前を決めましょう！",
                monster.name ||
                "タマゴン"
            );

        if (
            input &&
            input.trim()
        ) {

            monster.name =
                input.trim();

        } else if (
            !monster.name
        ) {

            monster.name =
                "タマゴン";

        }

        monster.nameInitialized =
            true;

        saveData();

    }

}


// ========================================
// 累計受取配当
// ========================================

function calculateReceivedDividendTotal() {

    return dividendHistory.reduce(
        (total, record) =>
            total +
            Number(
                record.amount ||
                0
            ),
        0
    );

}


// ========================================
// 累計受取配当の表示
// ========================================

function renderReceivedDividendTotal() {

    const element =
        document.getElementById(
            "receivedDividendTotal"
        );

    if (!element) {

        return;

    }

    element.textContent =
        formatYen(
            calculateReceivedDividendTotal()
        );

}


// ========================================
// 下部ナビゲーション
// ========================================

function initializeBottomNavigation() {

    const navButtons =
        document.querySelectorAll(
            ".nav-button"
        );

    navButtons.forEach(
        button => {

            /*
             * 初期化が複数回呼ばれても、
             * イベントを重複登録しない。
             */
            if (
                button.dataset
                    .navigationInitialized ===
                "true"
            ) {

                return;

            }

            button.dataset
                .navigationInitialized =
                "true";

            button.addEventListener(
                "click",
                () => {

                    const targetId =
                        button.dataset
                            .scrollTarget;

                    let target =
                        null;

                    switch (targetId) {

                        case "top":

                            window.scrollTo({
                                top: 0,
                                behavior:
                                    "smooth"
                            });

                            break;

                        case "dividendCalendar":

                            target =
                                document.querySelector(
                                    ".calendar-section"
                                );

                            break;

                        case "stockList":

                            target =
                                document.querySelector(
                                    ".portfolio-section"
                                );

                            break;

                        case "monsterBookGrid":

                            target =
                                document.querySelector(
                                    ".monster-book-section"
                                );

                            break;

                        default:

                            target =
                                document.getElementById(
                                    targetId
                                );

                            break;

                    }

                    if (target) {

                        target.scrollIntoView({
                            behavior:
                                "smooth",
                            block:
                                "start"
                        });

                    }

                    navButtons.forEach(
                        navButton => {

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

                }
            );

        }
    );

}


// ========================================
// ダイアログを閉じるボタン
// ========================================

function initializeDialogCloseButtons() {

    document
        .querySelectorAll(
            "[data-close-dialog]"
        )
        .forEach(
            button => {

                if (
                    button.dataset
                        .closeInitialized ===
                    "true"
                ) {

                    return;

                }

                button.dataset
                    .closeInitialized =
                    "true";

                button.addEventListener(
                    "click",
                    () => {

                        const dialogId =
                            button.dataset
                                .closeDialog;

                        const dialog =
                            document
                                .getElementById(
                                    dialogId
                                );

                        if (
                            dialog &&
                            typeof dialog.close ===
                            "function"
                        ) {

                            dialog.close();

                        }

                    }
                );

            }
        );

    const closeLevelUpButton =
        document.getElementById(
            "closeLevelUpButton"
        );

    if (
        closeLevelUpButton &&
        closeLevelUpButton.dataset
            .closeInitialized !==
        "true"
    ) {

        closeLevelUpButton.dataset
            .closeInitialized =
            "true";

        closeLevelUpButton
            .addEventListener(
                "click",
                () => {

                    if (
                        levelUpDialog &&
                        typeof levelUpDialog
                            .close ===
                        "function"
                    ) {

                        levelUpDialog.close();

                    }

                }
            );

    }

}


// ========================================
// 将来の価格更新
// 現在はstocks.jsonの固定価格を使用
// ========================================

async function refreshPrices() {

    return;

}


// ========================================
// 将来の配当データ更新
// 現在はstocks.jsonの固定データを使用
// ========================================

async function refreshDividendDatabase() {

    return;

}


// ========================================
// 毎日起動時の更新
// ========================================

async function dailyBoot() {

    await checkExchangeRate();

    await refreshPrices();

    await refreshDividendDatabase();

    generateUpcomingDividends();

    saveData();

}


// ========================================
// 全画面描画
// ========================================

function render() {

    renderDashboard();

    renderMonster();

    renderReceivedDividendTotal();

    renderHarvest();

    renderPortfolio();

    renderHistory();

    renderCalendar();

    renderAnalytics();

}


// ========================================
// アプリ初期化
// ========================================

async function initializeApp() {

    try {

        loadData();

        await loadStockDatabase();

        migratePortfolio();

        initializeMonster();

        await dailyBoot();

        render();

        showHarvestNotification();

        console.log(
            "Dividend Monsters Ver4.2 Started"
        );

    } catch (error) {

        console.error(
            "Dividend Monstersの起動に失敗しました。",
            error
        );

        showToast(
            "アプリの読み込み中にエラーが発生しました。"
        );

    }

}


// ========================================
// デバッグ用
// 常に最新データを取得できるようgetterを使用
// ========================================

window.dm = {

    get portfolio() {

        return portfolio;

    },

    get stockDatabase() {

        return stockDatabase;

    },

    get monster() {

        return monster;

    },

    get expenses() {

        return expenses;

    },

    get dividendHistory() {

        return dividendHistory;

    },

    get upcomingDividends() {

        return upcomingDividends;

    },

    get harvestedDividends() {

        return harvestedDividends;

    },

    get settings() {

        return settings;

    },

    render,

    generateUpcomingDividends

};


// ========================================
// App Start
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeBottomNavigation();

        initializeDialogCloseButtons();

        initializeApp();

    },
    {
        once: true
    }
);
