// ========================================
// Dividend Monsters Ver5.0
// Part 1 / 8
// Core State + Storage + DOM
// ========================================

"use strict";


// ========================================
// App Information
// ========================================

const APP_VERSION =
    "5.0.0";

const STORAGE_KEY =
    "dividend-monsters-v4";


// ========================================
// Default State
// ========================================

const DEFAULT_SETTINGS = {
    exchangeRate: 150,
    lastRateUpdate: null,
    notifications: true,
    theme: "forest"
};

const DEFAULT_MONSTER = {
    name: "タマゴン",
    nameInitialized: false,
    level: 1,
    exp: 0,
    stage: 1,
    stageName: "幼体"
};


// ========================================
// Application State
// ========================================

let stockDatabase = {};

let portfolio = [];

let expenses = {};

let dividendHistory = [];

let upcomingDividends = [];

let harvestedDividends = [];

let settings = {
    ...DEFAULT_SETTINGS
};

let monster = {
    ...DEFAULT_MONSTER
};


// ========================================
// Main DOM Elements
// ========================================

const stockList =
    document.getElementById(
        "stockList"
    );

const dividendCalendar =
    document.getElementById(
        "dividendCalendar"
    );

const dividendHistoryList =
    document.getElementById(
        "dividendHistoryList"
    );

const totalAnnualDividend =
    document.getElementById(
        "totalAnnualDividend"
    );

const monthlyDividend =
    document.getElementById(
        "monthlyDividend"
    );

const portfolioValue =
    document.getElementById(
        "portfolioValue"
    );

const freedomRate =
    document.getElementById(
        "freedomRate"
    );

const freedomBar =
    document.getElementById(
        "freedomBar"
    );

const monsterName =
    document.getElementById(
        "monsterName"
    );

const monsterSpecies =
    document.getElementById(
        "monsterSpecies"
    );

const monsterLevel =
    document.getElementById(
        "monsterLevel"
    );

const monsterExp =
    document.getElementById(
        "monsterExp"
    );

const monsterNextExp =
    document.getElementById(
        "monsterNextExp"
    );

const monsterExpBar =
    document.getElementById(
        "monsterExpBar"
    );

const monsterMessage =
    document.getElementById(
        "monsterMessage"
    );

const monsterImage =
    document.querySelector(
        ".monster-image"
    );


// ========================================
// Safe JSON Parse
// ========================================

function parseStoredJson(rawData) {

    if (
        typeof rawData !== "string" ||
        rawData.trim() === ""
    ) {

        return null;

    }

    try {

        return JSON.parse(
            rawData
        );

    } catch (error) {

        console.error(
            "保存データの解析に失敗しました。",
            error
        );

        return null;

    }

}


// ========================================
// Normalize Portfolio
// ========================================

function normalizePortfolioData(data) {

    if (!Array.isArray(data)) {

        return [];

    }

    return data
        .filter(
            item =>
                item &&
                typeof item === "object"
        )
        .map(
            item => ({
                id:
                    typeof item.id === "string"
                        ? item.id
                        : "",

                code:
                    String(
                        item.code || ""
                    )
                        .trim()
                        .toUpperCase(),

                shares:
                    Math.max(
                        0,
                        Number(
                            item.shares || 0
                        )
                    ),

                market:
                    String(
                        item.market || ""
                    ),

                currency:
                    String(
                        item.currency || "JPY"
                    )
            })
        )
        .filter(
            item =>
                item.code !== "" &&
                item.shares > 0
        );

}


// ========================================
// Normalize History
// ========================================

function normalizeHistoryData(data) {

    if (!Array.isArray(data)) {

        return [];

    }

    return data.filter(
        item =>
            item &&
            typeof item === "object"
    );

}


// ========================================
// Normalize Expenses
// ========================================

function normalizeExpenseData(data) {

    if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
    ) {

        return {};

    }

    const normalized = {};

    Object.entries(data)
        .forEach(
            ([key, value]) => {

                normalized[key] =
                    Math.max(
                        0,
                        Number(
                            value || 0
                        )
                    );

            }
        );

    return normalized;

}


// ========================================
// Normalize Settings
// ========================================

function normalizeSettingsData(data) {

    const source =
        data &&
        typeof data === "object"
            ? data
            : {};

    return {
        ...DEFAULT_SETTINGS,

        ...source,

        exchangeRate:
            Number.isFinite(
                Number(
                    source.exchangeRate
                )
            ) &&
            Number(
                source.exchangeRate
            ) > 0
                ? Number(
                    source.exchangeRate
                )
                : DEFAULT_SETTINGS
                    .exchangeRate,

        notifications:
            source.notifications !==
            false
    };

}


// ========================================
// Normalize Monster
// ========================================

function normalizeMonsterData(data) {

    const source =
        data &&
        typeof data === "object"
            ? data
            : {};

    return {
        ...DEFAULT_MONSTER,

        ...source,

        name:
            String(
                source.name ||
                DEFAULT_MONSTER.name
            )
                .trim() ||
            DEFAULT_MONSTER.name,

        nameInitialized:
            source.nameInitialized ===
            true,

        level:
            Math.max(
                1,
                Math.floor(
                    Number(
                        source.level || 1
                    )
                )
            ),

        exp:
            Math.max(
                0,
                Number(
                    source.exp || 0
                )
            ),

        stage:
            Math.max(
                1,
                Number(
                    source.stage || 1
                )
            )
    };

}


// ========================================
// Load stocks.json
// ========================================

async function loadStockDatabase() {

    const response =
        await fetch(
            "./stocks.json",
            {
                cache: "no-store"
            }
        );

    if (!response.ok) {

        throw new Error(
            `stocks.jsonの読込みに失敗しました。HTTP ${response.status}`
        );

    }

    const data =
        await response.json();

    if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
    ) {

        throw new Error(
            "stocks.jsonの形式が正しくありません。"
        );

    }

    stockDatabase =
        data;

}


// ========================================
// Save Application Data
// ========================================

function saveData() {

    const data = {
        appVersion:
            APP_VERSION,

        portfolio,

        expenses,

        dividendHistory,

        upcomingDividends,

        harvestedDividends,

        monster,

        settings,

        savedAt:
            new Date()
                .toISOString()
    };

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(data)
        );

        return true;

    } catch (error) {

        console.error(
            "データの保存に失敗しました。",
            error
        );

        return false;

    }

}


// ========================================
// Load Application Data
// ========================================

function loadData() {

    let rawData = null;

    try {

        rawData =
            localStorage.getItem(
                STORAGE_KEY
            );

    } catch (error) {

        console.error(
            "保存データを読み込めませんでした。",
            error
        );

        return;

    }

    const data =
        parseStoredJson(
            rawData
        );

    if (!data) {

        return;

    }

    portfolio =
        normalizePortfolioData(
            data.portfolio
        );

    expenses =
        normalizeExpenseData(
            data.expenses
        );

    dividendHistory =
        normalizeHistoryData(
            data.dividendHistory
        );

    upcomingDividends =
        normalizeHistoryData(
            data.upcomingDividends
        );

    harvestedDividends =
        normalizeHistoryData(
            data.harvestedDividends
        );

    monster =
        normalizeMonsterData(
            data.monster
        );

    settings =
        normalizeSettingsData(
            data.settings
        );

}
// ========================================
// Dividend Monsters Ver5.0
// Part 2 / 8
// Portfolio Migration + Core Calculations
// ========================================


// ========================================
// 安全なID生成
// ========================================

function createAppId(prefix = "item") {

    if (
        window.crypto &&
        typeof window.crypto.randomUUID ===
        "function"
    ) {

        return window.crypto.randomUUID();

    }

    return (
        `${prefix}_${Date.now()}_` +
        Math.random()
            .toString(16)
            .slice(2)
    );

}


// ========================================
// 銘柄コードの正規化
// stocks.jsonのキーとtickerの両方に対応
// ========================================

function resolveStockCode(code) {

    const normalizedCode =
        String(
            code || ""
        )
            .trim()
            .toUpperCase();

    if (!normalizedCode) {

        return "";

    }

    if (
        stockDatabase[
            normalizedCode
        ]
    ) {

        return normalizedCode;

    }

    const matchedEntry =
        Object.entries(
            stockDatabase
        )
            .find(
                ([databaseCode, master]) => {

                    const ticker =
                        String(
                            master?.ticker || ""
                        )
                            .trim()
                            .toUpperCase();

                    return (
                        ticker ===
                        normalizedCode
                    );

                }
            );

    return matchedEntry
        ? matchedEntry[0]
        : normalizedCode;

}


// ========================================
// 保存済みポートフォリオの移行
// 旧バージョンのデータを安全に補正
// ========================================

function migratePortfolio() {

    const migratedPortfolio =
        portfolio
            .map(
                item => {

                    const resolvedCode =
                        resolveStockCode(
                            item.code
                        );

                    const master =
                        stockDatabase[
                            resolvedCode
                        ];

                    if (!master) {

                        console.warn(
                            "stocks.jsonに存在しない銘柄を除外しました。",
                            item.code
                        );

                        return null;

                    }

                    const shares =
                        Number(
                            item.shares || 0
                        );

                    if (
                        !Number.isFinite(
                            shares
                        ) ||
                        shares <= 0
                    ) {

                        return null;

                    }

                    return {
                        id:
                            item.id ||
                            createAppId(
                                "stock"
                            ),

                        code:
                            resolvedCode,

                        shares,

                        market:
                            String(
                                master.market ||
                                item.market ||
                                "JP"
                            ),

                        currency:
                            String(
                                master.currency ||
                                item.currency ||
                                "JPY"
                            )
                    };

                }
            )
            .filter(Boolean);

    /*
     * 同じ銘柄が複数登録されている旧データは、
     * 株数を合算して1件に統合する。
     */
    const mergedPortfolio =
        new Map();

    migratedPortfolio.forEach(
        item => {

            const existing =
                mergedPortfolio.get(
                    item.code
                );

            if (existing) {

                existing.shares +=
                    Number(
                        item.shares || 0
                    );

                return;

            }

            mergedPortfolio.set(
                item.code,
                {
                    ...item
                }
            );

        }
    );

    portfolio =
        Array.from(
            mergedPortfolio.values()
        );

}


// ========================================
// 為替レート取得
// ========================================

function getExchangeRate() {

    const rate =
        Number(
            settings.exchangeRate
        );

    if (
        Number.isFinite(rate) &&
        rate > 0
    ) {

        return rate;

    }

    return DEFAULT_SETTINGS
        .exchangeRate;

}


// ========================================
// 金額を円換算
// ========================================

function convertToYen(
    amount,
    currency
) {

    const numericAmount =
        Number(
            amount || 0
        );

    if (
        !Number.isFinite(
            numericAmount
        )
    ) {

        return 0;

    }

    if (
        String(currency)
            .toUpperCase() ===
        "USD"
    ) {

        return (
            numericAmount *
            getExchangeRate()
        );

    }

    return numericAmount;

}


// ========================================
// 銘柄マスタ取得
// ========================================

function getStockMaster(stock) {

    if (
        !stock ||
        typeof stock !== "object"
    ) {

        return null;

    }

    return (
        stockDatabase[
            stock.code
        ] ||
        null
    );

}


// ========================================
// 1銘柄の年間予想配当
// annualDividendPerShareは年間合計額として扱う
// ========================================

function calculateStockAnnualDividend(
    stock
) {

    const master =
        getStockMaster(
            stock
        );

    if (!master) {

        return 0;

    }

    const dividendPerShare =
        Number(
            master
                .annualDividendPerShare ||
            0
        );

    const shares =
        Number(
            stock.shares || 0
        );

    if (
        !Number.isFinite(
            dividendPerShare
        ) ||
        !Number.isFinite(
            shares
        ) ||
        dividendPerShare < 0 ||
        shares <= 0
    ) {

        return 0;

    }

    const amount =
        dividendPerShare *
        shares;

    return Math.max(
        0,
        convertToYen(
            amount,
            master.currency
        )
    );

}


// ========================================
// 年間予想配当合計
// ========================================

function calculateAnnualDividend() {

    const total =
        portfolio.reduce(
            (sum, stock) =>
                sum +
                calculateStockAnnualDividend(
                    stock
                ),
            0
        );

    return Math.round(
        total
    );

}


// ========================================
// 月平均予想配当
// ========================================

function calculateMonthlyDividend() {

    return (
        calculateAnnualDividend() /
        12
    );

}


// ========================================
// 1銘柄の評価額
// ========================================

function calculateStockValue(
    stock
) {

    const master =
        getStockMaster(
            stock
        );

    if (!master) {

        return 0;

    }

    const currentPrice =
        Number(
            master.currentPrice || 0
        );

    const shares =
        Number(
            stock.shares || 0
        );

    if (
        !Number.isFinite(
            currentPrice
        ) ||
        !Number.isFinite(
            shares
        ) ||
        currentPrice < 0 ||
        shares <= 0
    ) {

        return 0;

    }

    const value =
        currentPrice *
        shares;

    return Math.max(
        0,
        convertToYen(
            value,
            master.currency
        )
    );

}


// ========================================
// ポートフォリオ評価額合計
// ========================================

function calculatePortfolioValue() {

    const total =
        portfolio.reduce(
            (sum, stock) =>
                sum +
                calculateStockValue(
                    stock
                ),
            0
        );

    return Math.round(
        total
    );

}


// ========================================
// 月間生活費合計
// ========================================

function calculateMonthlyExpense() {

    return Object.values(
        expenses
    )
        .reduce(
            (
                total,
                value
            ) => {

                const numericValue =
                    Number(
                        value || 0
                    );

                if (
                    !Number.isFinite(
                        numericValue
                    ) ||
                    numericValue < 0
                ) {

                    return total;

                }

                return (
                    total +
                    numericValue
                );

            },
            0
        );

}


// ========================================
// 年間生活費合計
// ========================================

function calculateAnnualExpense() {

    return (
        calculateMonthlyExpense() *
        12
    );

}


// ========================================
// 生活費カバー率
// ========================================

function calculateFreedomRate() {

    const annualDividend =
        calculateAnnualDividend();

    const annualExpense =
        calculateAnnualExpense();

    if (
        annualExpense <= 0
    ) {

        return 0;

    }

    return Math.max(
        0,
        (
            annualDividend /
            annualExpense
        ) *
        100
    );

}


// ========================================
// 生活費100%までに必要な年間配当
// ========================================

function calculateRemainingDividendGoal() {

    const annualExpense =
        calculateAnnualExpense();

    const annualDividend =
        calculateAnnualDividend();

    return Math.max(
        0,
        annualExpense -
        annualDividend
    );

}


// ========================================
// ダッシュボード文言
// ========================================

function getFreedomMessage(
    rate,
    monthlyExpense
) {

    if (
        monthlyExpense <= 0
    ) {

        return "生活費を登録すると、配当によるカバー率を表示します。";

    }

    if (
        rate >= 100
    ) {

        return "年間予想配当が、登録した生活費を上回っています。";

    }

    if (
        rate >= 75
    ) {

        return "生活費の大部分を、年間予想配当でカバーしています。";

    }

    if (
        rate >= 50
    ) {

        return "生活費の半分以上を、年間予想配当でカバーしています。";

    }

    if (
        rate >= 25
    ) {

        return "年間予想配当が、生活費の一部を支えています。";

    }

    return "配当の積み上げに応じて、生活費カバー率が上昇します。";

}


// ========================================
// ダッシュボード表示
// ========================================

function renderDashboard() {

    const annualDividend =
        calculateAnnualDividend();

    const averageMonthlyDividend =
        calculateMonthlyDividend();

    const totalPortfolioValue =
        calculatePortfolioValue();

    const monthlyExpense =
        calculateMonthlyExpense();

    const coverageRate =
        calculateFreedomRate();

    const remainingGoal =
        calculateRemainingDividendGoal();

    if (
        totalAnnualDividend
    ) {

        totalAnnualDividend
            .textContent =
            formatYen(
                annualDividend
            );

    }

    if (
        monthlyDividend
    ) {

        monthlyDividend
            .textContent =
            formatYen(
                averageMonthlyDividend
            );

    }

    if (
        portfolioValue
    ) {

        portfolioValue
            .textContent =
            formatYen(
                totalPortfolioValue
            );

    }

    if (
        freedomRate
    ) {

        freedomRate
            .textContent =
            coverageRate
                .toFixed(1);

    }

    if (
        freedomBar
    ) {

        freedomBar.style.width =
            `${Math.min(
                coverageRate,
                100
            )}%`;

    }

    const freedomMessage =
        document.getElementById(
            "freedomMessage"
        );

    if (
        freedomMessage
    ) {

        freedomMessage.textContent =
            getFreedomMessage(
                coverageRate,
                monthlyExpense
            );

    }

    const nextGoalTitle =
        document.getElementById(
            "nextGoalTitle"
        );

    const nextGoalAmount =
        document.getElementById(
            "nextGoalAmount"
        );

    if (
        nextGoalTitle
    ) {

        nextGoalTitle.textContent =
            monthlyExpense > 0
                ? "生活費カバー100%"
                : "生活費を登録してください";

    }

    if (
        nextGoalAmount
    ) {

        nextGoalAmount.textContent =
            monthlyExpense > 0
                ? (
                    remainingGoal > 0
                        ? `あと ¥${formatYen(
                            remainingGoal
                        )}`
                        : "達成済み"
                )
                : "―";

    }

    const summaryStockCount =
        document.getElementById(
            "summaryStockCount"
        );

    if (
        summaryStockCount
    ) {

        summaryStockCount.textContent =
            `${portfolio.length}銘柄`;

    }

}
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
// モンスター図鑑表示
// ========================================

function renderMonsterBook() {

    const cards =
        document.querySelectorAll(
            ".monster-book-card"
        );

    let unlockedCount = 0;

    cards.forEach((card, index) => {

        const stage =
            MONSTER_STAGES[index];

        if (!stage) {

            return;

        }

        const isUnlocked =
            Number(monster.level || 1) >=
            stage.level;

        card.classList.toggle(
            "unlocked",
            isUnlocked
        );

        card.classList.toggle(
            "locked",
            !isUnlocked
        );

        if (isUnlocked) {

            unlockedCount += 1;

        }

    });

    const countElement =
        document.getElementById(
            "monsterBookCount"
        );

    if (countElement) {

        countElement.textContent =
            `${unlockedCount} / ${MONSTER_STAGES.length}`;

    }

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
// 実績システム
// ========================================

const ACHIEVEMENT_RULES = [
    {
        icon: "🌱",
        title: "はじめての収穫",
        description: "初めて配当を収穫する",
        check: data =>
            data.harvestCount >= 1,
        progress: data =>
            `${Math.min(data.harvestCount, 1)} / 1回`
    },
    {
        icon: "🧺",
        title: "収穫の習慣",
        description: "配当を10回収穫する",
        check: data =>
            data.harvestCount >= 10,
        progress: data =>
            `${Math.min(data.harvestCount, 10)} / 10回`
    },
    {
        icon: "🌳",
        title: "熟練の収穫者",
        description: "配当を50回収穫する",
        check: data =>
            data.harvestCount >= 50,
        progress: data =>
            `${Math.min(data.harvestCount, 50)} / 50回`
    },
    {
        icon: "💰",
        title: "配当の芽吹き",
        description: "累計受取配当10万円を達成する",
        check: data =>
            data.receivedTotal >= 100000,
        progress: data =>
            `¥${formatYen(
                Math.min(data.receivedTotal, 100000)
            )} / ¥100,000`
    },
    {
        icon: "🏆",
        title: "年間配当50万円",
        description: "年間予想配当50万円を達成する",
        check: data =>
            data.annualDividend >= 500000,
        progress: data =>
            `¥${formatYen(
                Math.min(data.annualDividend, 500000)
            )} / ¥500,000`
    },
    {
        icon: "🐉",
        title: "成竜への進化",
        description: "モンスターレベル30に到達する",
        check: data =>
            data.level >= 30,
        progress: data =>
            `Lv.${Math.min(data.level, 30)} / Lv.30`
    },
    {
        icon: "👑",
        title: "伝説への道",
        description: "モンスターレベル75に到達する",
        check: data =>
            data.level >= 75,
        progress: data =>
            `Lv.${Math.min(data.level, 75)} / Lv.75`
    },
    {
        icon: "🌟",
        title: "配当で生活する者",
        description: "生活防衛率100%を達成する",
        check: data =>
            data.freedomRate >= 100,
        progress: data =>
            `${Math.min(
                data.freedomRate,
                100
            ).toFixed(1)}% / 100%`
    }
];


// ========================================
// 実績判定用データ
// ========================================

function getAchievementData() {

    const annualDividend =
        calculateAnnualDividend();

    const monthlyExpense =
        calculateMonthlyExpense();

    const annualExpense =
        monthlyExpense * 12;

    const freedomRate =
        annualExpense > 0
            ? (
                annualDividend /
                annualExpense
            ) * 100
            : 0;

    const receivedTotal =
        dividendHistory.reduce(
            (total, record) =>
                total +
                Number(
                    record.amount || 0
                ),
            0
        );

    return {
        harvestCount:
            dividendHistory.length,

        receivedTotal,

        annualDividend,

        freedomRate,

        level:
            Number(
                monster.level || 1
            )
    };

}


// ========================================
// 実績表示
// ========================================

function renderAchievements() {

    const achievementList =
        document.getElementById(
            "achievementList"
        );

    const achievementCount =
        document.getElementById(
            "achievementCount"
        );

    if (!achievementList) {

        return;

    }

    const data =
        getAchievementData();

    let unlockedCount = 0;

    achievementList.innerHTML =
        ACHIEVEMENT_RULES.map(
            achievement => {

                const unlocked =
                    achievement.check(data);

                if (unlocked) {

                    unlockedCount += 1;

                }

                return `
                    <article
                        class="achievement-card ${
                            unlocked
                                ? "unlocked"
                                : "locked"
                        }"
                    >
                        <span class="achievement-icon">
                            ${achievement.icon}
                        </span>

                        <div class="achievement-content">
                            <h3>
                                ${achievement.title}
                            </h3>

                            <p>
                                ${achievement.description}
                            </p>

                            <small class="achievement-progress">
                                ${
                                    unlocked
                                        ? "達成済み"
                                        : achievement.progress(data)
                                }
                            </small>
                        </div>

                        <span class="achievement-status">
                            ${
                                unlocked
                                    ? "✓"
                                    : "🔒"
                            }
                        </span>
                    </article>
                `;

            }
        ).join("");

    if (achievementCount) {

        achievementCount.textContent =
            `${unlockedCount} / ${ACHIEVEMENT_RULES.length}`;

    }

}
// ========================================
// Dividend Monsters Ver4.3
// Part 6 / 8
// Portfolio + History + Harvest
// ========================================

// ---------- Part6 DOM ----------

const stockDialog =
    document.getElementById("stockDialog");

const stockForm =
    document.getElementById("stockForm");

const stockCodeInput =
    document.getElementById("stockCode");

const shareCountInput =
    document.getElementById("shareCount");

const stockSuggestions =
    document.getElementById("stockSuggestions");

const stockPreview =
    document.getElementById("stockPreview");

const stockFormError =
    document.getElementById("stockFormError");

const stockDialogTitle =
    document.getElementById("stockDialogTitle");

const stockSubmitButton =
    document.getElementById("stockSubmitButton");

const stockSort =
    document.getElementById("stockSort");

const stockCount =
    document.getElementById("stockCount");

const summaryStockCount =
    document.getElementById("summaryStockCount");

let editingStockId = null;


// ========================================
// ID生成
// ========================================

function createPortfolioId() {

    if (
        window.crypto &&
        typeof window.crypto.randomUUID === "function"
    ) {

        return window.crypto.randomUUID();

    }

    return `stock_${Date.now()}_${Math.random()
        .toString(16)
        .slice(2)}`;

}


// ========================================
// HTMLエスケープ
// ========================================

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// ========================================
// 株数表示
// ========================================

function formatShares(value) {

    return Number(value || 0)
        .toLocaleString(
            "ja-JP",
            {
                maximumFractionDigits: 4
            }
        );

}


// ========================================
// 銘柄検索
// ========================================

function findStockMaster(keyword) {

    const normalized =
        String(keyword || "")
            .trim()
            .toUpperCase();

    if (!normalized) {

        return null;

    }

    if (stockDatabase[normalized]) {

        return {
            code: normalized,
            master: stockDatabase[normalized]
        };

    }

    const matched =
        Object.entries(stockDatabase)
            .find(([code, master]) => {

                const codeText =
                    String(code || "")
                        .toUpperCase();

                const tickerText =
                    String(master.ticker || "")
                        .toUpperCase();

                const nameText =
                    String(master.name || "")
                        .toUpperCase();

                return (
                    codeText === normalized ||
                    tickerText === normalized ||
                    nameText.includes(normalized)
                );

            });

    if (!matched) {

        return null;

    }

    return {
        code: matched[0],
        master: matched[1]
    };

}


// ========================================
// 銘柄候補生成
// ========================================

function renderStockSuggestions() {

    if (!stockSuggestions) {

        return;

    }

    stockSuggestions.innerHTML =
        Object.entries(stockDatabase)
            .map(([code, master]) => `
                <option
                    value="${escapeHtml(code)}"
                    label="${escapeHtml(master.name || code)}"
                ></option>
            `)
            .join("");

}


// ========================================
// 銘柄プレビュー
// ========================================

function updateStockPreview() {

    if (!stockPreview) {

        return;

    }

    const keyword =
        stockCodeInput?.value || "";

    if (!keyword.trim()) {

        stockPreview.textContent = "";

        return;

    }

    const matched =
        findStockMaster(keyword);

    if (!matched) {

        stockPreview.textContent =
            "stocks.jsonに登録されていない銘柄です。";

        return;

    }

    const { code, master } =
        matched;

    stockPreview.innerHTML = `
        <strong>
            ${escapeHtml(master.name || code)}
        </strong>
        <br>
        コード：${escapeHtml(code)}
        <br>
        年間1株配当：
        ${Number(
            master.annualDividendPerShare || 0
        ).toLocaleString("ja-JP")}
        ${escapeHtml(master.currency || "JPY")}
    `;

}


// ========================================
// フォームエラー
// ========================================

function showStockFormError(message) {

    if (!stockFormError) {

        return;

    }

    stockFormError.textContent =
        message;

    stockFormError.hidden =
        false;

}


function clearStockFormError() {

    if (!stockFormError) {

        return;

    }

    stockFormError.textContent = "";

    stockFormError.hidden = true;

}


// ========================================
// 新規追加ダイアログ
// ========================================

function openNewStockDialog() {

    editingStockId = null;

    stockForm?.reset();

    clearStockFormError();

    if (stockPreview) {

        stockPreview.textContent = "";

    }

    if (stockDialogTitle) {

        stockDialogTitle.textContent =
            "銘柄を追加";

    }

    if (stockSubmitButton) {

        stockSubmitButton.textContent =
            "ポートフォリオに追加";

    }

    if (
        stockDialog &&
        typeof stockDialog.showModal === "function"
    ) {

        stockDialog.showModal();

    }

}


// ========================================
// 編集ダイアログ
// ========================================

function openEditStockDialog(stockId) {

    const stock =
        portfolio.find(
            item => item.id === stockId
        );

    if (!stock) {

        showToast(
            "編集する銘柄が見つかりません。"
        );

        return;

    }

    editingStockId =
        stockId;

    clearStockFormError();

    if (stockCodeInput) {

        stockCodeInput.value =
            stock.code;

    }

    if (shareCountInput) {

        shareCountInput.value =
            stock.shares;

    }

    if (stockDialogTitle) {

        stockDialogTitle.textContent =
            "銘柄を編集";

    }

    if (stockSubmitButton) {

        stockSubmitButton.textContent =
            "変更を保存";

    }

    updateStockPreview();

    if (
        stockDialog &&
        typeof stockDialog.showModal === "function"
    ) {

        stockDialog.showModal();

    }

}


// ========================================
// 銘柄追加・編集
// ========================================

function submitStockForm(event) {

    event.preventDefault();

    clearStockFormError();

    const keyword =
        String(stockCodeInput?.value || "")
            .trim();

    const shares =
        Number(shareCountInput?.value);

    if (!keyword) {

        showStockFormError(
            "銘柄コードまたは銘柄名を入力してください。"
        );

        return;

    }

    if (
        !Number.isFinite(shares) ||
        shares <= 0
    ) {

        showStockFormError(
            "保有株数を正しく入力してください。"
        );

        return;

    }

    const matched =
        findStockMaster(keyword);

    if (!matched) {

        showStockFormError(
            "この銘柄はstocks.jsonに登録されていません。"
        );

        return;

    }

    const { code, master } =
        matched;

    if (editingStockId) {

        const duplicate =
            portfolio.some(
                item =>
                    item.code === code &&
                    item.id !== editingStockId
            );

        if (duplicate) {

            showStockFormError(
                "同じ銘柄がすでに登録されています。"
            );

            return;

        }

        portfolio =
            portfolio.map(item => {

                if (
                    item.id !== editingStockId
                ) {

                    return item;

                }

                return {
                    ...item,
                    code,
                    shares,
                    market:
                        master.market || "JP",
                    currency:
                        master.currency || "JPY"
                };

            });

        showToast(
            `${master.name || code}を更新しました。`
        );

    } else {

        const existing =
            portfolio.find(
                item => item.code === code
            );

        if (existing) {

            existing.shares =
                Number(existing.shares || 0) +
                shares;

            showToast(
                `${master.name || code}の株数を追加しました。`
            );

        } else {

            portfolio.push({
                id: createPortfolioId(),
                code,
                shares,
                market:
                    master.market || "JP",
                currency:
                    master.currency || "JPY"
            });

            showToast(
                `${master.name || code}を追加しました。`
            );

        }

    }

    editingStockId = null;

    generateUpcomingDividends();

    saveData();

    if (
        stockDialog &&
        typeof stockDialog.close === "function"
    ) {

        stockDialog.close();

    }

    render();

}


// ========================================
// 銘柄削除
// ========================================

function deleteStock(stockId) {

    const stock =
        portfolio.find(
            item => item.id === stockId
        );

    if (!stock) {

        return;

    }

    const master =
        stockDatabase[stock.code];

    const name =
        master?.name || stock.code;

    const confirmed =
        window.confirm(
            `${name}を削除しますか？`
        );

    if (!confirmed) {

        return;

    }

    portfolio =
        portfolio.filter(
            item => item.id !== stockId
        );

    generateUpcomingDividends();

    saveData();

    render();

    showToast(
        `${name}を削除しました。`
    );

}


// ========================================
// 1銘柄の年間配当
// ========================================

function calculateStockAnnualDividend(stock) {

    const master =
        stockDatabase[stock.code];

    if (!master) {

        return 0;

    }

    let amount =
        Number(
            master.annualDividendPerShare || 0
        ) *
        Number(stock.shares || 0);

    if (master.currency === "USD") {

        amount *=
            Number(
                settings.exchangeRate || 150
            );

    }

    return Math.max(0, amount);

}


// ========================================
// 1銘柄の評価額
// ========================================

function calculateStockValue(stock) {

    const master =
        stockDatabase[stock.code];

    if (!master) {

        return 0;

    }

    let value =
        Number(master.currentPrice || 0) *
        Number(stock.shares || 0);

    if (master.currency === "USD") {

        value *=
            Number(
                settings.exchangeRate || 150
            );

    }

    return Math.max(0, value);

}


// ========================================
// 並び替え
// ========================================

function getSortedPortfolio() {

    const copied =
        [...portfolio];

    switch (stockSort?.value) {

        case "shares-desc":

            return copied.sort(
                (a, b) =>
                    Number(b.shares || 0) -
                    Number(a.shares || 0)
            );

        case "name-asc":

            return copied.sort(
                (a, b) => {

                    const nameA =
                        stockDatabase[a.code]?.name ||
                        a.code;

                    const nameB =
                        stockDatabase[b.code]?.name ||
                        b.code;

                    return String(nameA)
                        .localeCompare(
                            String(nameB),
                            "ja"
                        );

                }
            );

        case "dividend-desc":
        default:

            return copied.sort(
                (a, b) =>
                    calculateStockAnnualDividend(b) -
                    calculateStockAnnualDividend(a)
            );

    }

}


// ========================================
// ポートフォリオ表示
// ========================================

function renderPortfolio() {

    if (!stockList) {

        return;

    }

    const count =
        portfolio.length;

    if (stockCount) {

        stockCount.textContent =
            `${count}銘柄`;

    }

    if (summaryStockCount) {

        summaryStockCount.textContent =
            `${count}銘柄`;

    }

    if (count === 0) {

        stockList.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    DM
                </div>

                <h3>
                    保有銘柄がありません
                </h3>

                <p>
                    「銘柄追加」から登録してください。
                </p>

            </div>
        `;

        return;

    }

    const totalValue =
        portfolio.reduce(
            (total, stock) =>
                total +
                calculateStockValue(stock),
            0
        );

    stockList.innerHTML =
        getSortedPortfolio()
            .map(stock => {

                const master =
                    stockDatabase[stock.code];

                if (!master) {

                    return "";

                }

                const annual =
                    calculateStockAnnualDividend(
                        stock
                    );

                const value =
                    calculateStockValue(stock);

                const ratio =
                    totalValue > 0
                        ? (
                            value /
                            totalValue
                        ) * 100
                        : 0;

                const next =
                    upcomingDividends.find(
                        item =>
                            item.code === stock.code &&
                            !item.harvested &&
                            parseScheduleDate(
                                item.paymentDate
                            ) >
                            new Date()
                    );

                return `
                    <article class="stock-card">

                        <div class="stock-info">

                            <h3>
                                ${escapeHtml(
                                    master.name ||
                                    stock.code
                                )}
                            </h3>

                            <p>
                                ${escapeHtml(stock.code)}
                                ・
                                ${formatShares(stock.shares)}株
                                ・
                                ${escapeHtml(
                                    master.market ||
                                    stock.market ||
                                    "JP"
                                )}
                            </p>

                        </div>

                        <div class="stock-dividend">

                            <small>
                                年間配当
                            </small>

                            <strong>
                                ¥${formatYen(annual)}
                            </strong>

                        </div>

                        <div class="stock-value">

                            <div>

                                <small>
                                    評価額
                                </small>

                                <strong>
                                    ¥${formatYen(value)}
                                </strong>

                            </div>

                            <small>
                                資産構成比
                                ${ratio.toFixed(1)}%
                                <br>
                                次回：
                                ${
                                    next
                                        ? formatDate(
                                            next.paymentDate
                                        )
                                        : "予定なし"
                                }
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

    document
        .querySelectorAll(
            "[data-edit-stock]"
        )
        .forEach(button => {

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
        .forEach(button => {

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


// ========================================
// 配当履歴
// ========================================

function renderHistory() {

    if (!dividendHistoryList) {

        return;

    }

    if (
        dividendHistory.length === 0
    ) {

        dividendHistoryList.innerHTML = `
            <div class="empty-state compact">

                <h3>
                    まだ収穫がありません
                </h3>

                <p>
                    配当を収穫すると記録されます。
                </p>

            </div>
        `;

        return;

    }

    const history =
        [...dividendHistory]
            .sort(
                (a, b) =>
                    (
                        parseScheduleDate(
                            b.date
                        )?.getTime() || 0
                    ) -
                    (
                        parseScheduleDate(
                            a.date
                        )?.getTime() || 0
                    )
            );

    dividendHistoryList.innerHTML =
        history
            .map(item => `
                <article class="history-card">

                    <div class="history-main">

                        <h3>
                            ${escapeHtml(
                                item.stockName ||
                                item.stockCode ||
                                "名称未登録"
                            )}
                        </h3>

                        <p class="history-meta">
                            ${formatDate(item.date)}
                            ${
                                Number(
                                    item.gainedExp || 0
                                ) > 0
                                    ? `・＋${Number(
                                        item.gainedExp
                                    )}EXP`
                                    : ""
                            }
                        </p>

                    </div>

                    <strong class="history-amount">
                        ¥${formatYen(item.amount)}
                    </strong>

                </article>
            `)
            .join("");

}


// ========================================
// 今日の収穫カード
// ========================================

function renderHarvest() {

    const card =
        document.getElementById(
            "harvestCard"
        );

    const badge =
        document.getElementById(
            "harvestCountBadge"
        );

    if (!card) {

        return;

    }

    const harvestable =
        getHarvestableDividends();

    if (badge) {

        badge.textContent =
            `${harvestable.length}件`;

    }

    if (
        harvestable.length === 0
    ) {

        const next =
            getNextDividend();

        card.innerHTML = `
            <h3>
                今日は収穫はありません
            </h3>

            <p>
                ${
                    next
                        ? `次回は${escapeHtml(
                            next.name
                        )}の配当予定です。`
                        : "次の配当予定はありません。"
                }
            </p>

            <small>
                ${
                    next
                        ? formatDate(
                            next.paymentDate
                        )
                        : "銘柄を登録してください"
                }
            </small>
        `;

        return;

    }

    const total =
        harvestable.reduce(
            (sum, item) =>
                sum +
                Number(item.amount || 0),
            0
        );

    card.innerHTML = `
        <h3>
            🌳 今日収穫できます
        </h3>

        <p>
            合計
            <strong>
                ¥${formatYen(total)}
            </strong>
        </p>

        ${harvestable
            .map(item => `
                <div class="harvest-item">

                    <span>
                        ${escapeHtml(item.name)}
                    </span>

                    <strong>
                        ¥${formatYen(item.amount)}
                    </strong>

                </div>
            `)
            .join("")}

        <button
            class="primary-button"
            type="button"
            onclick="harvestAll()"
        >
            まとめて収穫
        </button>
    `;

}


// ========================================
// ポートフォリオ操作の初期化
// ========================================

function initializePortfolioControls() {

    const openButton =
        document.getElementById(
            "openStockFormButton"
        );

    if (
        openButton &&
        openButton.dataset.initialized !==
        "true"
    ) {

        openButton.dataset.initialized =
            "true";

        openButton.addEventListener(
            "click",
            openNewStockDialog
        );

    }

    if (
        stockCodeInput &&
        stockCodeInput.dataset.initialized !==
        "true"
    ) {

        stockCodeInput.dataset.initialized =
            "true";

        stockCodeInput.addEventListener(
            "input",
            updateStockPreview
        );

    }

    if (
        stockForm &&
        stockForm.dataset.initialized !==
        "true"
    ) {

        stockForm.dataset.initialized =
            "true";

        stockForm.addEventListener(
            "submit",
            submitStockForm
        );

    }

    if (
        stockSort &&
        stockSort.dataset.initialized !==
        "true"
    ) {

        stockSort.dataset.initialized =
            "true";

        stockSort.addEventListener(
            "change",
            renderPortfolio
        );

    }

    renderStockSuggestions();

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
renderAchievements();    

}


// ========================================
// アプリ初期化
// ========================================

async function initializeApp() {

    try {

        loadData();

        await loadStockDatabase();

initializePortfolioControls();

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
