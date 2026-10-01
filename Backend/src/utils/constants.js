export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  COLLEGE_ADMIN: 'college_admin',
  COORDINATOR: 'coordinator',
  MENTOR: 'mentor',
  STUDENT: 'student',
};

export const MILESTONE_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  BLOCKED: 'blocked',
};

// C2C (Campus to Corporate) program
export const C2C_PROGRAM_CODE = 'C2C 2026';

/**
 * C2C payment status. Exactly one value applies to an enrollment at any time.
 * Stored as a MySQL ENUM on both `c2c_registrations` and `training_enrollments`.
 */
export const C2C_PAYMENT_STATUS = {
  PENDING: 'pending',
  PART_PAYMENT: 'part_payment',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const C2C_PAYMENT_STATUS_VALUES = Object.values(C2C_PAYMENT_STATUS);

/**
 * TrainX software / access state granted to an enrolled student.
 * `not_activated` is the state a student sits in after the payment QR is issued
 * but before they redeem the registration link and get approved.
 */
export const C2C_ACCESS_STATUS = {
  NOT_ACTIVATED: 'not_activated',
  PENDING: 'pending',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  REVOKED: 'revoked',
};

export const C2C_ACCESS_STATUS_VALUES = Object.values(C2C_ACCESS_STATUS);

/**
 * Progress of the C2C intake record (created when the payment QR is issued).
 *
 * awaiting_payment   -> QR issued, no payment recorded yet
 * awaiting_registration -> full/part payment recorded, registration link releasable
 * awaiting_approval  -> student registered via the link, waiting for admin approval
 * enrolled           -> approved, C2C Enrollment auto-created
 * cancelled          -> lead abandoned before enrolment
 */
export const C2C_REGISTRATION_STATUS = {
  AWAITING_PAYMENT: 'awaiting_payment',
  AWAITING_REGISTRATION: 'awaiting_registration',
  AWAITING_APPROVAL: 'awaiting_approval',
  ENROLLED: 'enrolled',
  CANCELLED: 'cancelled',
};

export const C2C_REGISTRATION_STATUS_VALUES = Object.values(C2C_REGISTRATION_STATUS);

/**
 * A registration link may only be released once at least some money has come in.
 */
export const C2C_PAYMENT_QUALIFYING_STATUSES = [
  C2C_PAYMENT_STATUS.PART_PAYMENT,
  C2C_PAYMENT_STATUS.COMPLETED,
];
