/**
 * Google Apps Script: Multi-Training Response Sheet Webhook Trigger
 * File: training_google_sheet_webhook_trigger.gs
 *
 * Description:
 * This script runs automatically whenever a new response is submitted to any Google Sheet
 * linked to a TrainX Training Program's Google Form.
 * It associates the response with the training using a stable TRAINING_CODE or TRAINING_ID
 * and sends a secure HTTP POST request to the TrainX Multi-Training Webhook.
 *
 * Key Features:
 * 1. Automatic 'On form submit' trigger workflow for real-time enrollment.
 * 2. One-time 'syncAllExistingResponses' function to batch-import past submissions.
 * 3. Stable training identification using unique training_code or training_id.
 * 4. Deduplication via source_response_id.
 * 5. Secure webhook authentication via headers and Script Properties.
 *
 * Setup Instructions:
 * 1. Open your Google Sheet for the specific training program.
 * 2. In Google Sheets, click Extensions > Apps Script.
 * 3. Paste the contents of this file into the Code.gs editor.
 * 4. Configure Script Properties (File > Project Settings > Script Properties) OR update the constants below:
 *    - TRAINING_CODE: The unique training code (e.g., 'C2C 2026', 'AWS-CLOUD-2026', 'FULLSTACK-2026')
 *    - TRAINING_ID: (Optional alternative to code) The numerical ID in TrainX (e.g. 4)
 *    - WEBHOOK_URL: "https://<YOUR-API-DOMAIN>/api/v1/trainings/google-form/webhook"
 *    - WEBHOOK_SECRET: "TrainX_C2C_Webhook_Secret_Key_2026" (or your custom secret)
 * 5. Add an automatic Trigger:
 *    - Click the clock icon on the left (Triggers).
 *    - Click "+ Add Trigger" (bottom right).
 *    - Choose function to run: onFormSubmit
 *    - Choose event source: From spreadsheet
 *    - Choose event type: On form submit
 *    - Click Save and grant necessary Google permissions.
 * 6. (Optional) If the Sheet already has responses, run the 'syncAllExistingResponses' function once!
 */

// =========================================================================
// CONFIGURATION (Can also be set in Project Settings > Script Properties)
// =========================================================================
var DEFAULT_CONFIG = {
  TRAINING_CODE: "C2C 2026", // <-- REPLACE with your specific training code!
  TRAINING_ID: "",           // <-- Optional: Numerical ID if known
  WEBHOOK_URL: "https://YOUR_BACKEND_DOMAIN_OR_NGROK_URL/api/v1/trainings/google-form/webhook",
  WEBHOOK_SECRET: "TrainX_C2C_Webhook_Secret_Key_2026"
};

/**
 * Helper to fetch config from Script Properties, falling back to DEFAULT_CONFIG.
 */
function getConfig() {
  var props = PropertiesService.getScriptProperties().getProperties();
  return {
    TRAINING_CODE: props.TRAINING_CODE || DEFAULT_CONFIG.TRAINING_CODE,
    TRAINING_ID: props.TRAINING_ID || DEFAULT_CONFIG.TRAINING_ID,
    WEBHOOK_URL: props.WEBHOOK_URL || DEFAULT_CONFIG.WEBHOOK_URL,
    WEBHOOK_SECRET: props.WEBHOOK_SECRET || DEFAULT_CONFIG.WEBHOOK_SECRET
  };
}

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

    var config = getConfig();
    var nv = e.namedValues;

    // Helper to safely fetch first value from namedValues array
    function val(fieldName) {
      if (nv[fieldName] && nv[fieldName].length > 0) {
        return String(nv[fieldName][0]).trim();
      }
      for (var key in nv) {
        if (key.toLowerCase().trim() === String(fieldName).toLowerCase().trim()) {
          return String(nv[key][0]).trim();
        }
      }
      return "";
    }

    var sourceId = e.response
      ? e.response.getId()
      : "sheet_row_" + (e.range ? e.range.getRow() : new Date().getTime());

    var payload = {
      training_code: config.TRAINING_CODE,
      training_id: config.TRAINING_ID,
      source_response_id: sourceId,
      full_name: val("Full Name") || val("Name") || val("Student Name"),
      email: val("Email Address") || val("Email"),
      mobile: val("Mobile Number") || val("Phone Number") || val("Mobile") || val("Contact Number"),
      roll_number: val("Roll Number / PRN") || val("Roll Number") || val("PRN") || val("Student ID"),
      college: val("College") || val("College Name"),
      branch: val("Branch") || val("Department"),
      year: val("Year") || val("Current Year"),
      division: val("Division") || val("Div"),
      batch: val("Batch"),
      amount_paid: val("Amount Paid") || val("Paid Amount"),
      utr_number: val("UTR / Transaction ID") || val("UTR Number") || val("Transaction ID") || val("UTR"),
      payment_proof_url: val("Payment Proof") || val("Upload Payment Proof") || val("Screenshot"),
      form_response_timestamp: val("Timestamp") || new Date().toISOString()
    };

    Logger.log("[Training Webhook] Dispatching payload for training '" + (config.TRAINING_CODE || config.TRAINING_ID) + "'");
    Logger.log("[Payload]: " + JSON.stringify(payload));

    var options = {
      method: "post",
      contentType: "application/json",
      headers: {
        "x-c2c-webhook-secret": config.WEBHOOK_SECRET,
        "x-c2c-secret": config.WEBHOOK_SECRET,
        "x-training-webhook-secret": config.WEBHOOK_SECRET
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch(config.WEBHOOK_URL, options);
    var responseCode = response.getResponseCode();
    var responseBody = response.getContentText();

    Logger.log("[Webhook Status]: " + responseCode);
    Logger.log("[Webhook Body]: " + responseBody);

    if (responseCode >= 200 && responseCode < 300) {
      Logger.log("[SUCCESS] Registration synced to TrainX for '" + (config.TRAINING_CODE || config.TRAINING_ID) + "'!");
    } else {
      Logger.log("[ERROR] Sync failed: " + responseCode + " - " + responseBody);
    }
  } catch (error) {
    Logger.log("[CRITICAL ERROR] Failed in onFormSubmit: " + error.toString());
  }
}

/**
 * One-time Batch Sync Function:
 * Reads all rows currently in the sheet and submits them to TrainX one by one.
 * Uses source_response_id to guarantee idempotency and prevent duplicates.
 */
function syncAllExistingResponses() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) {
    Logger.log("No responses found to sync.");
    return;
  }

  var headers = data[0].map(function(h) { return String(h).trim(); });
  var config = getConfig();

  Logger.log("Syncing " + (data.length - 1) + " responses for training '" + (config.TRAINING_CODE || config.TRAINING_ID) + "'...");

  function getColVal(row, name) {
    for (var i = 0; i < headers.length; i++) {
      if (headers[i].toLowerCase() === name.toLowerCase()) {
        return String(row[i]).trim();
      }
    }
    return "";
  }

  var successCount = 0;
  var skipCount = 0;

  for (var r = 1; r < data.length; r++) {
    var row = data[r];
    var email = getColVal(row, "Email Address") || getColVal(row, "Email");
    var name = getColVal(row, "Full Name") || getColVal(row, "Name") || getColVal(row, "Student Name");

    if (!email && !name) {
      skipCount++;
      continue;
    }

    var payload = {
      training_code: config.TRAINING_CODE,
      training_id: config.TRAINING_ID,
      source_response_id: "sheet_row_" + (r + 1),
      full_name: name,
      email: email,
      mobile: getColVal(row, "Mobile Number") || getColVal(row, "Phone Number") || getColVal(row, "Mobile"),
      roll_number: getColVal(row, "Roll Number / PRN") || getColVal(row, "Roll Number") || getColVal(row, "PRN"),
      college: getColVal(row, "College") || getColVal(row, "College Name"),
      branch: getColVal(row, "Branch") || getColVal(row, "Department"),
      year: getColVal(row, "Year"),
      division: getColVal(row, "Division") || getColVal(row, "Div"),
      batch: getColVal(row, "Batch"),
      amount_paid: getColVal(row, "Amount Paid"),
      utr_number: getColVal(row, "UTR / Transaction ID") || getColVal(row, "UTR Number") || getColVal(row, "Transaction ID"),
      payment_proof_url: getColVal(row, "Payment Proof") || getColVal(row, "Upload Payment Proof"),
      form_response_timestamp: getColVal(row, "Timestamp") || new Date().toISOString()
    };

    var options = {
      method: "post",
      contentType: "application/json",
      headers: {
        "x-c2c-webhook-secret": config.WEBHOOK_SECRET,
        "x-c2c-secret": config.WEBHOOK_SECRET,
        "x-training-webhook-secret": config.WEBHOOK_SECRET
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    try {
      var response = UrlFetchApp.fetch(config.WEBHOOK_URL, options);
      if (response.getResponseCode() >= 200 && response.getResponseCode() < 300) {
        successCount++;
      } else {
        Logger.log("Row " + (r + 1) + " error: " + response.getContentText());
      }
    } catch (err) {
      Logger.log("Row " + (r + 1) + " fetch exception: " + err.toString());
    }

    // Small delay to prevent rate limiting
    Utilities.sleep(200);
  }

  Logger.log("Sync Complete. Successfully processed: " + successCount + ", Skipped: " + skipCount);
}
