/**
 * Google Apps Script: Create C2C Student Enrollment Form & Linked Spreadsheet
 * File: create_c2c_enrollment_form.gs
 *
 * Description:
 * Automatically builds the "C2C Training Program 2029 — Student Enrollment Form"
 * in Google Forms with required field validations and links it to a new Google Sheet.
 *
 * Instructions:
 * 1. Open https://script.google.com in your browser.
 * 2. Click "New project".
 * 3. Replace all default code in Code.gs with the contents of this file.
 * 4. Rename the project to "C2C Enrollment Form Generator".
 * 5. Click "Run" at the top toolbar to execute the `createC2CEnrollmentForm` function.
 * 6. Grant the required Google permissions when prompted.
 * 7. View the execution log (Ctrl+Enter or View > Execution log) for the form and spreadsheet URLs.
 */

function createC2CEnrollmentForm() {
  // Form Configuration
  var formTitle = "C2C Training Program 2029 — Student Enrollment Form";
  var formDescription = "Complete this form to register for the C2C Training Program 2029. Please provide accurate details. Submitting the form does not confirm payment or final enrollment.";

  // 1. Create Google Form
  var form = FormApp.create(formTitle);
  form.setDescription(formDescription);
  form.setAllowResponseEdits(false);

  // 2. Create linked Google Spreadsheet for responses
  var sheetTitle = "C2C Training Program 2029 — Student Responses";
  var ss = SpreadsheetApp.create(sheetTitle);
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  // --- QUESTION SETUP (IN EXACT SPECIFIED ORDER) ---

  // 1. Full Name — required short answer
  var q1 = form.addTextItem();
  q1.setTitle("Full Name");
  q1.setRequired(true);

  // 2. Email Address — required short answer with email validation
  var q2 = form.addTextItem();
  q2.setTitle("Email Address");
  q2.setRequired(true);
  var emailValidation = FormApp.createTextValidation()
    .requireTextIsEmail()
    .setHelpText("Please enter a valid email address (e.g. student@example.com).")
    .build();
  q2.setValidation(emailValidation);

  // 3. Mobile Number — required short answer
  var q3 = form.addTextItem();
  q3.setTitle("Mobile Number");
  q3.setRequired(true);

  // 4. Roll Number / PRN — required short answer
  var q4 = form.addTextItem();
  q4.setTitle("Roll Number / PRN");
  q4.setRequired(true);

  // 5. College — required short answer
  var q5 = form.addTextItem();
  q5.setTitle("College");
  q5.setRequired(true);

  // 6. Branch — required dropdown with editable branch list
  var q6 = form.addListItem();
  q6.setTitle("Branch");
  q6.setChoiceValues([
    "Computer Science",
    "Electronics and Computer Science",
    "Artificial Intelligence & Machine Learning",
    "Information Technology",
    "Mechatronics",
    "Other"
  ]);
  q6.setRequired(true);

  // 7. Year — required dropdown with specified options
  var q7 = form.addListItem();
  q7.setTitle("Year");
  q7.setChoiceValues([
    "First Year",
    "Second Year",
    "Third Year",
    "Fourth Year"
  ]);
  q7.setRequired(true);

  // 8. Amount Paid — required short answer with numeric validation
  var q8 = form.addTextItem();
  q8.setTitle("Amount Paid");
  q8.setRequired(true);
  var numericValidation = FormApp.createTextValidation()
    .requireNumberGreaterThanOrEqualTo(0)
    .setHelpText("Please enter a valid numeric amount (e.g. 3500).")
    .build();
  q8.setValidation(numericValidation);

  // 9. UTR / Transaction ID — optional short answer
  var q9 = form.addTextItem();
  q9.setTitle("UTR / Transaction ID");
  q9.setRequired(false);

  // 10. Payment Proof — optional short text answer (file-upload excluded per requirement)
  var q10 = form.addTextItem();
  q10.setTitle("Payment Proof");
  q10.setHelpText("Enter link/URL to payment screenshot or transaction receipt if available.");
  q10.setRequired(false);

  // Output Links to Execution Log
  Logger.log("=================================================");
  Logger.log("C2C ENROLLMENT FORM GENERATED SUCCESSFULLY");
  Logger.log("=================================================");
  Logger.log("Form Title: " + form.getTitle());
  Logger.log("Public Respondent URL: " + form.getPublishedUrl());
  Logger.log("Form Edit URL: " + form.getEditUrl());
  Logger.log("Linked Spreadsheet Title: " + ss.getName());
  Logger.log("Linked Spreadsheet URL: " + ss.getUrl());
  Logger.log("Linked Spreadsheet ID: " + ss.getId());
  Logger.log("=================================================");
}
