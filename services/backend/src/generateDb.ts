import { generateRealisticData } from "./dataGenerator";
import { DbSchema } from "./schema";

// Generate the realistic data
const database = generateRealisticData();

// Validate against schema
try {
  const validatedData = DbSchema.parse(database);
  console.log("✅ Database validation successful!");

  // Write to db.json file
  const fs = require("fs");
  fs.writeFileSync("./db/db.json", JSON.stringify(validatedData, null, 2));
  console.log("✅ Database saved to db.json");

  // Print some statistics
  console.log("\n📊 Database Statistics:");
  console.log(`- Bank Accounts: ${validatedData.bankAccounts.length}`);
  console.log(`- Total Receipts: ${validatedData.receipts.length}`);
  console.log(
    `- Total Transactions: ${validatedData.bankAccounts.reduce(
      (sum, acc) => sum + acc.transactions.length,
      0
    )}`
  );
  console.log(`- Savings Profiles: ${validatedData.savingsProfiles.length}`);

  validatedData.bankAccounts.forEach((account) => {
    console.log(
      `- ${account.name} (${account.type}): ${account.currentBalance} CHF, ${account.transactions.length} transactions`
    );
  });
} catch (error) {
  console.error("❌ DB validation error:", error);
}
