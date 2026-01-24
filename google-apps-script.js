/**
 * Google Apps Script for Wedding RSVP with Guest Personalization
 *
 * Instructions:
 * 1. Open Google Sheets > Extensions > Apps Script
 * 2. Replace existing code with this script
 * 3. Create a new sheet called "Guests" with columns:
 *    guest_id | name | full_name | invitation_type | partner_name | partner_full_name | group | custom_message | show_accommodation | show_alcohol | rsvp_status
 * 4. Deploy > New deployment > Web app
 * 5. Update GOOGLE_SCRIPT_URL in index.html with new deployment URL
 */

// Sheet names
const RESPONSES_SHEET = "Responses";
const GUESTS_SHEET = "Guests";

/**
 * Handle GET requests - fetch guest data by ID
 */
function doGet(e) {
  const guestId = e.parameter.guest;

  if (!guestId) {
    return createJsonResponse({ success: false, error: "No guest ID provided" });
  }

  const guest = getGuestById(guestId);

  if (!guest) {
    return createJsonResponse({ success: false, error: "Guest not found" });
  }

  return createJsonResponse({ success: true, guest: guest });
}

// Drink options for individual columns
const DRINK_OPTIONS = [
  "no_alcohol",
  "wine_white_dry",
  "wine_white_sweet",
  "wine_red_sweet",
  "wine_red_dry",
  "champagne_brut",
  "champagne_sweet",
  "cocktails_aperol",
  "cognac",
  "whiskey",
  "vodka",
  "cocktails_cola"
];


/**
 * Handle POST requests - save RSVP response
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(RESPONSES_SHEET);

    // Headers for the response sheet
    const headers = [
      "Timestamp",
      "Guest ID",
      "Name",
      "Attendance",
      "Dietary",
      "Accommodation",
      ...DRINK_OPTIONS
    ];

    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(RESPONSES_SHEET);
      sheet.appendRow(headers);
    }

    // Build drink columns (true/false for each)
    const drinkValues = DRINK_OPTIONS.map(drink =>
      data.drinks && data.drinks[drink] ? "TRUE" : ""
    );

    const timestamp = new Date().toISOString();

    // Build main guest row data
    const rowData = [
      timestamp,
      data.guest_id || "",
      data.name,
      data.attendance,
      data.dietary,
      data.accommodation || "",
      ...drinkValues
    ];

    // Check if guest already has a response
    const existingRow = data.guest_id ? findResponseRow(sheet, data.guest_id) : null;

    if (existingRow) {
      // Update existing row
      sheet.getRange(existingRow, 1, 1, rowData.length).setValues([rowData]);
    } else {
      // Append new response
      sheet.appendRow(rowData);
    }

    // Handle partner data (separate row)
    if (data.partner_name && data.attendance === "Приду с партнёром") {
      const partnerGuestId = data.guest_id ? data.guest_id + "_partner" : "";

      const partnerDrinkValues = DRINK_OPTIONS.map(drink =>
        data.partner_drinks && data.partner_drinks[drink] ? "TRUE" : ""
      );

      const partnerRowData = [
        timestamp,
        partnerGuestId,
        data.partner_name,
        "Приду (партнёр)",
        data.partner_dietary || "—",
        data.accommodation || "",
        ...partnerDrinkValues
      ];

      const existingPartnerRow = partnerGuestId ? findResponseRow(sheet, partnerGuestId) : null;

      if (existingPartnerRow) {
        sheet.getRange(existingPartnerRow, 1, 1, partnerRowData.length).setValues([partnerRowData]);
      } else {
        sheet.appendRow(partnerRowData);
      }
    }

    // Update guest RSVP status if guest_id provided
    if (data.guest_id) {
      updateGuestRsvpStatus(data.guest_id, "responded");
    }

    return createJsonResponse({ success: true });
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

/**
 * Find existing response row by guest_id
 * Returns row number (1-indexed) or null if not found
 */
function findResponseRow(sheet, guestId) {
  const data = sheet.getDataRange().getValues();
  const guestIdCol = data[0].indexOf("Guest ID");

  if (guestIdCol === -1) return null;

  for (let i = 1; i < data.length; i++) {
    if (data[i][guestIdCol] === guestId) {
      return i + 1; // 1-indexed row number
    }
  }

  return null;
}

/**
 * Get guest data by ID from Guests sheet
 */
function getGuestById(guestId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(GUESTS_SHEET);

  if (!sheet) {
    return null;
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  // Find column indices
  const cols = {
    guest_id: headers.indexOf("guest_id"),
    name: headers.indexOf("name"),
    full_name: headers.indexOf("full_name"),
    invitation_type: headers.indexOf("invitation_type"),
    partner_name: headers.indexOf("partner_name"),
    partner_full_name: headers.indexOf("partner_full_name"),
    group: headers.indexOf("group"),
    custom_message: headers.indexOf("custom_message"),
    show_accommodation: headers.indexOf("show_accommodation"),
    show_alcohol: headers.indexOf("show_alcohol"),
    rsvp_status: headers.indexOf("rsvp_status")
  };

  // Search for guest
  for (let i = 1; i < data.length; i++) {
    if (data[i][cols.guest_id] === guestId) {
      return {
        guest_id: data[i][cols.guest_id] || "",
        name: data[i][cols.name] || "",
        full_name: data[i][cols.full_name] || "",
        invitation_type: data[i][cols.invitation_type] || "single",
        partner_name: data[i][cols.partner_name] || "",
        partner_full_name: data[i][cols.partner_full_name] || "",
        group: data[i][cols.group] || "friends",
        custom_message: data[i][cols.custom_message] || "",
        show_accommodation: data[i][cols.show_accommodation] !== false,
        show_alcohol: data[i][cols.show_alcohol] !== false,
        rsvp_status: data[i][cols.rsvp_status] || "pending"
      };
    }
  }

  return null;
}

/**
 * Update guest RSVP status
 */
function updateGuestRsvpStatus(guestId, status) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(GUESTS_SHEET);

  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const guestIdCol = headers.indexOf("guest_id");
  const statusCol = headers.indexOf("rsvp_status");

  if (guestIdCol === -1 || statusCol === -1) return;

  for (let i = 1; i < data.length; i++) {
    if (data[i][guestIdCol] === guestId) {
      sheet.getRange(i + 1, statusCol + 1).setValue(status);
      break;
    }
  }
}

/**
 * Create JSON response with CORS headers
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Test function - run this to verify script works
 */
function testGetGuest() {
  const mockEvent = { parameter: { guest: "test-guest" } };
  const result = doGet(mockEvent);
  Logger.log(result.getContent());
}
