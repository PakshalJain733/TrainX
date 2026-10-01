import { query } from "../src/config/db.js";
import * as model from "../src/models/c2c.model.js";
import { finalizeC2cEnrollmentForUser, buildC2cRegistrationLink } from "../src/services/c2cEnrollment.service.js";

const COLLEGE = 1;
const stamp = Date.now();
const results = [];
let failures = 0;

const check = (label, pass, extra = "") => {
  results.push(`${pass ? "PASS" : "FAIL"}  ${label}${extra ? " -> " + extra : ""}`);
  if (!pass) failures += 1;
};

const cleanup = async (userIds, registrationIds, enrollmentIds) => {
  if (enrollmentIds.length) await query(`DELETE FROM training_enrollments WHERE id IN (${enrollmentIds.map(() => "?").join(",")})`, enrollmentIds);
  await query("UPDATE c2c_registrations SET enrollment_id = NULL WHERE id IN (" + registrationIds.map(() => "?").join(",") + ")", registrationIds);
  if (registrationIds.length) await query(`DELETE FROM c2c_registrations WHERE id IN (${registrationIds.map(() => "?").join(",")})`, registrationIds);
  if (userIds.length) await query(`DELETE FROM users WHERE id IN (${userIds.map(() => "?").join(",")})`, userIds);
};

const registrationIds = [];
const userIds = [];
const enrollmentIds = [];

try {
  const program = await model.ensureC2cProgram(COLLEGE);
  check("ensureC2cProgram returns a program", !!program?.id, `program id=${program?.id} code=${program?.code}`);
  check("program has fee + upi defaults", program.fee_amount > 0, `fee=${program.fee_amount} upi=${program.upi_id || "(none)"}`);

  // ---------------------------------------------------------------- Lead A
  const a = await model.createC2cRegistration({
    collegeId: COLLEGE,
    name: "C2C Test Alpha",
    email: `c2c.alpha.${stamp}@test.local`,
    mobile: "9876543210",
    rollNumber: `A${stamp}`,
    branch: "Computer Science",
  });
  check("create lead A", !!a.registrationId, JSON.stringify(a.error || a.registrationId));
  registrationIds.push(a.registrationId);
  userIds.push(a.userId);

  const dupA = await model.createC2cRegistration({
    collegeId: COLLEGE,
    name: "C2C Test Alpha",
    email: `c2c.alpha.${stamp}@test.local`,
    mobile: "9876543210",
    rollNumber: `A${stamp}`,
    branch: "Computer Science",
  });
  check("duplicate lead rejected", !!dupA.error, dupA.error);

  // No payment yet -> link must be refused
  const earlyLink = await model.issueC2cRegistrationLink(a.registrationId);
  check("link refused before payment", !!earlyLink.error, earlyLink.error);

  // Record a part payment
  const partPay = await model.updateC2cPayment(a.registrationId, {
    amountPaid: 1000,
    utr: `UTR${stamp}A`,
    paymentDate: "2026-01-15",
    paymentStatus: "part_payment",
  });
  check("part payment recorded", partPay.paymentStatus === "part_payment" && partPay.amountPaid === 1000, JSON.stringify(partPay));

  const afterPart = await model.getC2cRegistrationById(a.registrationId);
  check("lead A moved to awaiting_registration", afterPart.status === "awaiting_registration", afterPart.status);

  // Link now allowed
  const linkA = await model.issueC2cRegistrationLink(a.registrationId);
  check("link issued after part payment", !!linkA.token, linkA.error || "token ok");
  check("registration link shape", buildC2cRegistrationLink(linkA.token).includes("/register?c2c_token="), buildC2cRegistrationLink(linkA.token));

  // Token peek (prefill) must not consume
  const peek = await model.peekC2cRegistrationToken(linkA.token);
  check("token peek valid", peek?.valid === true, JSON.stringify(peek?.valid));
  check("token peek prefills student", peek?.name === "C2C Test Alpha" && peek?.rollNumber === `A${stamp}`, JSON.stringify(peek && { name: peek.name, roll: peek.rollNumber, branch: peek.branch }));

  const peekAgain = await model.peekC2cRegistrationToken(linkA.token);
  check("token peek is not consumed", peekAgain?.valid === true);

  const badToken = await model.peekC2cRegistrationToken("definitely-not-a-token");
  check("bogus token rejected", badToken?.valid === false);

  // Consume the token as the student registering
  const consumed = await model.consumeC2cRegistrationToken(linkA.token, a.userId);
  check("token consumed", !!consumed.registrationId, JSON.stringify(consumed.error || consumed.status));

  const afterConsume = await model.getC2cRegistrationById(a.registrationId);
  check("lead A moved to awaiting_approval", afterConsume.status === "awaiting_approval", afterConsume.status);
  check("registered_at stamped", !!afterConsume.registeredAt);

  // Approve -> automatic enrollment
  const finalize = await finalizeC2cEnrollmentForUser(a.userId, { id: 1 });
  check("approval auto-created enrollment", finalize.created === true, JSON.stringify(finalize));
  if (finalize.enrollmentId) enrollmentIds.push(finalize.enrollmentId);

  const enrolledA = await model.getC2cRegistrationById(a.registrationId);
  check("lead A status -> enrolled", enrolledA.status === "enrolled", enrolledA.status);

  // Re-approving must not duplicate
  const finalizeAgain = await finalizeC2cEnrollmentForUser(a.userId, { id: 1 });
  check("re-approval does not duplicate", finalizeAgain.duplicate === true || finalizeAgain.created === false, JSON.stringify(finalizeAgain));

  const dupEnroll = await query("SELECT id FROM training_enrollments WHERE student_user_id = ? AND program_id = ?", [a.userId, program.id]);
  check("exactly one enrollment row", dupEnroll.length === 1, `rows=${dupEnroll.length}`);

  // Access status on the enrollment
  const access = await model.updateC2cEnrollmentAccess(finalize.enrollmentId, { accessStatus: "active" });
  check("access status set to active", access.updated === true, JSON.stringify(access.error || access));

  // ---------------------------------------------------------------- Lead B (full payment, second college admin path)
  const b = await model.createC2cRegistration({
    collegeId: COLLEGE,
    name: "C2C Test Beta",
    email: `c2c.beta.${stamp}@test.local`,
    mobile: "9123456780",
    rollNumber: `B${stamp}`,
    branch: "Electronics",
  });
  registrationIds.push(b.registrationId);
  userIds.push(b.userId);
  check("create lead B", !!b.registrationId, JSON.stringify(b.error || b.registrationId));

  const fullPay = await model.updateC2cPayment(b.registrationId, { paymentStatus: "completed", utr: `UTR${stamp}B` });
  check("completed payment fills the fee", fullPay.paymentStatus === "completed" && fullPay.amountPaid === program.fee_amount, JSON.stringify(fullPay));

  // Derive status from amount alone when status is omitted
  const c = await model.createC2cRegistration({
    collegeId: COLLEGE,
    name: "C2C Test Gamma",
    email: `c2c.gamma.${stamp}@test.local`,
    mobile: "9000000000",
    rollNumber: `C${stamp}`,
  });
  registrationIds.push(c.registrationId);
  userIds.push(c.userId);
  const derived = await model.updateC2cPayment(c.registrationId, { amountPaid: 500 });
  check("part payment derived from amount", derived.paymentStatus === "part_payment", JSON.stringify(derived));

  // Cancelled payment blocks the link
  const cancelledLink = await model.issueC2cRegistrationLink(c.registrationId);
  check("cancelled/pending lead cannot get link before payment", !!cancelledLink.error, cancelledLink.error);

  // Cancelling a lead that never enrolled
  const cancelRes = await model.cancelC2cRegistration(c.registrationId);
  check("cancel lead C", cancelRes.updated === true, JSON.stringify(cancelRes.error || cancelRes));

  const cancelEnrolled = await model.cancelC2cRegistration(a.registrationId);
  check("cannot cancel an enrolled lead", !!cancelEnrolled.error, cancelEnrolled.error);

  // Amount cannot exceed the fee
  const overPay = await model.updateC2cPayment(b.registrationId, { amountPaid: program.fee_amount + 5000 });
  check("overpayment capped at fee", overPay.amountPaid === program.fee_amount, JSON.stringify(overPay));

  // ---------------------------------------------------------------- List + filters
  const list = await model.listC2cRegistrations({ collegeId: COLLEGE, programCode: program.code });
  check("list registrations", Array.isArray(list) && list.length >= 3, `count=${list?.length}`);

  const completedOnly = await model.listC2cRegistrations({ collegeId: COLLEGE, programCode: program.code, paymentStatus: "paid" });
  check("legacy alias filter works", completedOnly.every((r) => r.paymentStatus === "completed"), `count=${completedOnly.length}`);

  const unpaidOnly = await model.listC2cRegistrations({ collegeId: COLLEGE, programCode: program.code, paymentStatus: "unpaid" });
  check("unpaid alias maps to pending", unpaidOnly.length >= 1, `count=${unpaidOnly.length}`);

  const searchHit = await model.listC2cRegistrations({ collegeId: COLLEGE, programCode: program.code, search: "Beta" });
  check("search filter", searchHit.length === 1 && searchHit[0].name === "C2C Test Beta", `count=${searchHit.length}`);

  const enrollList = await model.listC2cEnrollments({ collegeId: COLLEGE, programCode: program.code, search: "Alpha" });
  check("list enrollments", enrollList.length === 1, `count=${enrollList.length}`);
  if (enrollList[0]) {
    check("enrollment carries payment info", enrollList[0].paymentStatus === "completed" || enrollList[0].paymentStatus === "part_payment", JSON.stringify({ p: enrollList[0].paymentStatus, paid: enrollList[0].amountPaid, fee: enrollList[0].totalFee }));
    check("enrollment carries access status", enrollList[0].accessStatus === "active", enrollList[0].accessStatus);
  }

  const dash = await model.getC2cDashboardStats({ collegeId: COLLEGE, programCode: program.code });
  check("dashboard totals", dash.totalEnrolled === 1, JSON.stringify(dash));

  const regDash = await model.getC2cRegistrationStats({ collegeId: COLLEGE, programCode: program.code });
  check("registration counters", regDash.total >= 3, JSON.stringify(regDash));

  const branches = await model.listC2cBranches({ collegeId: COLLEGE, programCode: program.code });
  check("branch list", Array.isArray(branches), JSON.stringify(branches));

  // Program settings update
  const progUpdate = await model.updateC2cProgram(program.id, { feeAmount: 3500, upiId: "smoke@upi", payeeName: "Smoke College" });
  check("program settings persist", progUpdate.upi_id === "smoke@upi", JSON.stringify(progUpdate.error || progUpdate));
} catch (error) {
  check("unexpected error", false, error.stack || error.message);
} finally {
  try {
    await cleanup(userIds, registrationIds, enrollmentIds);
  } catch (cleanupError) {
    results.push(`WARN  cleanup failed: ${cleanupError.message}`);
  }
}

console.log("\n===== C2C END-TO-END =====");
results.forEach((line) => console.log(line));
console.log(`\n${failures === 0 ? "ALL PASSED" : failures + " FAILURE(S)"}`);
process.exit(failures === 0 ? 0 : 1);
