// utils/reportGenerator.js

// Helper to get color for percentage
const getBarColor = (pct) => {
  // pct is 0..100
  if (pct >= 85) return "#28a745"; // green
  if (pct >= 60) return "#ffc107"; // amber
  return "#dc3545"; // red
};
// ADD THIS LINE
const vnitLogoUrl = "images/vnitlogo.webp";
const generateAttendanceReport = (records) => {
  let totalDays = 0;
  let presentDays = 0;
  let absentDays = 0;
  let lateDays = 0;
  let leaveDays = 0;

  // Accept null/undefined safely
  const validRecords = (records || []).filter(
    (record) => record !== null && record !== undefined
  );

  validRecords.forEach((record) => {
    totalDays++;
    switch ((record.status || "").toString()) {
      case "Present":
        presentDays++;
        break;
      case "Absent":
        absentDays++;
        break;
      case "Late":
        lateDays++;
        break;
      case "Leave":
        leaveDays++;
        break;
      default:
        // unknown statuses treated as absent? keep as is (ignored)
        break;
    }
  });

  const attendancePercentage =
    totalDays > 0 ? ((presentDays + lateDays) / totalDays) * 100 : 0;

  return {
    totalDays,
    presentDays,
    absentDays,
    lateDays,
    leaveDays,
    attendancePercentage: Math.round(attendancePercentage * 100) / 100,
  };
};

// Generate HTML formatted report for PDF conversion
const generateHTMLReport = (
  reportData,
  reportType,
  startDate,
  endDate,
  classInfoFromParam
) => {
  const date = new Date().toLocaleDateString();

  // Use classInfo passed explicitly or embedded in reportData
  const classInfo = classInfoFromParam || reportData.classInfo || {};
  const className = classInfo.className || "Class";
  const classCode = classInfo.classCode || "";
  const teacherName = classInfo.name || "";


  

  if (reportType === "Individual") {
    const student = reportData.studentDetails || {};
    const data = reportData;
    const percentage = Number(data.attendancePercentage || 0);

    const barColor = getBarColor(percentage);

    return `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Individual Attendance Report</title>
        <style>
          @page { margin: 0; }
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
            position: relative;
            min-height: 100vh;
            background-image: url('${vnitLogoUrl}');
            background-repeat: no-repeat;
            background-position: center center;
            background-size: 420px;
            opacity: 1;
            background-attachment: fixed;
            background-color: #fff;
            background-blend-mode: normal;
          }
          /* overlay to reduce logo prominence */
          .bg-overlay {
            position: absolute;
            inset: 0;
            background: rgba(255,255,255,0.88);
            pointer-events: none;
            z-index: 0;
          }
          .content { position: relative; z-index: 1; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #007bff; padding-bottom: 12px; }
          .header h1 { margin: 0; color: #007bff; font-size: 28px; }
          .header p { margin: 3px 0; }
          .meta { text-align: center; margin-top: 6px; color: #444; }
          .student-info { margin: 18px 0; background: #f8f9fa; padding: 12px; border-left: 4px solid #007bff; }
          .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; }
          .stat-box { background: #007bff; color: white; padding: 10px; text-align: center; border-radius: 4px; }
          .stat-box strong { display: block; font-size: 20px; margin: 4px 0; }
          .percentage-bar { height: 20px; background: #e9ecef; border-radius: 6px; overflow: hidden; margin-top: 10px; width: 100%; }
          .percentage-fill { height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; }
          .footer { margin-top: 24px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="bg-overlay"></div>
        <div class="content">
          <div class="header">
            <h1>Individual Attendance Report</h1>
            <p class="meta"><strong>${className}</strong> ${classCode ? "— " + classCode : ""} ${teacherName ? " | Teacher: " + teacherName : ""}</p>
            <p><strong>Generated on:</strong> ${date}</p>
            <p><strong>Period:</strong> ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}</p>
          </div>

          <div class="student-info">
            <p><strong>Student Name:</strong> ${escapeHtml(student?.name || "N/A")}</p>
            <p><strong>Roll Number:</strong> ${escapeHtml(student?.rollNumber || "N/A")}</p>
            <p><strong>Email:</strong> ${escapeHtml(student?.email || "N/A")}</p>
          </div>

          <div class="stats">
            <div class="stat-box">
              <span>Total Days</span>
              <strong>${Number(data.totalDays || 0)}</strong>
            </div>
            <div class="stat-box">
              <span>Present</span>
              <strong>${Number(data.presentDays || 0)}</strong>
            </div>
            <div class="stat-box">
              <span>Absent</span>
              <strong>${Number(data.absentDays || 0)}</strong>
            </div>
            <div class="stat-box">
              <span>Late</span>
              <strong>${Number(data.lateDays || 0)}</strong>
            </div>
          </div>

          <div>
            <strong>Attendance Percentage:</strong>
            <div class="percentage-bar">
              <div class="percentage-fill" style="width: ${percentage}%; background:${barColor}">
                ${percentage}%
              </div>
            </div>
          </div>

          <div class="footer">
            <p>This is an automated report from the Attendance Tracker System</p>
          </div>
        </div>
      </body>
      </html>`;
  } else {
    // Class Report
    const studentReports = reportData.studentReports || {};
    const totalStudents = reportData.totalStudents || 0;
    const classAverage = Number(reportData.classAverage || 0);

    // Build rows
    let studentRows = "";
    Object.entries(studentReports).forEach(([studentId, data]) => {
      const percentage = Number(data.attendancePercentage || 0);
      const barColor = getBarColor(percentage);

      studentRows += `<tr>
          <td style="vertical-align: top; padding: 12px 8px;">
            <div style="font-weight:600;">${escapeHtml(data.name || "Unknown")}</div>
            <div style="color:#666; font-size:12px;">Roll: ${escapeHtml(data.rollNumber || "N/A")}</div>
          </td>
          <td style="padding: 12px 8px; text-align:center;">${Number(data.totalDays || 0)}</td>
          <td style="padding: 12px 8px; text-align:center;">${Number(data.presentDays || 0)}</td>
          <td style="padding: 12px 8px; text-align:center;">${Number(data.absentDays || 0)}</td>
          <td style="padding: 12px 8px; text-align:left; width: 220px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <div style="flex:1;">
                <div style="height:16px; background:#e9ecef; border-radius:8px; overflow:hidden;">
                  <div style="width:${percentage}%; height:100%; background:${barColor};"></div>
                </div>
              </div>
              <div style="min-width:48px; text-align:right; font-weight:600;">${percentage}%</div>
            </div>
          </td>
        </tr>`;
    });

    return `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Class Attendance Report</title>
        <style>
          @page { margin: 0; }
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
            position: relative;
            min-height: 100vh;
            background-repeat: no-repeat;
            background-position: center center;
            background-size: 520px;
            background-attachment: fixed;
            background-color: #fff;
          }
          .bg-overlay { position:absolute; inset:0; background: rgba(255,255,255,0.88); z-index:0; pointer-events:none; }
          .content { position:relative; z-index:1; }
          .header { text-align: center; margin-bottom: 16px; border-bottom: 2px solid #007bff; padding-bottom: 12px; }
          .header h1 { margin: 0; color: #007bff; font-size: 28px; }
          .header p { margin: 4px 0; }
          .meta { color: #444; margin-top:6px; }
          table { width: 100%; border-collapse: collapse; margin-top: 18px; }
          th { background: #007bff; color: white; padding: 12px 8px; text-align: left; }
          td { padding: 10px 8px; border-bottom: 1px solid #eee; }
          tr:hover { background: #fafafa; }
          .footer { margin-top: 22px; text-align: center; font-size: 12px; color: #666; }
          .avg-bar { height: 18px; background: #e9ecef; border-radius:9px; overflow:hidden; margin-top:6px; }
        </style>
      </head>
      <body>
        <div class="bg-overlay"></div>
        <div class="content">
          <div class="header">
            <h1>Class Attendance Report – ${escapeHtml(className)}</h1>
            <p class="meta">Class Code: ${escapeHtml(classCode)} ${teacherName ? "| Teacher: " + escapeHtml(teacherNameName) : ""}</p>
            <p><strong>Generated on:</strong> ${date}</p>
            <p><strong>Period:</strong> ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}</p>
            <p><strong>Total Students:</strong> ${totalStudents}</p>

            <div style="margin-top:10px; max-width:720px; margin-left:auto; margin-right:auto; text-align:left;">
              <div style="font-weight:600;">Class Average: ${classAverage}%</div>
              <div class="avg-bar">
                <div style="width:${classAverage}%; height:100%; background:${getBarColor(classAverage)};"></div>
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width:30%;">Student</th>
                <th style="width:12%; text-align:center;">Total Days</th>
                <th style="width:12%; text-align:center;">Present</th>
                <th style="width:12%; text-align:center;">Absent</th>
                <th style="width:34%;">Attendance %</th>
              </tr>
            </thead>
            <tbody>
              ${studentRows || '<tr><td colspan="5" style="text-align:center;padding:18px;">No student data available</td></tr>'}
            </tbody>
          </table>

          <div class="footer">
            <p>This is an automated report from the Attendance Tracker System</p>
          </div>
        </div>
      </body>
      </html>`;
  }
};

// Placeholder for PDF generation - returns the HTML for later conversion
const generatePDFReport = (data) => {
  return {
    success: true,
    message: "PDF generation placeholder - use the returned HTML with a converter",
    data,
  };
};

// small helper to escape HTML (very small sanitization for insertion into templates)
function escapeHtml(str) {
  if (str === undefined || str === null) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

module.exports = {
  generateAttendanceReport,
  generatePDFReport,
  generateHTMLReport,
};
