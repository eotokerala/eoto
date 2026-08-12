/**
 * Google Apps Script for Each One Teach One (EOTO) Backend API
 * 
 * Account: eoto.kerala@gmail.com
 * Sheet ID: 1xzZLvBHTfH9vyw88hZzedW7m_IDCHGTayGu3JAd2EDM
 * 
 * 100% Read-Only API for EOTO Public Website
 * 
 * Fix: Uses getDisplayValues() to prevent Google Sheets from converting Case Numbers into Date objects.
 */

const SPREADSHEET_ID = "1xzZLvBHTfH9vyw88hZzedW7m_IDCHGTayGu3JAd2EDM";

function doGet(e) {
  try {
    const ss = SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
    const sheets = ss.getSheets();
    const allCases = [];
    
    sheets.forEach(sheet => {
      const sheetName = sheet.getName().trim();
      
      // Use getDisplayValues() so text like "1/2024" remains a string and doesn't become a JS Date object
      const displayData = sheet.getDataRange().getDisplayValues();
      const rawData = sheet.getDataRange().getValues();
      if (displayData.length <= 1) return;
      
      const headers = displayData[0].map(h => String(h).trim().toLowerCase());
      
      const colIndex = {
        caseNo: findCol(headers, ["case no", "case id", "id"]),
        date: findCol(headers, ["appli. date", "date added", "date"]),
        education: findCol(headers, ["education dtls", "course", "education"]),
        institution: findCol(headers, ["address of institution", "institution", "college"]),
        address: findCol(headers, ["address", "district", "location"]),
        approvedAmount: findCol(headers, ["approved amount"]),
        sponsorName: findCol(headers, ["sponsor's name", "sponsor name", "sponsor"]),
        recStatus: findCol(headers, ["recommended/rejected", "recommendation"]),
        mediaPost: findCol(headers, ["mediapost", "post"]),
        reason: findCol(headers, ["reason for rejection/recommendation", "description", "remarks"])
      };
      
      for (let i = 1; i < displayData.length; i++) {
        const row = displayData[i];
        const rawRow = rawData[i];
        
        let caseNoRaw = getVal(row, colIndex.caseNo) || getVal(rawRow, colIndex.caseNo);
        const caseNo = cleanCaseNo(caseNoRaw, sheetName);
        if (!caseNo) continue;
        
        const recVal = String(getVal(row, colIndex.recStatus)).trim().toLowerCase();
        
        // Rule: Must be Recommended or Waiting for Sponsor
        const isRecommended = recVal.includes("recommended") || recVal.includes("waiting for sponsor");
        if (!isRecommended) {
          continue; // Skip rejected or unapproved cases
        }
        
        // Status Logic: Combination of Recommended/Rejected & Sponsor's Name
        const sponsorName = String(getVal(row, colIndex.sponsorName)).trim();
        let calculatedStatus = "Open";
        if (sponsorName !== "" && !recVal.includes("waiting for sponsor")) {
          calculatedStatus = "Sponsored";
        } else {
          calculatedStatus = "Open";
        }

        // Amount Rule: Strictly use "Approved amount"
        const approvedAmt = String(getVal(row, colIndex.approvedAmount)).trim() || "Approved Assistance";

        // Description Rule: Use "MediaPost" as case story summary
        const mediaPost = String(getVal(row, colIndex.mediaPost)).trim();
        const reason = String(getVal(row, colIndex.reason)).trim();
        const displayDescription = mediaPost || reason || "Verified EOTO Educational Case";

        // District extraction without exposing street/home address PII
        const fullAddress = String(getVal(row, colIndex.address));
        const district = extractDistrict(fullAddress);

        // Strict PII Protection (no student name, no phone, no home address, no bank info)
        allCases.push({
          id: caseNo,
          year: sheetName,
          dateAdded: formatDate(getVal(row, colIndex.date)),
          course: String(getVal(row, colIndex.education) || "Higher Education"),
          institution: String(getVal(row, colIndex.institution) || "Educational Institution"),
          district: district,
          amount: approvedAmt,
          status: calculatedStatus,
          description: displayDescription
        });
      }
    });
    
    return jsonResponse({
      success: true,
      count: allCases.length,
      updatedAt: new Date().toISOString(),
      cases: allCases
    });
    
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

/**
 * Clean & Format Case Numbers (Fixes auto-formatted dates from Google Sheets)
 */
function cleanCaseNo(val, sheetName) {
  if (!val) return "";
  
  const str = String(val).trim();
  
  // If string contains full date representation e.g. "Thu Feb 29 2024 10:30:00 GMT-0800"
  if (str.includes("GMT") || str.includes("Standard Time") || str.includes("Pacific")) {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      const day = d.getDate();
      const yr = sheetName || d.getFullYear();
      return `${day}/${yr}`;
    }
  }
  
  return str;
}

// Helpers
function findCol(headers, possibleNames) {
  for (let name of possibleNames) {
    const idx = headers.findIndex(h => h.includes(name));
    if (idx !== -1) return idx;
  }
  return -1;
}

function getVal(row, colIdx) {
  if (colIdx === -1 || colIdx >= row.length) return "";
  return row[colIdx];
}

function extractDistrict(address) {
  const districts = [
    "Thiruvananthapuram", "Trivandrum", "Kollam", "Pathanamthitta", "Alappuzha", "Alleppey",
    "Kottayam", "Idukki", "Ernakulam", "Cochin", "Thrissur", "Palakkad",
    "Malappuram", "Kozhikode", "Calicut", "Wayanad", "Kannur", "Kasaragod"
  ];
  for (let d of districts) {
    if (new RegExp(d, "i").test(address)) {
      return d === "Trivandrum" ? "Thiruvananthapuram" : (d === "Alleppey" ? "Alappuzha" : (d === "Cochin" ? "Ernakulam" : (d === "Calicut" ? "Kozhikode" : d)));
    }
  }
  return "Kerala";
}

function formatDate(val) {
  if (!val) return new Date().toISOString().split("T")[0];
  if (val instanceof Date) return val.toISOString().split("T")[0];
  return String(val);
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
