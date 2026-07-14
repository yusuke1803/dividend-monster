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
// Dividend Monsters Ver5.0
// Part 3 / 8
// Dividend Schedule + Harvest
// ========================================


// ========================================
// 日付をYYYY-MM-DD形式へ変換
// タイムゾーンによる日付ずれを防止
// ========================================

function getScheduleDateString(date) {

    if (
        !(date instanceof Date) ||
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }

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
// YYYY-MM-DD形式の日付を解析
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

    const date =
        new Date(
            Number(match[1]),
            Number(match[2]) - 1,
            Number(match[3])
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return null;

    }

    return date;

}


// ========================================
// 本日の日付
// ========================================

function getTodayStart() {

    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );

    return today;

}


// ========================================
// 配当予定の識別キー
// ========================================

function createDividendScheduleKey(
    code,
    paymentDate
) {

    return (
        `${String(code || "")
            .trim()
            .toUpperCase()}_` +
        String(paymentDate || "")
    );

}


// ========================================
// 配当予定ID
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
// 予想支払日の設定
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
// 1回分の予想配当額
// 年間配当を支払回数で均等分割
// ========================================

function calculateScheduledDividendAmount(
    stock,
    master
) {

    if (
        !stock ||
        !master
    ) {

        return 0;

    }

    const annualAmount =
        calculateStockAnnualDividend(
            stock
        );

    const paymentMonths =
        Array.isArray(
            master.paymentMonths
        )
            ? master.paymentMonths
                .filter(
                    month => {

                        const value =
                            Number(month);

                        return (
                            value >= 1 &&
                            value <= 12
                        );

                    }
                )
            : [];

    const paymentCount =
        paymentMonths.length > 0
            ? paymentMonths.length
            : 1;

    return Math.max(
        0,
        Math.round(
            annualAmount /
            paymentCount
        )
    );

}


// ========================================
// 収穫済み配当のキー一覧
// ========================================

function getHarvestedDividendKeySet() {

    const keys =
        new Set();

    harvestedDividends.forEach(
        item => {

            if (
                !item?.code ||
                !item?.paymentDate
            ) {

                return;

            }

            keys.add(
                createDividendScheduleKey(
                    item.code,
                    item.paymentDate
                )
            );

        }
    );

    dividendHistory.forEach(
        record => {

            if (
                !record?.stockCode ||
                !record?.date
            ) {

                return;

            }

            keys.add(
                createDividendScheduleKey(
                    record.stockCode,
                    record.date
                )
            );

        }
    );

    return keys;

}


// ========================================
// 配当予定生成
// 本年分と翌年分を生成
// ========================================

function generateUpcomingDividends() {

    const today =
        getTodayStart();

    const currentYear =
        today.getFullYear();

    const targetYears = [
        currentYear,
        currentYear + 1
    ];

    const harvestedKeys =
        getHarvestedDividendKeySet();

    const scheduleMap =
        new Map();

    portfolio.forEach(
        stock => {

            const master =
                getStockMaster(
                    stock
                );

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
                (
                    rawMonth,
                    index
                ) => {

                    const month =
                        Number(
                            rawMonth
                        );

                    if (
                        !Number.isInteger(
                            month
                        ) ||
                        month < 1 ||
                        month > 12
                    ) {

                        return;

                    }

                    const timing =
                        paymentTimings[
                            index
                        ] ||
                        "mid";

                    const day =
                        getPaymentDay(
                            timing
                        );

                    targetYears.forEach(
                        year => {

                            const dateObject =
                                new Date(
                                    year,
                                    month - 1,
                                    day
                                );

                            const paymentDate =
                                getScheduleDateString(
                                    dateObject
                                );

                            const key =
                                createDividendScheduleKey(
                                    stock.code,
                                    paymentDate
                                );

                            /*
                             * 同じ銘柄・同じ日付は
                             * 1件だけ登録する。
                             */
                            if (
                                scheduleMap.has(
                                    key
                                )
                            ) {

                                return;

                            }

                            scheduleMap.set(
                                key,
                                {
                                    id:
                                        createDividendScheduleId(
                                            stock.code,
                                            paymentDate
                                        ),

                                    key,

                                    code:
                                        stock.code,

                                    name:
                                        String(
                                            master.name ||
                                            stock.code
                                        ),

                                    market:
                                        String(
                                            master.market ||
                                            stock.market ||
                                            "JP"
                                        ),

                                    currency:
                                        String(
                                            master.currency ||
                                            stock.currency ||
                                            "JPY"
                                        ),

                                    exchangeRate:
                                        String(
                                            master.currency
                                        ).toUpperCase() ===
                                        "USD"
                                            ? getExchangeRate()
                                            : 1,

                                    amount,

                                    paymentDate,

                                    paymentYear:
                                        year,

                                    paymentMonth:
                                        month,

                                    paymentTiming:
                                        timing,

                                    estimated:
                                        true,

                                    harvested:
                                        harvestedKeys.has(
                                            key
                                        )
                                }
                            );

                        }
                    );

                }
            );

        }
    );

    upcomingDividends =
        Array.from(
            scheduleMap.values()
        )
            .sort(
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
                        (
                            dateA?.getTime() ||
                            0
                        ) -
                        (
                            dateB?.getTime() ||
                            0
                        )
                    );

                }
            );

}


// ========================================
// 本日収穫できる配当
// ========================================

function getHarvestableDividends() {

    const today =
        getTodayStart();

    return upcomingDividends
        .filter(
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

                return (
                    paymentDate.getTime() <=
                    today.getTime()
                );

            }
        )
        .sort(
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
                    (
                        dateA?.getTime() ||
                        0
                    ) -
                    (
                        dateB?.getTime() ||
                        0
                    )
                );

            }
        );

}


// ========================================
// 次回の配当予定
// ========================================

function getNextDividend() {

    const today =
        getTodayStart();

    return (
        upcomingDividends.find(
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

                return (
                    paymentDate.getTime() >
                    today.getTime()
                );

            }
        ) ||
        null
    );

}


// ========================================
// 配当額から獲得EXPを計算
// 100円につき1EXP
// ========================================

function calculateHarvestExp(amount) {

    const numericAmount =
        Number(
            amount || 0
        );

    if (
        !Number.isFinite(
            numericAmount
        ) ||
        numericAmount <= 0
    ) {

        return 0;

    }

    return Math.floor(
        numericAmount /
        100
    );

}


// ========================================
// 履歴に同じ収穫が存在するか
// ========================================

function isDividendAlreadyHarvested(
    code,
    paymentDate
) {

    const key =
        createDividendScheduleKey(
            code,
            paymentDate
        );

    const harvestedMatch =
        harvestedDividends.some(
            item =>
                createDividendScheduleKey(
                    item.code,
                    item.paymentDate
                ) ===
                key
        );

    const historyMatch =
        dividendHistory.some(
            record =>
                createDividendScheduleKey(
                    record.stockCode,
                    record.date
                ) ===
                key
        );

    return (
        harvestedMatch ||
        historyMatch
    );

}


// ========================================
// 収穫記録を作成
// ========================================

function createHarvestRecord(
    item,
    memo
) {

    const harvestedAt =
        new Date()
            .toISOString();

    const gainedExp =
        calculateHarvestExp(
            item.amount
        );

    const scheduleKey =
        createDividendScheduleKey(
            item.code,
            item.paymentDate
        );

    return {
        harvestedItem: {
            ...item,

            harvested:
                true,

            harvestedAt,

            gainedExp
        },

        historyItem: {
            id:
                `history_${scheduleKey}`,

            scheduleKey,

            stockCode:
                item.code,

            stockName:
                item.name,

            amount:
                Math.max(
                    0,
                    Number(
                        item.amount || 0
                    )
                ),

            date:
                item.paymentDate,

            memo:
                String(
                    memo || "収穫"
                ),

            source:
                "scheduled-harvest",

            gainedExp,

            currency:
                item.currency,

            exchangeRate:
                item.exchangeRate,

            estimated:
                item.estimated ===
                true,

            createdAt:
                harvestedAt,

            harvestedAt
        },

        gainedExp
    };

}


// ========================================
// 配当1件を収穫
// ========================================

function harvestDividend(scheduleId) {

    const item =
        upcomingDividends.find(
            dividend =>
                dividend.id ===
                scheduleId
        );

    if (!item) {

        showToast(
            "対象の配当が見つかりません。"
        );

        return false;

    }

    const paymentDate =
        parseScheduleDate(
            item.paymentDate
        );

    const today =
        getTodayStart();

    if (
        !paymentDate ||
        paymentDate.getTime() >
        today.getTime()
    ) {

        showToast(
            "この配当はまだ収穫できません。"
        );

        return false;

    }

    if (
        item.harvested ||
        isDividendAlreadyHarvested(
            item.code,
            item.paymentDate
        )
    ) {

        item.harvested =
            true;

        saveData();

        showToast(
            "この配当は収穫済みです。"
        );

        return false;

    }

    const previousLevel =
        Number(
            monster.level || 1
        );

    const record =
        createHarvestRecord(
            item,
            "予定配当を収穫"
        );

    item.harvested =
        true;

    harvestedDividends.push(
        record.harvestedItem
    );

    dividendHistory.push(
        record.historyItem
    );

    monster.exp =
        Math.max(
            0,
            Number(
                monster.exp || 0
            )
        ) +
        record.gainedExp;

    updateMonsterLevel();

    saveData();

    render();

    const levelUpText =
        Number(
            monster.level
        ) >
        previousLevel
            ? ` Lv.${monster.level}になりました。`
            : "";

    showToast(
        `${item.name}の配当を収穫しました。＋${record.gainedExp} EXP${levelUpText}`
    );

    return true;

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
            "本日収穫できる配当はありません。"
        );

        return;

    }

    const previousLevel =
        Number(
            monster.level || 1
        );

    let harvestedCount = 0;
    let totalAmount = 0;
    let totalExp = 0;

    harvestable.forEach(
        item => {

            if (
                isDividendAlreadyHarvested(
                    item.code,
                    item.paymentDate
                )
            ) {

                item.harvested =
                    true;

                return;

            }

            const record =
                createHarvestRecord(
                    item,
                    "予定配当をまとめて収穫"
                );

            item.harvested =
                true;

            harvestedDividends.push(
                record.harvestedItem
            );

            dividendHistory.push(
                record.historyItem
            );

            harvestedCount += 1;

            totalAmount +=
                Number(
                    item.amount || 0
                );

            totalExp +=
                record.gainedExp;

        }
    );

    if (
        harvestedCount === 0
    ) {

        saveData();

        showToast(
            "対象の配当はすべて収穫済みです。"
        );

        return;

    }

    monster.exp =
        Math.max(
            0,
            Number(
                monster.exp || 0
            )
        ) +
        totalExp;

    updateMonsterLevel();

    saveData();

    render();

    const levelUpText =
        Number(
            monster.level
        ) >
        previousLevel
            ? ` Lv.${monster.level}になりました。`
            : "";

    showToast(
        `${harvestedCount}件、¥${formatYen(totalAmount)}の配当を収穫しました。＋${totalExp} EXP${levelUpText}`
    );

}


// ========================================
// 本日収穫可能な配当額
// ========================================

function getTodayHarvestAmount() {

    return getHarvestableDividends()
        .reduce(
            (
                total,
                item
            ) =>
                total +
                Math.max(
                    0,
                    Number(
                        item.amount || 0
                    )
                ),
            0
        );

}
// ========================================
// Dividend Monsters Ver5.0
// Part 4 / 8
// Monster Growth + Species + Collection
// ========================================


// ========================================
// 成長段階
// imageは正式イラスト完成までの仮表示
// ========================================

const MONSTER_STAGES = [
    {
        level: 1,
        name: "卵",
        image: "🥚"
    },
    {
        level: 5,
        name: "孵化期",
        image: "🐣"
    },
    {
        level: 10,
        name: "幼体",
        image: "🦎"
    },
    {
        level: 15,
        name: "成長期",
        image: "🦖"
    },
    {
        level: 20,
        name: "若体",
        image: "🐉"
    },
    {
        level: 30,
        name: "亜成体",
        image: "🐲"
    },
    {
        level: 40,
        name: "成体",
        image: "🌿"
    },
    {
        level: 55,
        name: "成熟体",
        image: "◆"
    },
    {
        level: 75,
        name: "上位個体",
        image: "◇"
    },
    {
        level: 100,
        name: "完全体",
        image: "◈"
    }
];


// ========================================
// セクター別種族
// 大げさな固有名詞を避け、
// 投資内容が分かる落ち着いた名称に統一
// ========================================

const MONSTER_SPECIES = {
    technology: {
        name: "雷脈種",
        icon: "⚡"
    },

    finance: {
        name: "金鱗種",
        icon: "◉"
    },

    healthcare: {
        name: "薬草種",
        icon: "🌿"
    },

    energy: {
        name: "火成種",
        icon: "◆"
    },

    staples: {
        name: "森林種",
        icon: "🌳"
    },

    industrials: {
        name: "鋼殻種",
        icon: "⬡"
    },

    communication: {
        name: "空響種",
        icon: "◌"
    },

    utilities: {
        name: "水脈種",
        icon: "◈"
    },

    realEstate: {
        name: "岩盤種",
        icon: "▰"
    },

    diversified: {
        name: "混成種",
        icon: "◇"
    },

    standard: {
        name: "標準種",
        icon: "○"
    }
};


// ========================================
// 現在レベルの成長段階を取得
// ========================================

function getMonsterStageByLevel(level) {

    const normalizedLevel =
        Math.max(
            1,
            Number(
                level || 1
            )
        );

    let currentStage =
        MONSTER_STAGES[0];

    MONSTER_STAGES.forEach(
        stage => {

            if (
                normalizedLevel >=
                stage.level
            ) {

                currentStage =
                    stage;

            }

        }
    );

    return currentStage;

}


// ========================================
// 次の成長段階を取得
// ========================================

function getNextMonsterStage(level) {

    const normalizedLevel =
        Math.max(
            1,
            Number(
                level || 1
            )
        );

    return (
        MONSTER_STAGES.find(
            stage =>
                stage.level >
                normalizedLevel
        ) ||
        null
    );

}


// ========================================
// 次のレベルに必要なEXP
// ========================================

function getRequiredExp(level) {

    const normalizedLevel =
        Math.max(
            1,
            Math.floor(
                Number(
                    level || 1
                )
            )
        );

    return (
        normalizedLevel *
        100
    );

}


// ========================================
// セクター名を種族キーへ変換
// ========================================

function normalizeSectorToSpeciesKey(
    sector
) {

    const normalized =
        String(
            sector || ""
        )
            .trim()
            .toLowerCase();

    switch (normalized) {

        case "情報技術":
        case "it":
        case "technology":
        case "半導体":
            return "technology";

        case "金融":
        case "finance":
        case "financials":
            return "finance";

        case "ヘルスケア":
        case "healthcare":
            return "healthcare";

        case "エネルギー":
        case "energy":
            return "energy";

        case "生活必需品":
        case "consumer staples":
        case "staples":
            return "staples";

        case "資本財":
        case "industrials":
        case "industrial":
            return "industrials";

        case "通信":
        case "communication":
        case "communication services":
            return "communication";

        case "公益":
        case "utilities":
        case "utility":
            return "utilities";

        case "不動産":
        case "reit":
        case "real estate":
            return "realEstate";

        case "etf":
        case "投資信託":
        case "分散":
            return "diversified";

        default:
            return "standard";

    }

}


// ========================================
// 保有配当が最大のセクターを取得
// ========================================

function getDominantDividendSector() {

    const sectors =
        calculateSectorData();

    let dominantSector =
        "";

    let highestValue =
        0;

    Object.entries(
        sectors
    )
        .forEach(
            ([sector, value]) => {

                const numericValue =
                    Math.max(
                        0,
                        Number(
                            value || 0
                        )
                    );

                if (
                    numericValue >
                    highestValue
                ) {

                    dominantSector =
                        sector;

                    highestValue =
                        numericValue;

                }

            }
        );

    return dominantSector;

}


// ========================================
// 現在の種族情報
// ========================================

function getMonsterSpeciesData() {

    if (
        portfolio.length === 0
    ) {

        return {
            key: "standard",
            ...MONSTER_SPECIES
                .standard
        };

    }

    const dominantSector =
        getDominantDividendSector();

    const speciesKey =
        normalizeSectorToSpeciesKey(
            dominantSector
        );

    return {
        key:
            speciesKey,

        ...(
            MONSTER_SPECIES[
                speciesKey
            ] ||
            MONSTER_SPECIES
                .standard
        )
    };

}


// ========================================
// 種族表示
// ========================================

function getMonsterSpecies() {

    const species =
        getMonsterSpeciesData();

    return (
        `${species.icon} ` +
        species.name
    );

}


// ========================================
// モンスターの成長段階を更新
// ========================================

function updateMonsterStage() {

    const currentStage =
        getMonsterStageByLevel(
            monster.level
        );

    monster.stage =
        currentStage.level;

    monster.stageName =
        currentStage.name;

}


// ========================================
// EXPを反映してレベルを更新
// ========================================

function updateMonsterLevel() {

    const previousLevel =
        Math.max(
            1,
            Number(
                monster.level || 1
            )
        );

    const previousStage =
        getMonsterStageByLevel(
            previousLevel
        );

    monster.level =
        previousLevel;

    monster.exp =
        Math.max(
            0,
            Number(
                monster.exp || 0
            )
        );

    while (
        monster.exp >=
        getRequiredExp(
            monster.level
        )
    ) {

        monster.exp -=
            getRequiredExp(
                monster.level
            );

        monster.level +=
            1;

    }

    updateMonsterStage();

    const currentStage =
        getMonsterStageByLevel(
            monster.level
        );

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
// 成長段階の変化を表示
// ========================================

function showEvolutionDialog(
    previousStage,
    currentStage
) {

    const dialogImage =
        document.getElementById(
            "levelUpMonsterImage"
        );

    const dialogTitle =
        document.getElementById(
            "levelUpTitle"
        );

    const dialogMessage =
        document.getElementById(
            "levelUpMessage"
        );

    if (
        dialogImage
    ) {

        dialogImage.textContent =
            currentStage.image;

    }

    if (
        dialogTitle
    ) {

        dialogTitle.textContent =
            "成長段階が変化しました";

    }

    if (
        dialogMessage
    ) {

        dialogMessage.textContent =
            `${previousStage.name}から${currentStage.name}へ成長しました。`;

    }

    if (
        typeof levelUpDialog !==
            "undefined" &&
        levelUpDialog &&
        typeof levelUpDialog
            .showModal ===
            "function"
    ) {

        levelUpDialog.showModal();

        return;

    }

    showToast(
        `${currentStage.name}へ成長しました。`
    );

}


// ========================================
// 次の配当日までの日数
// ========================================

function daysUntil(dateString) {

    const target =
        parseScheduleDate(
            dateString
        );

    if (!target) {

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
// 状況に応じたメッセージ
// ========================================

function getMonsterMessage() {

    const harvestable =
        getHarvestableDividends();

    if (
        harvestable.length > 0
    ) {

        return `本日は${harvestable.length}件の配当を収穫できます。`;

    }

    const nextDividend =
        getNextDividend();

    if (
        nextDividend
    ) {

        const remainingDays =
            daysUntil(
                nextDividend.paymentDate
            );

        if (
            remainingDays <= 1
        ) {

            return `${nextDividend.name}の収穫予定日が近づいています。`;

        }

        return `次の収穫まであと${remainingDays}日です。`;

    }

    if (
        portfolio.length === 0
    ) {

        return "銘柄を登録すると、配当の記録と育成が始まります。";

    }

    return "次回の配当予定を確認しています。";

}


// ========================================
// モンスター表示
// ========================================

function renderMonster() {

    updateMonsterStage();

    const currentStage =
        getMonsterStageByLevel(
            monster.level
        );

    const nextStage =
        getNextMonsterStage(
            monster.level
        );

    const requiredExp =
        getRequiredExp(
            monster.level
        );

    const currentExp =
        Math.max(
            0,
            Number(
                monster.exp || 0
            )
        );

    const progressRate =
        requiredExp > 0
            ? (
                currentExp /
                requiredExp
            ) * 100
            : 0;

    if (
        !monster.name
    ) {

        monster.name =
            DEFAULT_MONSTER.name;

    }

    if (
        monsterName
    ) {

        monsterName.textContent =
            monster.name;

    }

    if (
        monsterSpecies
    ) {

        monsterSpecies.textContent =
            `${getMonsterSpecies()}・${currentStage.name}`;

    }

    if (
        monsterLevel
    ) {

        monsterLevel.textContent =
            monster.level;

    }

    if (
        monsterExp
    ) {

        monsterExp.textContent =
            formatNumber(
                currentExp
            );

    }

    if (
        monsterNextExp
    ) {

        monsterNextExp.textContent =
            formatNumber(
                requiredExp
            );

    }

    if (
        monsterExpBar
    ) {

        monsterExpBar.style.width =
            `${Math.min(
                progressRate,
                100
            )}%`;

    }

    if (
        monsterImage
    ) {

        monsterImage.textContent =
            currentStage.image;

        monsterImage.setAttribute(
            "title",
            `${getMonsterSpecies()}・${currentStage.name}`
        );

        monsterImage.setAttribute(
            "aria-label",
            `${getMonsterSpecies()}・${currentStage.name}`
        );

    }

    if (
        monsterMessage
    ) {

        const baseMessage =
            getMonsterMessage();

        const stageMessage =
            nextStage
                ? ` 次の成長段階はLv.${nextStage.level}です。`
                : "";

        monsterMessage.textContent =
            baseMessage +
            stageMessage;

    }

    renderMonsterBook();

}


// ========================================
// 図鑑表示
// ========================================

function renderMonsterBook() {

    const cards =
        document.querySelectorAll(
            ".monster-book-card"
        );

    let unlockedCount =
        0;

    cards.forEach(
        (
            card,
            index
        ) => {

            const stage =
                MONSTER_STAGES[
                    index
                ];

            if (!stage) {

                return;

            }

            const unlocked =
                Number(
                    monster.level || 1
                ) >=
                stage.level;

            card.classList.toggle(
                "unlocked",
                unlocked
            );

            card.classList.toggle(
                "locked",
                !unlocked
            );

            const imageElement =
                card.querySelector(
                    ".book-monster"
                );

            const titleElement =
                card.querySelector(
                    "h3"
                );

            const levelElement =
                card.querySelector(
                    "p"
                );

            if (
                imageElement
            ) {

                imageElement.textContent =
                    unlocked
                        ? stage.image
                        : "—";

            }

            if (
                titleElement
            ) {

                titleElement.textContent =
                    unlocked
                        ? stage.name
                        : "未発見";

            }

            if (
                levelElement
            ) {

                levelElement.textContent =
                    `Lv.${stage.level}`;

            }

            if (
                unlocked
            ) {

                unlockedCount +=
                    1;

            }

        }
    );

    const countElement =
        document.getElementById(
            "monsterBookCount"
        );

    if (
        countElement
    ) {

        countElement.textContent =
            `${unlockedCount} / ${MONSTER_STAGES.length}`;

    }

}

// ========================================
// Dividend Monsters Ver5.0
// Part 5 / 8
// Calendar + Analytics + Achievements
// ========================================


// ========================================
// Part5用HTMLエスケープ
// ========================================

function escapeAnalyticsHtml(value) {

    return String(
        value ?? ""
    )
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ========================================
// セクター別年間予想配当
// annualDividendPerShareは年間額なので
// 月次銘柄も12倍しない
// ========================================

function calculateSectorData() {

    const sectors = {};

    portfolio.forEach(
        stock => {

            const master =
                getStockMaster(
                    stock
                );

            if (!master) {

                return;

            }

            const sector =
                String(
                    master.sector ||
                    "その他"
                );

            const annualDividend =
                calculateStockAnnualDividend(
                    stock
                );

            sectors[sector] =
                (
                    sectors[sector] ||
                    0
                ) +
                annualDividend;

        }
    );

    return sectors;

}


// ========================================
// セクター配当比率データ
// ========================================

function getPieChartData() {

    return Object.entries(
        calculateSectorData()
    )
        .map(
            ([name, value]) => ({
                name,
                value:
                    Math.max(
                        0,
                        Math.round(
                            Number(
                                value || 0
                            )
                        )
                    )
            })
        )
        .filter(
            item =>
                item.value > 0
        )
        .sort(
            (a, b) =>
                b.value -
                a.value
        );

}


// ========================================
// 銘柄別資産比率データ
// ========================================

function getTreeMapData() {

    return portfolio
        .map(
            stock => {

                const master =
                    getStockMaster(
                        stock
                    );

                if (!master) {

                    return null;

                }

                return {
                    code:
                        stock.code,

                    name:
                        String(
                            master.name ||
                            stock.code
                        ),

                    value:
                        Math.max(
                            0,
                            Math.round(
                                calculateStockValue(
                                    stock
                                )
                            )
                        )
                };

            }
        )
        .filter(
            item =>
                item &&
                item.value > 0
        )
        .sort(
            (a, b) =>
                b.value -
                a.value
        );

}


// ========================================
// 指定年の月別受取配当
// ========================================

function getMonthlyDividendData(
    targetYear =
        new Date()
            .getFullYear()
) {

    const monthly =
        Array(12)
            .fill(0);

    dividendHistory.forEach(
        record => {

            const date =
                parseScheduleDate(
                    record.date
                );

            if (
                !date ||
                date.getFullYear() !==
                targetYear
            ) {

                return;

            }

            const monthIndex =
                date.getMonth();

            monthly[monthIndex] +=
                Math.max(
                    0,
                    Number(
                        record.amount || 0
                    )
                );

        }
    );

    return monthly.map(
        (
            value,
            index
        ) => ({
            month:
                index + 1,

            value:
                Math.round(
                    value
                )
        })
    );

}


// ========================================
// 当年の月別予想配当
// 翌年分を同じ月へ合算しない
// ========================================

function getCalendarDividendData(
    targetYear =
        new Date()
            .getFullYear()
) {

    const monthly =
        Array(12)
            .fill(0);

    upcomingDividends.forEach(
        item => {

            const date =
                parseScheduleDate(
                    item.paymentDate
                );

            if (
                !date ||
                date.getFullYear() !==
                targetYear
            ) {

                return;

            }

            monthly[
                date.getMonth()
            ] +=
                Math.max(
                    0,
                    Number(
                        item.amount || 0
                    )
                );

        }
    );

    return monthly;

}


// ========================================
// 配当カレンダー表示
// ========================================

function renderCalendar() {

    if (!dividendCalendar) {

        return;

    }

    const currentYear =
        new Date()
            .getFullYear();

    const monthly =
        getCalendarDividendData(
            currentYear
        );

    const calendarYear =
        document.getElementById(
            "calendarYear"
        );

    if (calendarYear) {

        calendarYear.textContent =
            `${currentYear}年`;

    }

    dividendCalendar.innerHTML =
        monthly
            .map(
                (
                    amount,
                    index
                ) => `
                    <article class="month-item">

                        <span>
                            ${index + 1}月
                        </span>

                        <strong>
                            ¥${formatYen(
                                amount
                            )}
                        </strong>

                        <small>
                            予想
                        </small>

                    </article>
                `
            )
            .join("");

}


// ========================================
// 比率バー共通表示
// ========================================

function createAnalyticsRows(
    items,
    emptyMessage
) {

    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {

        return `
            <div class="chart-placeholder">
                ${escapeAnalyticsHtml(
                    emptyMessage
                )}
            </div>
        `;

    }

    const total =
        items.reduce(
            (
                sum,
                item
            ) =>
                sum +
                Math.max(
                    0,
                    Number(
                        item.value || 0
                    )
                ),
            0
        );

    if (total <= 0) {

        return `
            <div class="chart-placeholder">
                ${escapeAnalyticsHtml(
                    emptyMessage
                )}
            </div>
        `;

    }

    return `
        <div class="analytics-bar-list">

            ${items
                .map(
                    item => {

                        const ratio =
                            (
                                Number(
                                    item.value || 0
                                ) /
                                total
                            ) *
                            100;

                        return `
                            <div class="analytics-bar-item">

                                <div class="analytics-bar-heading">

                                    <span>
                                        ${escapeAnalyticsHtml(
                                            item.name
                                        )}
                                    </span>

                                    <strong>
                                        ${ratio.toFixed(1)}%
                                    </strong>

                                </div>

                                <div class="analytics-bar-track">

                                    <div
                                        class="analytics-bar-fill"
                                        style="width:${Math.min(
                                            ratio,
                                            100
                                        )}%"
                                    ></div>

                                </div>

                                <small>
                                    ¥${formatYen(
                                        item.value
                                    )}
                                </small>

                            </div>
                        `;

                    }
                )
                .join("")}

        </div>
    `;

}


// ========================================
// 月別受取額表示
// ========================================

function createMonthlyDividendRows(
    monthlyData
) {

    const highest =
        Math.max(
            0,
            ...monthlyData.map(
                item =>
                    Number(
                        item.value || 0
                    )
            )
        );

    if (highest <= 0) {

        return `
            <div class="chart-placeholder">
                配当を収穫すると表示されます
            </div>
        `;

    }

    return `
        <div class="monthly-bar-list">

            ${monthlyData
                .map(
                    item => {

                        const width =
                            highest > 0
                                ? (
                                    item.value /
                                    highest
                                ) *
                                100
                                : 0;

                        return `
                            <div class="monthly-bar-item">

                                <span>
                                    ${item.month}月
                                </span>

                                <div class="monthly-bar-track">

                                    <div
                                        class="monthly-bar-fill"
                                        style="width:${Math.min(
                                            width,
                                            100
                                        )}%"
                                    ></div>

                                </div>

                                <strong>
                                    ¥${formatYen(
                                        item.value
                                    )}
                                </strong>

                            </div>
                        `;

                    }
                )
                .join("")}

        </div>
    `;

}


// ========================================
// 分析表示
// ========================================

function renderAnalytics() {

    const sectorChart =
        document.getElementById(
            "sectorChart"
        );

    const treeMapChart =
        document.getElementById(
            "treeMapChart"
        );

    const monthlyDividendChart =
        document.getElementById(
            "monthlyDividendChart"
        );

    if (sectorChart) {

        sectorChart.innerHTML =
            createAnalyticsRows(
                getPieChartData(),
                "銘柄を登録すると表示されます"
            );

    }

    if (treeMapChart) {

        treeMapChart.innerHTML =
            createAnalyticsRows(
                getTreeMapData(),
                "評価額のある銘柄を登録すると表示されます"
            );

    }

    if (monthlyDividendChart) {

        monthlyDividendChart.innerHTML =
            createMonthlyDividendRows(
                getMonthlyDividendData()
            );

    }

}


// ========================================
// 実績条件
// 名称は達成条件が分かる表現に統一
// ========================================

const ACHIEVEMENT_RULES = [
    {
        icon: "✓",
        title: "初回収穫",
        description:
            "初めて予定配当を収穫する",

        check:
            data =>
                data.harvestCount >=
                1,

        progress:
            data =>
                `${Math.min(
                    data.harvestCount,
                    1
                )} / 1回`
    },

    {
        icon: "10",
        title: "収穫10回",
        description:
            "予定配当を10回収穫する",

        check:
            data =>
                data.harvestCount >=
                10,

        progress:
            data =>
                `${Math.min(
                    data.harvestCount,
                    10
                )} / 10回`
    },

    {
        icon: "50",
        title: "収穫50回",
        description:
            "予定配当を50回収穫する",

        check:
            data =>
                data.harvestCount >=
                50,

        progress:
            data =>
                `${Math.min(
                    data.harvestCount,
                    50
                )} / 50回`
    },

    {
        icon: "¥",
        title: "累計受取10万円",
        description:
            "累計受取配当10万円を達成する",

        check:
            data =>
                data.receivedTotal >=
                100000,

        progress:
            data =>
                `¥${formatYen(
                    Math.min(
                        data.receivedTotal,
                        100000
                    )
                )} / ¥100,000`
    },

    {
        icon: "年",
        title: "年間配当50万円",
        description:
            "年間予想配当50万円を達成する",

        check:
            data =>
                data.annualDividend >=
                500000,

        progress:
            data =>
                `¥${formatYen(
                    Math.min(
                        data.annualDividend,
                        500000
                    )
                )} / ¥500,000`
    },

    {
        icon: "30",
        title: "レベル30到達",
        description:
            "モンスターがレベル30に到達する",

        check:
            data =>
                data.level >=
                30,

        progress:
            data =>
                `Lv.${Math.min(
                    data.level,
                    30
                )} / Lv.30`
    },

    {
        icon: "75",
        title: "レベル75到達",
        description:
            "モンスターがレベル75に到達する",

        check:
            data =>
                data.level >=
                75,

        progress:
            data =>
                `Lv.${Math.min(
                    data.level,
                    75
                )} / Lv.75`
    },

    {
        icon: "%",
        title: "生活費カバー100%",
        description:
            "年間予想配当で年間生活費をカバーする",

        check:
            data =>
                data.freedomRate >=
                100,

        progress:
            data =>
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

    /*
     * 手動入力した履歴は収穫回数に含めず、
     * 予定配当の収穫だけを数える。
     */
    const harvestCount =
        dividendHistory.filter(
            record =>
                record.source ===
                    "scheduled-harvest" ||
                record.memo ===
                    "自動収穫" ||
                record.memo ===
                    "まとめて収穫" ||
                record.memo ===
                    "予定配当を収穫" ||
                record.memo ===
                    "予定配当をまとめて収穫"
        ).length;

    const receivedTotal =
        dividendHistory.reduce(
            (
                total,
                record
            ) =>
                total +
                Math.max(
                    0,
                    Number(
                        record.amount || 0
                    )
                ),
            0
        );

    return {
        harvestCount,

        receivedTotal,

        annualDividend:
            calculateAnnualDividend(),

        freedomRate:
            calculateFreedomRate(),

        level:
            Math.max(
                1,
                Number(
                    monster.level || 1
                )
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

    let unlockedCount =
        0;

    achievementList.innerHTML =
        ACHIEVEMENT_RULES
            .map(
                achievement => {

                    const unlocked =
                        achievement.check(
                            data
                        );

                    if (unlocked) {

                        unlockedCount +=
                            1;

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
                                ${escapeAnalyticsHtml(
                                    achievement.icon
                                )}
                            </span>

                            <div class="achievement-content">

                                <h3>
                                    ${escapeAnalyticsHtml(
                                        achievement.title
                                    )}
                                </h3>

                                <p>
                                    ${escapeAnalyticsHtml(
                                        achievement.description
                                    )}
                                </p>

                                <small class="achievement-progress">
                                    ${
                                        unlocked
                                            ? "達成済み"
                                            : escapeAnalyticsHtml(
                                                achievement.progress(
                                                    data
                                                )
                                            )
                                    }
                                </small>

                            </div>

                            <span class="achievement-status">
                                ${
                                    unlocked
                                        ? "✓"
                                        : "—"
                                }
                            </span>

                        </article>
                    `;

                }
            )
            .join("");

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
