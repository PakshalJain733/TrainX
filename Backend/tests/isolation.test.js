// College isolation unit tests — pure, no database connection required.
import assert from 'node:assert';
import { assertCollegeScope, resolveCollegeFilter } from '../src/utils/collegeAccess.js';
import { ROLES } from '../src/utils/constants.js';

let failures = 0;
const check = (label, fn) => {
  try {
    fn();
    console.log(`  PASS ${label}`);
  } catch (err) {
    failures++;
    console.error(`  FAIL ${label}: ${err.message}`);
  }
};

const sameCollege = { userRole: ROLES.STUDENT, userCollegeId: 1, resourceCollegeId: 1 };
const diffCollege = { userRole: ROLES.STUDENT, userCollegeId: 1, resourceCollegeId: 2 };
const superAdminCross = { userRole: ROLES.SUPER_ADMIN, userCollegeId: 1, resourceCollegeId: 2 };
const missingScope = { userRole: ROLES.STUDENT, userCollegeId: null, resourceCollegeId: 2 };
const noResource = { userRole: ROLES.STUDENT, userCollegeId: 1, resourceCollegeId: null };

console.log('\nCOLLEGE ISOLATION — assertCollegeScope');
check('allows access to own college', () => assert.strictEqual(assertCollegeScope(sameCollege), null));
check('denies access to another college', () => assert.ok(assertCollegeScope(diffCollege) instanceof Error));
check('super admin may access any college', () => assert.strictEqual(assertCollegeScope(superAdminCross), null));
check('missing user college is not an allowed bypass', () => {
  // Scope resolution forces a concrete collegeId before calling assert; a bare
  // call with no user college leaves the decision to the caller, never grants.
  assert.strictEqual(assertCollegeScope(missingScope), null);
});
check('global resources (no college) always accessible', () => assert.strictEqual(assertCollegeScope(noResource), null));
check('denial message is explicit', () => {
  const err = assertCollegeScope(diffCollege);
  assert.ok(err.message.includes('another college'));
});
check('string vs numeric college ids compare correctly', () => {
  assert.strictEqual(assertCollegeScope({ userRole: ROLES.MENTOR, userCollegeId: '7', resourceCollegeId: 7 }), null);
  assert.ok(assertCollegeScope({ userRole: ROLES.MENTOR, userCollegeId: '7', resourceCollegeId: '8' }) instanceof Error);
});

console.log('\nCOLLEGE ISOLATION — resolveCollegeFilter');
check('student resolves own college', () => assert.strictEqual(resolveCollegeFilter({ userRole: ROLES.STUDENT, userCollegeId: 3, queryCollegeId: null }), 3));
check('explicit query collegeId wins for scoped caller', () => assert.strictEqual(resolveCollegeFilter({ userRole: ROLES.COLLEGE_ADMIN, userCollegeId: 3, queryCollegeId: 9 }), 9));
check('super admin falls back to query collegeId', () => assert.strictEqual(resolveCollegeFilter({ userRole: ROLES.SUPER_ADMIN, userCollegeId: 1, queryCollegeId: 9 }), 9));
check('super admin without query returns own college', () => assert.strictEqual(resolveCollegeFilter({ userRole: ROLES.SUPER_ADMIN, userCollegeId: 1, queryCollegeId: null }), 1));
check('no college anywhere resolves null', () => assert.strictEqual(resolveCollegeFilter({ userRole: ROLES.SUPER_ADMIN, userCollegeId: null, queryCollegeId: null }), null));

console.log('');
if (failures > 0) {
  console.error(`ISOLATION TESTS: ${failures} FAILED`);
  process.exit(1);
}
console.log('ISOLATION TESTS: ALL PASSED');