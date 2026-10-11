/**
 * Google Apps Script: Response Sheet Webhook Trigger
 * File: c2c_google_sheet_webhook_trigger.gs
 *
 * Description:
 * This script runs automatically whenever a new response is submitted to the
 * Google Sheet linked to "C2C Training Program 2029 — Student Enrollment Form".
 * It formats the form fields and sends a secure HTTP POST request to the TrainX Webhook.
 *
 * Instructions:
 * 1. Open your linked Google Sheet (created by create_c2c_enrollment_form.gs).
 * 2. Go to Extensions > Apps Script in the menu bar.
 * 3. Paste the code below into Code.gs (replacing everything).
 * 4. Update the `WEBHOOK_URL` variable below with your public server URL or ngrok link:
 *    Example: "https://your-domain.com/api/v1/c2c/google-form/webhook"
 *    Or ngrok: "https://xxxx-xx-xx.ngrok-free.app/api/v1/c2c/google-form/webhook"
 * 5. Click the Triggers icon (Alarm Clock icon on the left sidebar).
 * 6. Click "+ Add Trigger" (bottom right):
 *    - Choose function to run: onFormSubmit
 *    - Choose which deployment should run: Head
 *    - Select event source: From spreadsheet
 *    - Select event type: On form submit
 * 7. Click Save and authorize permissions when prompted.
 */

// =========================================================================
// CONFIGURATION
// =========================================================================
var WEBHOOK_URL = "https://YOUR_BACKEND_DOMAIN_OR_NGROK_URL/api/v1/c2c/google-form/webhook";
var WEBHOOK_SECRET = "TrainX_C2C_Webhook_Secret_Key_2026";

/**
 * Trigger function called automatically on every Google Form submission.
 * @param {Object} e - The event object automatically passed by Google Sheets.
 */
function onFormSubmit(e) {
  try {
    if (!e || !e.namedValues) {
      Logger.log("[WARN] Event object 'e' or 'e.namedValues' is missing. Running manual fallback test?");
      return;
    }

    var nv = e.namedValues;

    // Helper to safely fetch first value from namedValues array
    function val(fieldName) {
      if (nv[fieldName] && nv[fieldName].length > 0) {
        return String(nv[fieldName][0]).trim();
      }
      // Case-insensitive fallback lookup
      for (var key in nv) {
        if (key.toLowerCase().trim() === String(fieldName).toLowerCase().trim()) {
          return String(nv[key][0]).trim();
        }
      }
      return "";
    }

    var payload = {
      source_response_id: e.response ? e.response.getId() : "sheet_row_" + (e.range ? e.range.getRow() : new Date().getTime()),
      full_name: val("Full Name"),
      email: val("Email Address"),
      mobile: val("Mobile Number"),
      roll_number: val("Roll Number / PRN"),
      college: val("College"),
      branch: val("Branch"),
      year: val("Year"),
      amount_paid: val("Amount Paid") || "3500",
      utr_number: val("UTR / Transaction ID"),
      payment_proof_url: val("Payment Proof"),
      form_response_timestamp: val("Timestamp") || new Date().toISOString()
    };

    Logger.log("[C2C Webhook] Sending payload: " + JSON.stringify(payload));

    var options = {
      method: "post",
      contentType: "application/json",
      headers: {
        "x-c2c-webhook-secret": WEBHOOK_SECRET,
        "x-c2c-secret": WEBHOOK_SECRET
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    var responseCode = response.getResponseCode();
    var responseBody = response.getContentText();

    Logger.log("[C2C Webhook Result] Status Code: " + responseCode);
    Logger.log("[C2C Webhook Result] Response Body: " + responseBody);

    if (responseCode >= 200 && responseCode < 300) {
      Logger.log("[SUCCESS] C2C Enrollment synced to TrainX Portal successfully!");
    } else {
      Logger.log("[ERROR] Webhook call failed with status " + responseCode + ": " + responseBody);
    }
  } catch (error) {
    Logger.log("[CRITICAL ERROR] Failed in onFormSubmit: " + error.toString());
  }
}

/**
 * Manual test function: Run this inside script.google.com to test your backend webhook directly!
 */
function testSendWebhookPayload() {
  var mockEvent = {
    namedValues: {
      "Timestamp": [new Date().toLocaleString()],
      "Full Name": ["Test Student"],
      "Email Address": ["test.student.c2c@example.com"],
      "Mobile Number": ["9876543210"],
      "Roll Number / PRN": ["2029CS001"],
      "College": ["PVPPCOE"],
      "Branch": ["Computer Science"],
      "Year": ["Third Year"],
      "Amount Paid": ["3500"],
      "UTR / Transaction ID": ["UTR998877665544"],
      "Payment Proof": ["https://drive.google.com/file/d/sample-proof/view"]
    }
  };
  Logger.log("--- STARTING MANUAL WEBHOOK TEST ---");
  onFormSubmit(mockEvent);
  Logger.log("--- END OF MANUAL WEBHOOK TEST ---");
}
