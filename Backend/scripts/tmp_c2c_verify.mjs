import { initializeDatabase } from "../src/config/init_db.js";
import { query } from "../src/config/db.js";

const fail = (msg) => {
  console.error("FAIL:", msg);
  process.exit(1);
};

try {
  await initializeDatabase();

  const tables = await query("SHOW TABLES LIKE 'c2c_registrations'");
  console.log("c2c_registrations table:", tables.length ? "OK" : "MISSING");
  if (!tables.length) fail("c2c_registrations was not created");

  const cols = await query("SHOW COLUMNS FROM c2c_registrations");
  console.log("c2c_registrations cols:", cols.map((c) => c.Field).join(", "));

  const idx = await query("SHOW INDEX FROM c2c_registrations");
  console.log("unique indexes:", [...new Set(idx.filter((i) => i.Non_unique === 0).map((i) => i.Key_name))].join(", "));

  const tp = await query("SHOW COLUMNS FROM training_programs");
  console.log("training_programs c2c cols:", tp.filter((c) => /upi|fee|c2c|registr/i.test(c.Field)).map((c) => c.Field).join(", "));

  const te = await query("SHOW COLUMNS FROM training_enrollments");
  console.log("training_enrollments c2c cols:", te.filter((c) => /c2c|payment|access/i.test(c.Field)).map((c) => c.Field).join(", "));

  console.log("--- c2c.model.js smoke ---");
  const model = await import("../src/models/c2c.model.js");
  const needed = [
    "ensureC2cProgram",
    "createC2cRegistration",
    "listC2cRegistrations",
    "updateC2cPayment",
    "issueC2cRegistrationLink",
    "peekC2cRegistrationToken",
    "consumeC2cRegistrationToken",
    "cancelC2cRegistration",
    "listC2cEnrollments",
    "getC2cDashboardStats",
    "getC2cRegistrationStats",
    "listC2cBranches",
    "normalizePaymentStatus",
    "buildUpiPayload",
  ];
  const missing = needed.filter((n) => typeof model[n] !== "function");
  console.log("model exports:", missing.length ? "MISSING " + missing.join(",") : "all present");
  if (missing.length) fail("model exports missing");

  console.log("normalizePaymentStatus checks:");
  for (const input of ["completed", "paid", "COMPLETED", "part", "partial", "part_payment", "pending", "unpaid", "cancelled", "canceled", "nonsense", null]) {
    console.log(`  ${JSON.stringify(input)} -> ${model.normalizePaymentStatus(input)}`);
  }

  const stats = await model.getC2cDashboardStats({ collegeId: 1, programCode: "C2C" });
  console.log("dashboard stats:", JSON.stringify(stats));
  const regStats = await model.getC2cRegistrationStats({ collegeId: 1, programCode: "C2C" });
  console.log("registration stats:", JSON.stringify(regStats));

  const upi = model.buildUpiPayload({ upiId: "test@upi", payeeName: "Test College", amount: 3500, note: "C2C fee" });
  console.log("upi payload:", upi);

  console.log("OK: migrations + model verified");
  process.exit(0);
} catch (error) {
  fail(error.stack || error.message);
}
