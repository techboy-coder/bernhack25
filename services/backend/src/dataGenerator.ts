import { faker } from "@faker-js/faker";
import { v4 as uuidv4 } from "uuid";
import {
  ExpenseCategory,
  IncomeCategory,
  AccountType,
  type Database,
  type Receipt,
  type Transaction,
  type RecurrentPayment,
  type BankAccount,
  type SavingsProfile,
} from "./schema";

// Swiss locations for realistic data
const SWISS_LOCATIONS = [
  { name: "Zurich", lat: 47.3769, lng: 8.5417 },
  { name: "Geneva", lat: 46.2044, lng: 6.1432 },
  { name: "Basel", lat: 47.5596, lng: 7.5886 },
  { name: "Bern", lat: 46.948, lng: 7.4474 },
  { name: "Lausanne", lat: 46.5197, lng: 6.6323 },
  { name: "Winterthur", lat: 47.4998, lng: 8.7236 },
  { name: "Lucerne", lat: 47.0502, lng: 8.3093 },
  { name: "St. Gallen", lat: 47.4245, lng: 9.3767 },
  { name: "Lugano", lat: 46.0037, lng: 8.9511 },
  { name: "Thun", lat: 46.7578, lng: 7.6283 },
  { name: "Montreux", lat: 46.4312, lng: 6.9106 },
  { name: "Interlaken", lat: 46.6863, lng: 7.8632 },
  { name: "Zug", lat: 47.1667, lng: 8.5167 },
  { name: "Schaffhausen", lat: 47.6979, lng: 8.6306 },
  { name: "Fribourg", lat: 46.8059, lng: 7.1512 },
  { name: "Neuchâtel", lat: 46.9929, lng: 6.931 },
];

// Merchant names by category for realism
const MERCHANTS_BY_CATEGORY = {
  [ExpenseCategory.FOOD]: [
    "Restaurant Helvetia",
    "Bistro du Coin",
    "Pizza Express",
    "Café Central",
    "Burger King",
    "McDonald's",
    "KFC",
    "Subway",
    "Vapiano",
    "Restaurant Frohsinn",
    "Brasserie Lipp",
    "Café de Paris",
    "Restaurant Kronenhalle",
    "Zeughauskeller",
    "Hiltl",
    "Restaurant Bindella",
    "Café Sprüngli",
    "Restaurant Tavolago",
    "Tibits",
    "Restaurant Federal",
    "Bahnhofbuffet",
    "Restaurant Sternen",
    "Pizzeria Molino",
    "Restaurant Adler",
    "Café Einstein",
    "Restaurant Bären",
    "Asian Garden",
    "Sushi Circle",
    "Thai Garden",
    "Istanbul Döner",
  ],
  [ExpenseCategory.GROCERIES]: [
    "Migros",
    "Coop",
    "Denner",
    "Aldi",
    "Lidl",
    "Manor Food",
    "Spar",
    "Volg",
    "Migrolino",
    "Coop Pronto",
    "K Kiosk",
    "Avec",
    "Fresh Market",
    "Bio Marché",
    "Reformhaus",
    "Aperto",
    "Select",
    "Picknic",
    "Carrefour",
    "Migros Take Away",
    "Coop City",
    "Globus Delicatessa",
  ],
  [ExpenseCategory.TRANSPORT]: [
    "SBB",
    "TPG",
    "ZVV",
    "Shell",
    "BP",
    "Esso",
    "Mobility",
    "PubliBike",
    "Uber",
    "Taxi Zurich",
    "VBZ",
    "PostBus",
    "Bernmobil",
    "TL",
    "TAAG",
    "RegionAlps",
    "Europcar",
    "Hertz",
    "Avis",
    "Sixt",
    "Parking Meter",
    "Parkhaus City",
    "Airport Parking",
    "Toll Station",
    "Car Wash Express",
    "Garage Central",
  ],
  [ExpenseCategory.HOUSING]: [
    "Rent Payment",
    "Mortgage Payment",
    "Property Management AG",
    "Hausverwaltung Zurich",
    "Swiss Property Services",
    "Immobilia AG",
    "Wincasa AG",
    "Livit AG",
    "Allreal Property",
    "PSP Swiss Property",
  ],
  [ExpenseCategory.UTILITIES]: [
    "Elektrizitätswerk",
    "Swisscom",
    "UPC",
    "Energie Zurich",
    "BKW",
    "Axpo",
    "Repower",
    "Salt",
    "Sunrise",
    "Quickline",
    "Init7",
    "Green.ch",
    "M-Budget Mobile",
    "Wingo",
    "Lidl Connect",
    "Lebara",
    "Lycamobile",
    "TalkTalk",
    "Digitec Connect",
    "NetPlus",
  ],
  [ExpenseCategory.HEALTHCARE]: [
    "Apotheke",
    "Dr. Mueller",
    "Zahnarzt Weber",
    "Spital",
    "TopPharm",
    "Amavita",
    "Sun Store",
    "Coop Vitality",
    "Medbase",
    "Permanence",
    "Hirslanden",
    "KSA Aarau",
    "Inselspital",
    "CHUV",
    "HUG",
    "Physiotherapie Plus",
    "Optik Melzer",
    "Amplifon",
    "CSS Versicherung",
    "Helsana",
    "Swica",
  ],
  [ExpenseCategory.ENTERTAINMENT]: [
    "Cinema Rex",
    "Pathé Kinos",
    "Kinepolis",
    "Arena Cinemas",
    "Theater Basel",
    "Opernhaus Zurich",
    "Tonhalle",
    "KKL Luzern",
    "Spotify",
    "Netflix",
    "Disney+",
    "Amazon Prime",
    "Apple Music",
    "YouTube Premium",
    "Swisscom TV",
    "UPC TV",
    "Sky Switzerland",
    "Teleclub",
    "Blue Cinema",
    "Concert Hall",
    "Club Mascotte",
    "Kaufleuten",
    "X-TRA",
    "Pacha",
    "Jade Club",
    "Komplex 457",
  ],
  [ExpenseCategory.SHOPPING]: [
    "H&M",
    "Zara",
    "Manor",
    "Globus",
    "Amazon",
    "Zalando",
    "C&A",
    "Peek & Cloppenburg",
    "Ochsner Sport",
    "Intersport",
    "Decathlon",
    "SportXX",
    "Digitec Galaxus",
    "microspot.ch",
    "Brack.ch",
    "Interdiscount",
    "MediaMarkt",
    "Saturn",
    "Fnac",
    "Manor Home",
    "IKEA",
    "Pfister",
    "Micasa",
    "Conforama",
    "XXXLutz",
    "Lipo",
    "Jelmoli",
    "Loeb",
    "PKZ",
    "Grieder",
    "Boutique X",
    "Tchibo",
    "WE Fashion",
    "Esprit",
    "Benetton",
  ],
  [ExpenseCategory.EDUCATION]: [
    "University of Zurich",
    "ETH Zurich",
    "EPFL",
    "University of Basel",
    "University of Bern",
    "University of Geneva",
    "HSG St. Gallen",
    "ZHAW",
    "FHNW",
    "HES-SO",
    "Language School Berlitz",
    "Wall Street English",
    "Inlingua",
    "Benedict School",
    "Coursera",
    "Udemy",
    "LinkedIn Learning",
    "Skillshare",
    "MasterClass",
    "Pluralsight",
    "edX",
    "FutureLearn",
  ],
  [ExpenseCategory.TRAVEL]: [
    "Swiss Travel System",
    "Booking.com",
    "Airbnb",
    "Hotels.com",
    "Expedia",
    "Swiss International",
    "Lufthansa",
    "EasyJet",
    "Ryanair",
    "Air France",
    "KLM",
    "Austrian Airlines",
    "Eurowings",
    "TUI",
    "Kuoni",
    "Hotelplan",
    "Let's Go Tours",
    "STA Travel",
    "Globetrotter",
    "Hertz Rent",
    "Train Tickets",
    "Bus Travel",
    "Ferry Services",
    "Travel Insurance",
    "Currency Exchange",
  ],
  [ExpenseCategory.OTHER]: [
    "Misc Store",
    "Service Provider",
    "ATM Fee",
    "Bank Fee",
    "Insurance Payment",
    "Subscription Service",
    "Professional Service",
    "Repair Service",
    "Cleaning Service",
    "Maintenance",
    "Post Office",
    "Swiss Post",
    "DHL",
    "UPS",
    "FedEx",
    "GLS",
    "City Tax",
    "Government Fee",
    "License Fee",
    "Registration",
  ],
};

const INCOME_MERCHANTS = {
  [IncomeCategory.SALARY]: [
    "UBS AG",
    "Credit Suisse",
    "Swiss Re",
    "Zurich Insurance",
    "Nestlé SA",
    "Novartis AG",
    "Roche Holding",
    "ABB Ltd",
    "Adecco Group",
    "Swiss Life",
    "Swisscom AG",
    "LafargeHolcim",
    "Givaudan SA",
    "Richemont SA",
    "Sika AG",
    "Lonza Group",
    "SGS SA",
    "Sonova Holding",
    "Partners Group",
    "Logitech International",
    "Geberit AG",
    "Swiss Steel",
    "Barry Callebaut",
    "Lindt & Sprüngli",
    "Swatch Group",
    "Kuehne + Nagel",
    "Schindler Holding",
    "SIG Combibloc",
    "Straumann Holding",
    "Temenos Group",
    "Flughafen Zurich",
    "SBB AG",
    "Migros",
    "Coop Group",
    "Manor AG",
    "Swissport",
    "PostFinance",
    "Raiffeisen Bank",
    "Vaudoise Insurance",
    "Mobiliar Insurance",
    "AXA Switzerland",
    "Allianz Suisse",
    "Generali Switzerland",
    "Baloise Group",
    "Tech Startup AG",
    "Consulting Partners",
    "Engineering Solutions",
    "Digital Agency",
    "Marketing Firm",
    "Law Firm Partners",
    "Medical Practice",
    "Architecture Studio",
    "Design Workshop",
    "Software House",
  ],
  [IncomeCategory.FREELANCE]: [
    "Client Project Alpha",
    "Design Work Beta",
    "Consulting Gamma",
    "Web Development",
    "Marketing Campaign",
    "Translation Services",
    "Photography Session",
    "Writing Project",
    "Graphic Design",
    "IT Support",
    "Training Workshop",
    "Event Planning",
    "Legal Advisory",
    "Financial Consulting",
    "Architecture Plans",
    "Engineering Review",
    "Content Creation",
    "Social Media Mgmt",
    "SEO Optimization",
    "App Development",
    "Data Analysis",
    "Market Research",
    "Brand Strategy",
    "Product Design",
    "User Experience",
  ],
  [IncomeCategory.INVESTMENTS]: [
    "UBS Wealth",
    "Credit Suisse PB",
    "Julius Baer",
    "Pictet & Cie",
    "Lombard Odier",
    "Vontobel",
    "Bank Sarasin",
    "EFG International",
    "Mirabaud",
    "LGT Bank",
    "Swissquote",
    "Cornèr Bank",
    "PostFinance Invest",
    "Raiffeisen Invest",
    "Dividend Payment SIX",
    "Bond Interest",
    "ETF Distribution",
    "Real Estate REIT",
    "Crypto Exchange",
    "Stock Sale Profit",
    "Mutual Fund",
    "Pension Fund 2nd",
    "Pension Fund 3rd",
  ],
  [IncomeCategory.GIFTS]: [
    "Family Transfer",
    "Birthday Gift",
    "Holiday Bonus",
    "Wedding Gift",
    "Graduation Gift",
    "Christmas Money",
    "New Year Gift",
    "Anniversary Gift",
    "Achievement Bonus",
    "Inheritance",
    "Gift from Parents",
    "Gift from Relatives",
    "Award Prize",
    "Competition Win",
    "Lucky Draw",
    "Cashback Reward",
    "Loyalty Points",
    "Referral Bonus",
    "Survey Reward",
    "Beta Testing Fee",
  ],
  [IncomeCategory.REFUNDS]: [
    "Tax Refund",
    "Insurance Claim",
    "Product Return",
    "Service Refund",
    "Travel Cancellation",
    "Hotel Refund",
    "Flight Refund",
    "Event Refund",
    "Subscription Refund",
    "Overpayment Return",
    "Deposit Return",
    "Warranty Claim",
    "Damage Compensation",
    "Delayed Flight",
    "Medical Reimburse",
    "Expense Reimburse",
    "Security Deposit",
    "Utility Refund",
    "Credit Card Cashback",
    "Loyalty Cashback",
  ],
  [IncomeCategory.OTHER]: [
    "Miscellaneous Income",
    "Side Income",
    "Garage Sale",
    "Second-hand Sale",
    "Rental Income",
    "Subletting",
    "Parking Rental",
    "Equipment Rental",
    "Tutoring Fee",
    "Pet Sitting",
    "House Sitting",
    "Task Completion",
    "Survey Payment",
    "Focus Group",
    "Clinical Trial",
    "Blood Donation",
    "Recycling Reward",
    "Found Money",
    "Interest Payment",
    "Cashback Apps",
    "Affiliate Commission",
    "Royalty Payment",
    "License Fee",
    "Patent Income",
    "Intellectual Property",
  ],
};

class RealisticDataGenerator {
  private currentDate = new Date("2020-08-20"); // Start from 5 years ago (2020-08-20)
  private userPreferences = {
    preferredLocations: faker.helpers.arrayElements(SWISS_LOCATIONS, 4),
    monthlyIncome: faker.number.int({ min: 4500, max: 7500 }),
    spendingHabits: {
      groceries: { frequency: 3.2, avgAmount: 85 }, // 3-4 times per week
      food: { frequency: 2.1, avgAmount: 32 }, // ~2 times per week
      transport: { frequency: 5.5, avgAmount: 15 }, // Daily commute + extra
      shopping: { frequency: 1.2, avgAmount: 145 }, // More frequent shopping
      entertainment: { frequency: 1.8, avgAmount: 55 }, // More entertainment
    },
  };

  private getRandomLocation() {
    // 70% chance of using preferred locations for realism
    if (faker.number.float() < 0.7) {
      const preferred = faker.helpers.arrayElement(
        this.userPreferences.preferredLocations
      );
      return {
        latitude: preferred.lat + faker.number.float({ min: -0.01, max: 0.01 }),
        longitude:
          preferred.lng + faker.number.float({ min: -0.01, max: 0.01 }),
      };
    }

    const location = faker.helpers.arrayElement(SWISS_LOCATIONS);
    return {
      latitude: location.lat + faker.number.float({ min: -0.05, max: 0.05 }),
      longitude: location.lng + faker.number.float({ min: -0.05, max: 0.05 }),
    };
  }

  private getRealisticAmount(
    category: string,
    isIncome: boolean = false
  ): number {
    if (isIncome) {
      const incomeRanges = {
        [IncomeCategory.SALARY]: { min: 4000, max: 6500 },
        [IncomeCategory.FREELANCE]: { min: 500, max: 2000 },
        [IncomeCategory.INVESTMENTS]: { min: 100, max: 800 },
        [IncomeCategory.GIFTS]: { min: 50, max: 500 },
        [IncomeCategory.REFUNDS]: { min: 30, max: 300 },
        [IncomeCategory.OTHER]: { min: 25, max: 200 },
      };
      const range = incomeRanges[category as keyof typeof incomeRanges];
      return range
        ? faker.number.float({ min: range.min, max: range.max })
        : faker.number.float({ min: 50, max: 500 });
    }

    const expenseRanges = {
      [ExpenseCategory.FOOD]: { min: 8, max: 45 },
      [ExpenseCategory.GROCERIES]: { min: 25, max: 150 },
      [ExpenseCategory.TRANSPORT]: { min: 3, max: 80 },
      [ExpenseCategory.HOUSING]: { min: 800, max: 2500 },
      [ExpenseCategory.UTILITIES]: { min: 50, max: 200 },
      [ExpenseCategory.HEALTHCARE]: { min: 30, max: 300 },
      [ExpenseCategory.ENTERTAINMENT]: { min: 15, max: 100 },
      [ExpenseCategory.SHOPPING]: { min: 20, max: 250 },
      [ExpenseCategory.EDUCATION]: { min: 50, max: 500 },
      [ExpenseCategory.TRAVEL]: { min: 100, max: 1500 },
      [ExpenseCategory.OTHER]: { min: 10, max: 200 },
    };

    const range = expenseRanges[category as keyof typeof expenseRanges];
    return range
      ? faker.number.float({ min: range.min, max: range.max })
      : faker.number.float({ min: 10, max: 100 });
  }

  private advanceTime(days: number) {
    this.currentDate.setDate(this.currentDate.getDate() + days);
  }

  generateReceipts(): Receipt[] {
    const receipts: Receipt[] = [];
    this.currentDate = new Date("2020-08-20"); // Reset to start date (5 years ago)

    // Generate receipts for 5 years (60 months)
    const totalDays = 1826; // Approximately 5 years (365 * 5 + 1 leap day)

    for (let day = 0; day < totalDays; day++) {
      // Generate 4-10 transactions per day
      const transactionsPerDay = faker.number.int({ min: 4, max: 10 });

      for (let i = 0; i < transactionsPerDay; i++) {
        // Determine if it's income or expense (92% expense, 8% income for more realistic ratio)
        const isIncome = faker.number.float() < 0.08;
        const category = isIncome
          ? faker.helpers.arrayElement(Object.values(IncomeCategory))
          : faker.helpers.weightedArrayElement([
              { weight: 0.28, value: ExpenseCategory.FOOD },
              { weight: 0.22, value: ExpenseCategory.GROCERIES },
              { weight: 0.18, value: ExpenseCategory.TRANSPORT },
              { weight: 0.12, value: ExpenseCategory.SHOPPING },
              { weight: 0.08, value: ExpenseCategory.ENTERTAINMENT },
              { weight: 0.04, value: ExpenseCategory.UTILITIES },
              { weight: 0.03, value: ExpenseCategory.HEALTHCARE },
              { weight: 0.02, value: ExpenseCategory.HOUSING },
              { weight: 0.02, value: ExpenseCategory.EDUCATION },
              { weight: 0.01, value: ExpenseCategory.TRAVEL },
            ]);

        const merchantOptions = isIncome
          ? INCOME_MERCHANTS[category as keyof typeof INCOME_MERCHANTS]
          : MERCHANTS_BY_CATEGORY[
              category as keyof typeof MERCHANTS_BY_CATEGORY
            ];

        // Add some time variation within the day (0-23 hours)
        const transactionDate = new Date(this.currentDate);
        transactionDate.setHours(faker.number.int({ min: 6, max: 23 }));
        transactionDate.setMinutes(faker.number.int({ min: 0, max: 59 }));

        receipts.push({
          id: uuidv4(),
          description: isIncome
            ? `${category} payment - ${faker.date.month()}`
            : faker.commerce.productName(),
          merchant: faker.helpers.arrayElement(merchantOptions),
          location: this.getRandomLocation(),
          tags:
            Math.random() < 0.25
              ? faker.helpers.arrayElements(
                  [
                    "business",
                    "personal",
                    "urgent",
                    "planned",
                    "recurring",
                    "one-time",
                  ],
                  faker.number.int({ min: 1, max: 2 })
                )
              : undefined,
        });
      }

      // Move to next day
      this.currentDate.setDate(this.currentDate.getDate() + 1);
    }

    return receipts;
  }

  generateBankAccounts(receipts: Receipt[]): BankAccount[] {
    const personalAccount: BankAccount = {
      id: uuidv4(),
      name: "Personal Checking",
      type: AccountType.PERSONAL,
      currentBalance: 3850.75,
      currency: "CHF",
      transactions: [],
      recurrentPayments: [],
    };

    const savingsAccount: BankAccount = {
      id: uuidv4(),
      name: "High-Yield Savings",
      type: AccountType.SAVINGS,
      currentBalance: 42500.5,
      currency: "CHF",
      transactions: [],
      recurrentPayments: [],
    };

    const retirementAccount: BankAccount = {
      id: uuidv4(),
      name: "Retirement Fund (3rd Pillar)",
      type: AccountType.RETIREMENT,
      currentBalance: 85200.0,
      currency: "CHF",
      transactions: [],
      recurrentPayments: [],
    };

    const marriageAccount: BankAccount = {
      id: uuidv4(),
      name: "Marriage Savings Fund",
      type: AccountType.MARRIAGE,
      currentBalance: 18750.25,
      currency: "CHF",
      transactions: [],
      recurrentPayments: [],
    };

    // Start with reasonable initial balances
    let personalBalance = 5000; // Personal checking starting balance
    let savingsBalance = 15000; // Savings starting balance
    let retirementBalance = 25000; // Retirement starting balance
    let marriageBalance = 5000; // Marriage fund starting balance

    const startDate = new Date("2020-08-20");

    // Generate realistic transactions month by month for 60 months (5 years)
    for (let month = 0; month < 60; month++) {
      const monthDate = new Date(startDate);
      monthDate.setMonth(monthDate.getMonth() + month);

      // 1. Add monthly salary to personal account at the beginning of each month
      const salaryReceipt =
        receipts.find((r) =>
          INCOME_MERCHANTS[IncomeCategory.SALARY].some((m) =>
            r.merchant.includes(m.split(" ")[0])
          )
        ) || receipts[0];

      // Salary increases over time (2-3% annually)
      const yearProgress = month / 12;
      const salaryGrowth = Math.pow(1.025, yearProgress); // 2.5% annual growth
      const baseSalary = this.getRealisticAmount(IncomeCategory.SALARY, true);
      const salaryAmount = baseSalary * salaryGrowth;
      personalBalance += salaryAmount;

      personalAccount.transactions.push({
        id: uuidv4(),
        amount: Math.round(salaryAmount * 100) / 100,
        date: new Date(
          monthDate.getFullYear(),
          monthDate.getMonth(),
          faker.number.int({ min: 1, max: 3 })
        ).toISOString(),
        category: IncomeCategory.SALARY,
        receiptId: salaryReceipt.id,
        balance: Math.round(personalBalance * 100) / 100,
      });

      // 2. Add major monthly expenses to personal account
      const majorExpenses = [
        {
          category: ExpenseCategory.HOUSING,
          amount: 1450 * (1 + yearProgress * 0.03),
          day: 5,
        }, // 3% annual rent increases
        {
          category: ExpenseCategory.UTILITIES,
          amount: 95.5 * (1 + yearProgress * 0.02),
          day: 8,
        }, // 2% annual utility increases
        {
          category: ExpenseCategory.HEALTHCARE,
          amount: 220 * (1 + yearProgress * 0.04),
          day: 12,
        }, // 4% annual healthcare increases
      ];

      for (const expense of majorExpenses) {
        const receipt =
          receipts.find((r) =>
            MERCHANTS_BY_CATEGORY[expense.category].some((m) =>
              r.merchant.includes(m.split(" ")[0])
            )
          ) || receipts[faker.number.int({ min: 0, max: receipts.length - 1 })];

        personalBalance -= expense.amount;
        personalAccount.transactions.push({
          id: uuidv4(),
          amount: -Math.round(expense.amount * 100) / 100,
          date: new Date(
            monthDate.getFullYear(),
            monthDate.getMonth(),
            expense.day
          ).toISOString(),
          category: expense.category,
          receiptId: receipt.id,
          balance: Math.round(personalBalance * 100) / 100,
        });
      }

      // 3. Monthly transfers to different accounts

      // Transfer to savings (70% chance, increasing amount over time)
      if (faker.number.float() < 0.7 && personalBalance > 2000) {
        const baseTransfer = faker.number.float({ min: 400, max: 1200 });
        const transferAmount = baseTransfer * (1 + yearProgress * 0.2); // Increase savings over time
        personalBalance -= transferAmount;
        savingsBalance += transferAmount;

        const transferDate = new Date(
          monthDate.getFullYear(),
          monthDate.getMonth(),
          15
        );

        personalAccount.transactions.push({
          id: uuidv4(),
          amount: -Math.round(transferAmount * 100) / 100,
          date: transferDate.toISOString(),
          category: ExpenseCategory.OTHER,
          receiptId:
            receipts[faker.number.int({ min: 0, max: receipts.length - 1 })].id,
          balance: Math.round(personalBalance * 100) / 100,
        });

        savingsAccount.transactions.push({
          id: uuidv4(),
          amount: Math.round(transferAmount * 100) / 100,
          date: transferDate.toISOString(),
          category: IncomeCategory.OTHER,
          receiptId:
            receipts[faker.number.int({ min: 0, max: receipts.length - 1 })].id,
          balance: Math.round(savingsBalance * 100) / 100,
        });
      }

      // Transfer to retirement (monthly, increasing over time)
      const retirementTransfer =
        faker.number.float({ min: 300, max: 600 }) * (1 + yearProgress * 0.3);
      if (personalBalance > retirementTransfer + 1000) {
        personalBalance -= retirementTransfer;
        retirementBalance += retirementTransfer * 1.05; // 5% annual growth on retirement investments

        const retirementDate = new Date(
          monthDate.getFullYear(),
          monthDate.getMonth(),
          20
        );

        personalAccount.transactions.push({
          id: uuidv4(),
          amount: -Math.round(retirementTransfer * 100) / 100,
          date: retirementDate.toISOString(),
          category: ExpenseCategory.OTHER,
          receiptId:
            receipts[faker.number.int({ min: 0, max: receipts.length - 1 })].id,
          balance: Math.round(personalBalance * 100) / 100,
        });

        retirementAccount.transactions.push({
          id: uuidv4(),
          amount: Math.round(retirementTransfer * 1.05 * 100) / 100,
          date: retirementDate.toISOString(),
          category: IncomeCategory.INVESTMENTS,
          receiptId:
            receipts.find((r) =>
              INCOME_MERCHANTS[IncomeCategory.INVESTMENTS].some((m) =>
                r.merchant.includes(m.split(" ")[0])
              )
            )?.id || receipts[0].id,
          balance: Math.round(retirementBalance * 100) / 100,
        });
      }

      // Transfer to marriage fund (started 3 years ago, accelerating)
      if (month >= 24) {
        // Start marriage savings after 2 years
        const marriageTransfer =
          faker.number.float({ min: 200, max: 500 }) *
          (1 + (month - 24) * 0.05);
        if (personalBalance > marriageTransfer + 500) {
          personalBalance -= marriageTransfer;
          marriageBalance += marriageTransfer;

          const marriageDate = new Date(
            monthDate.getFullYear(),
            monthDate.getMonth(),
            25
          );

          personalAccount.transactions.push({
            id: uuidv4(),
            amount: -Math.round(marriageTransfer * 100) / 100,
            date: marriageDate.toISOString(),
            category: ExpenseCategory.OTHER,
            receiptId:
              receipts[faker.number.int({ min: 0, max: receipts.length - 1 })]
                .id,
            balance: Math.round(personalBalance * 100) / 100,
          });

          marriageAccount.transactions.push({
            id: uuidv4(),
            amount: Math.round(marriageTransfer * 100) / 100,
            date: marriageDate.toISOString(),
            category: IncomeCategory.OTHER,
            receiptId:
              receipts[faker.number.int({ min: 0, max: receipts.length - 1 })]
                .id,
            balance: Math.round(marriageBalance * 100) / 100,
          });
        }
      }

      // 4. Generate daily expenses for personal account
      const daysInMonth = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth() + 1,
        0
      ).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        if ([1, 2, 3, 5, 8, 12, 15, 20, 25].includes(day)) continue; // Skip major transaction days

        const dailyTransactions = faker.number.int({ min: 1, max: 4 });

        for (let i = 0; i < dailyTransactions; i++) {
          if (personalBalance <= 300) break; // Keep minimum buffer

          const category = faker.helpers.weightedArrayElement([
            { weight: 0.35, value: ExpenseCategory.FOOD },
            { weight: 0.25, value: ExpenseCategory.GROCERIES },
            { weight: 0.2, value: ExpenseCategory.TRANSPORT },
            { weight: 0.1, value: ExpenseCategory.SHOPPING },
            { weight: 0.05, value: ExpenseCategory.ENTERTAINMENT },
            { weight: 0.03, value: ExpenseCategory.EDUCATION },
            { weight: 0.02, value: ExpenseCategory.OTHER },
          ]);

          const categoryReceipts = receipts.filter((r) =>
            MERCHANTS_BY_CATEGORY[category].some((m) =>
              r.merchant.includes(m.split(" ")[0])
            )
          );
          const receipt =
            categoryReceipts.length > 0
              ? faker.helpers.arrayElement(categoryReceipts)
              : receipts[
                  faker.number.int({ min: 0, max: receipts.length - 1 })
                ];

          let amount =
            this.getRealisticAmount(category) * (1 + yearProgress * 0.02); // 2% annual inflation
          const maxSpend = personalBalance - 300;
          if (amount > maxSpend) {
            amount = Math.max(5, maxSpend * 0.1);
          }

          personalBalance -= amount;

          personalAccount.transactions.push({
            id: uuidv4(),
            amount: -Math.round(amount * 100) / 100,
            date: new Date(
              monthDate.getFullYear(),
              monthDate.getMonth(),
              day,
              faker.number.int({ min: 8, max: 22 }),
              faker.number.int({ min: 0, max: 59 })
            ).toISOString(),
            category: category,
            receiptId: receipt.id,
            balance: Math.round(personalBalance * 100) / 100,
          });
        }
      }

      // 5. Add savings account interest (monthly)
      if (savingsBalance > 0) {
        const monthlyInterestRate = 0.012 / 12; // 1.2% annual interest rate
        const interestAmount = savingsBalance * monthlyInterestRate;
        savingsBalance += interestAmount;

        savingsAccount.transactions.push({
          id: uuidv4(),
          amount: Math.round(interestAmount * 100) / 100,
          date: new Date(
            monthDate.getFullYear(),
            monthDate.getMonth() + 1,
            0
          ).toISOString(), // Last day of month
          category: IncomeCategory.INVESTMENTS,
          receiptId:
            receipts.find((r) =>
              INCOME_MERCHANTS[IncomeCategory.INVESTMENTS].some((m) =>
                r.merchant.includes("Bank")
              )
            )?.id || receipts[0].id,
          balance: Math.round(savingsBalance * 100) / 100,
        });
      }

      // 6. Occasional freelance income (25% chance per month)
      if (faker.number.float() < 0.25) {
        const freelanceReceipt =
          receipts.find((r) =>
            INCOME_MERCHANTS[IncomeCategory.FREELANCE].some((m) =>
              r.merchant.includes(m.split(" ")[0])
            )
          ) || receipts[faker.number.int({ min: 0, max: receipts.length - 1 })];

        const freelanceAmount =
          this.getRealisticAmount(IncomeCategory.FREELANCE, true) *
          (1 + yearProgress * 0.15);
        personalBalance += freelanceAmount;

        personalAccount.transactions.push({
          id: uuidv4(),
          amount: Math.round(freelanceAmount * 100) / 100,
          date: new Date(
            monthDate.getFullYear(),
            monthDate.getMonth(),
            faker.number.int({ min: 15, max: 28 })
          ).toISOString(),
          category: IncomeCategory.FREELANCE,
          receiptId: freelanceReceipt.id,
          balance: Math.round(personalBalance * 100) / 100,
        });
      }
    }

    // Sort all transactions by date for each account
    [
      personalAccount,
      savingsAccount,
      retirementAccount,
      marriageAccount,
    ].forEach((account) => {
      account.transactions.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Update current balance to final transaction balance
      if (account.transactions.length > 0) {
        account.currentBalance =
          account.transactions[account.transactions.length - 1].balance;
      }
    });

    // Add recurrent payments to personal account
    personalAccount.recurrentPayments = [
      {
        id: uuidv4(),
        amount: 1550, // Adjusted for inflation over 5 years
        name: "Rent",
        category: ExpenseCategory.HOUSING,
        frequency: "monthly" as const,
        startDate: "2020-08-01T00:00:00.000Z",
        autoPay: true,
      },
      {
        id: uuidv4(),
        amount: 105,
        name: "Internet & Phone",
        category: ExpenseCategory.UTILITIES,
        frequency: "monthly" as const,
        startDate: "2020-08-15T00:00:00.000Z",
        autoPay: true,
      },
      {
        id: uuidv4(),
        amount: 250,
        name: "Health Insurance",
        category: ExpenseCategory.HEALTHCARE,
        frequency: "monthly" as const,
        startDate: "2020-09-01T00:00:00.000Z",
        autoPay: false,
      },
      {
        id: uuidv4(),
        amount: 95,
        name: "Mobile Phone",
        category: ExpenseCategory.UTILITIES,
        frequency: "monthly" as const,
        startDate: "2020-08-25T00:00:00.000Z",
        autoPay: true,
      },
      {
        id: uuidv4(),
        amount: 55,
        name: "Gym Membership",
        category: ExpenseCategory.ENTERTAINMENT,
        frequency: "monthly" as const,
        startDate: "2020-09-15T00:00:00.000Z",
        autoPay: true,
      },
      {
        id: uuidv4(),
        amount: 450,
        name: "Retirement Contribution",
        category: ExpenseCategory.OTHER,
        frequency: "monthly" as const,
        startDate: "2020-08-30T00:00:00.000Z",
        autoPay: true,
      },
      {
        id: uuidv4(),
        amount: 350,
        name: "Marriage Fund Transfer",
        category: ExpenseCategory.OTHER,
        frequency: "monthly" as const,
        startDate: "2022-08-25T00:00:00.000Z", // Started 2 years later for marriage savings
        autoPay: true,
      },
    ];

    return [
      personalAccount,
      savingsAccount,
      retirementAccount,
      marriageAccount,
    ];
  }

  generateSavingsProfiles(): SavingsProfile[] {
    return [
      {
        id: uuidv4(),
        name: "Emergency Fund",
        targetAmount: 10000,
        startDate: "2024-01-01T00:00:00.000Z",
        targetDate: "2024-12-31T00:00:00.000Z",
        category: "Emergency",
      },
      {
        id: uuidv4(),
        name: "Vacation to Japan",
        targetAmount: 4500,
        startDate: "2024-03-01T00:00:00.000Z",
        targetDate: "2025-06-01T00:00:00.000Z",
        category: "Travel",
      },
      {
        id: uuidv4(),
        name: "New Laptop",
        targetAmount: 2200,
        startDate: "2024-05-01T00:00:00.000Z",
        category: "Technology",
      },
    ];
  }

  generateDatabase(): Database {
    const receipts = this.generateReceipts();
    const bankAccounts = this.generateBankAccounts(receipts);
    const savingsProfiles = this.generateSavingsProfiles();

    return {
      bankAccounts,
      receipts,
      savingsProfiles,
    };
  }
}

export function generateRealisticData(): Database {
  faker.seed(42); // For consistent data generation
  const generator = new RealisticDataGenerator();
  return generator.generateDatabase();
}
