import { readFileSync, writeFileSync } from "fs";
import { Transaction, ExpenseCategory } from "../src/schema";

const unique = <T>(a: T[]) => Array.from(new Set(a));

function readJsonFromFile(path: string): any {
    const str = readFileSync(path, "utf-8");
    return JSON.parse(str);
}

const TRANSACTION = readJsonFromFile("./transaction.json");
const ITEM = readJsonFromFile("./item.json");
const PRODUCT = readJsonFromFile("./product.json");

const _labels = unique(PRODUCT.results.bindings.map((product: any) => 
    product.category_label.value));

const transaction = [];

const LUT_PRODUCTID_PRODUCT = new Map();
const LUT_RECEIPTID_TRANSACTION = new Map();

for (const product of PRODUCT.results.bindings)
    LUT_PRODUCTID_PRODUCT
        .set(product.product.value, product);

for (const transaction of TRANSACTION.results.bindings)
    LUT_RECEIPTID_TRANSACTION
        .set(transaction.receipt.value, transaction);

function getCategoryByProductId(id: string) {
    const category_id = LUT_PRODUCTID_PRODUCT.get(id).category.value;

    // further lookup here
    return category_id ?? "__unknown";
}

function getDateByReceiptId(id: string): Date {
    const transaction = LUT_RECEIPTID_TRANSACTION.get(id);
    return new Date(transaction.date.value);
}

function remapTransactions(): Transaction[] {
    return ITEM.results.bindings.map(item => {
        const id = item.product.value;
        const _category_id = getCategoryByProductId(id);
        const date = getDateByReceiptId(item.receipt.value);
        const _category_label = LUT_PRODUCTID_PRODUCT.get(id).category_label.value;
        return {
            id: item.item.value,
            amount: +item.subtotal.value,
            date,
            category: ExpenseCategory.GROCERIES,
            receiptId: item.receipt.value,
            balance: -1,
            _mcp: true,
            _category_id,
            _category_label,
        };
    });
}

function graphdbExport() {
    const transactions = remapTransactions();
    const str = JSON.stringify(transactions, null, 4);
    writeFileSync("./export.json", str);
}

graphdbExport();
