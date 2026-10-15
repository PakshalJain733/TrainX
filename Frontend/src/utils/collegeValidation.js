/**
 * College Registration and Profile Validation Utility
 * Detects keyboard walks, gibberish/random keystrokes, placeholder data,
 * and enforces strict institutional naming conventions.
 */

const KEYBOARD_PATTERNS = [
  'qwertyuiop',
  'asdfghjkl',
  'zxcvbnm',
  '1234567890',
  'poiuytrewq',
  'lkjhgfdsa',
  'mnbvcxz'
];

const DUMMY_WORDS = new Set([
  'test', 'testing', 'fake', 'dummy', 'sample', 'random', 'asdf', 'qwerty',
  'zxcv', 'foo', 'bar', 'temp', 'abcd', 'xyz', 'demo', 'placeholder', 'nobody'
]);

export function isKeyboardWalk(str) {
  if (!str) return false;
  const clean = str.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (clean.length < 3) return false;

  // Check 3+ repetitive characters (e.g. "aaaa", "1111")
  if (/^([a-z0-9])\1{2,}$/.test(clean)) return true;

  // Check for 3+ consecutive characters matching any keyboard row
  for (const seq of KEYBOARD_PATTERNS) {
    for (let i = 0; i <= clean.length - 3; i++) {
      const sub = clean.slice(i, i + 3);
      if (seq.includes(sub)) {
        if (clean.length <= 8 || sub.length >= clean.length * 0.5) {
          return true;
        }
      }
    }
  }
  return false;
}

export function isGibberish(str) {
  if (!str) return true;
  const clean = str.trim().toLowerCase();
  if (DUMMY_WORDS.has(clean)) return true;
  if (isKeyboardWalk(clean)) return true;

  const words = clean.split(/[\s,.-]+/).filter(Boolean);
  for (const w of words) {
    const letters = w.replace(/[^a-z]/g, '');
    if (letters.length >= 3 && !/[aeiouy]/.test(letters)) {
      return true;
    }
    if (DUMMY_WORDS.has(letters)) return true;
    if (letters.length >= 5) {
      const unique = new Set(letters).size;
      if (unique <= 2) return true;
    }
  }
  return false;
}

export function validateCollegeForm(values) {
  const errors = {};

  // 1. College Full Name
  const name = (values.name || '').trim();
  if (!name) {
    errors.name = 'College Full Name is required.';
  } else if (name.length < 5) {
    errors.name = 'College full name must be at least 5 characters long.';
  } else if (name.length > 150) {
    errors.name = 'College name cannot exceed 150 characters.';
  } else if (!/^[a-zA-Z0-9\s&.,'()/-]+$/.test(name)) {
    errors.name = 'College name contains invalid characters.';
  } else if (isGibberish(name)) {
    errors.name = 'Please enter a valid institution name (avoid random characters or keyboard mash).';
  }

  // 2. Short Code
  const code = (values.code || '').trim().toUpperCase();
  if (!code) {
    errors.code = 'Short Code is required.';
  } else if (code.length < 3 || code.length > 10) {
    errors.code = 'Short code must be between 3 and 10 characters (e.g., VPPCOE).';
  } else if (!/^[A-Z0-9-]+$/.test(code)) {
    errors.code = 'Short code must contain only uppercase letters, numbers, and hyphens.';
  } else if (isKeyboardWalk(code)) {
    errors.code = 'Please enter a valid college code (avoid keyboard sequences like ASD or QWE).';
  } else if (/^([A-Z0-9])\1{2,}$/.test(code)) {
    errors.code = 'Short code cannot consist of repetitive identical characters.';
  }

  // 3. City & Location
  const location = (values.location || '').trim();
  if (!location) {
    errors.location = 'City & Location is required.';
  } else if (location.length < 3) {
    errors.location = 'City/location must be at least 3 characters long.';
  } else if (location.length > 80) {
    errors.location = 'Location cannot exceed 80 characters.';
  } else if (!/^[a-zA-Z0-9\s,.-]+$/.test(location)) {
    errors.location = 'Location contains invalid characters.';
  } else if (isGibberish(location)) {
    errors.location = 'Please enter a valid city or location (e.g., Mumbai, Sion).';
  }

  // 4. Email Domain (mandatory)
  const domain = (values.domain || '').trim().toLowerCase();
  const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z]{2,})+$/;
  if (!domain) {
    errors.domain = 'Email Domain is required (e.g., pvppcoe.ac.in).';
  } else if (!domainRegex.test(domain)) {
    errors.domain = 'Please enter a valid domain format (e.g., pvppcoe.ac.in).';
  } else if (domain === 'institution.edu' || domain === 'example.com' || domain === 'test.com') {
    errors.domain = 'Please enter the real institutional domain, not placeholder text.';
  } else if (isKeyboardWalk(domain.split('.')[0])) {
    errors.domain = 'Please enter a valid domain name (avoid keyboard sequences).';
  }

  // 5. College Administrator Name
  const adminName = (values.adminName || '').trim();
  const adminWords = adminName.split(/\s+/).filter(Boolean);
  if (!adminName) {
    errors.adminName = 'College Administrator Name is required.';
  } else if (adminName.length < 3) {
    errors.adminName = 'Administrator name must be at least 3 characters long.';
  } else if (adminWords.length < 2 && adminName.length < 4) {
    errors.adminName = 'Please enter administrator full name (e.g., Dr. Verma or Vedant Angre).';
  } else if (adminName.length > 60) {
    errors.adminName = 'Administrator name cannot exceed 60 characters.';
  } else if (!/^[a-zA-Z\s.'-]+$/.test(adminName)) {
    errors.adminName = 'Administrator name can only contain letters, spaces, dots, and hyphens.';
  } else if (isGibberish(adminName)) {
    errors.adminName = 'Please enter a valid administrator name (avoid random characters).';
  }

  // 6. Admin Email
  const adminEmail = (values.adminEmail || '').trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!adminEmail) {
    errors.adminEmail = 'Admin Email is required.';
  } else if (!emailRegex.test(adminEmail)) {
    errors.adminEmail = 'Please enter a valid email address (e.g., admin@pvppcoe.ac.in).';
  } else if (adminEmail === 'admin@institution.edu' || adminEmail.includes('@example.') || adminEmail.includes('@test.')) {
    errors.adminEmail = 'Please provide an active institutional email, not a placeholder.';
  } else {
    const [localPart, emailDomain] = adminEmail.split('@');
    if (isGibberish(localPart)) {
      errors.adminEmail = 'Email username appears invalid or random. Please enter a valid email.';
    } else if (domain && emailDomain !== domain) {
      errors.adminEmail = `Admin email domain (@${emailDomain}) must match the Email Domain (@${domain}).`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
