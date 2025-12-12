import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../services/apiClient";
import { formatDate, getAttendanceColor } from "../utils/helpers";
import Alert from "../components/Alert";
import LoadingSpinner from "../components/LoadingSpinner";
import Modal from "../components/Modal";
import "../styles/Reports.css";

const AttendanceReport = () => {
  const { classId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [reportType, setReportType] = useState("Class");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: formatDate(
      new Date(new Date().setDate(new Date().getDate() - 30))
    ),
    endDate: formatDate(new Date()),
  });

  useEffect(() => {
    fetchInitialData();
  }, [classId]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [classResponse, studentsResponse, reportsResponse] =
        await Promise.all([
          apiClient.classes.getById(classId, token),
          apiClient.students.getByClass(classId, token),
          apiClient.reports.getClass(classId, token),
        ]);

      setClassData(classResponse.data);
      setStudents(studentsResponse.data);
      setReports(reportsResponse.data);
    } catch (error) {
      setAlert({
        type: "error",
        message: error.message || "Failed to fetch data",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (e) => {
    e.preventDefault();

    if (reportType === "Individual" && !selectedStudent) {
      setAlert({ type: "error", message: "Please select a student" });
      return;
    }

    try {
      const response = await apiClient.reports.generate(
        classId,
        {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          reportType,
          studentId: reportType === "Individual" ? selectedStudent : null,
        },
        token
      );

      setReports([response.data, ...reports]);
      setShowGenerateModal(false);
      setAlert({ type: "success", message: "Report generated successfully!" });
    } catch (error) {
      setAlert({
        type: "error",
        message: error.message || "Failed to generate report",
      });
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm("Delete this report?")) return;

    try {
      await apiClient.reports.delete(reportId, token);
      setReports(reports.filter((r) => r._id !== reportId));
      setAlert({ type: "success", message: "Report deleted successfully!" });
    } catch (error) {
      setAlert({
        type: "error",
        message: error.message || "Failed to delete report",
      });
    }
  };

  const handleExportReport = async (reportId, title) => {
    try {
      const response = await apiClient.reports.export(reportId, token);

      if (response.html) {
        // Create a new window with the HTML
        const printWindow = window.open("", "", "height=600,width=800");
        printWindow.document.write(response.html);
        printWindow.document.close();

        // Optionally print
        setTimeout(() => {
          printWindow.print();
        }, 250);
      }
    } catch (error) {
      setAlert({
        type: "error",
        message: error.message || "Failed to export report",
      });
    }
  };

  if (loading) return <LoadingSpinner message="Loading reports..." />;

  return (
    <div className="reports-container">
      <div className="reports-header">
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <div>
          <h1>Attendance Reports</h1>
          <p className="class-subtitle">
            {classData?.className} ({classData?.classCode})
          </p>
        </div>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <div className="reports-actions">
        <button
          className="btn btn-primary"
          onClick={() => setShowGenerateModal(true)}
        >
          + Generate Report
        </button>
      </div>

      <div className="reports-list">
        {reports.length === 0 ? (
          <div className="empty-state">
            <p>📊 No reports generated yet. Create one to get started!</p>
          </div>
        ) : (
          reports.map((report) => {
            // Safe data access with fallback
            const data = report.data || {};
            const percentage = data.attendancePercentage || 0;
            const bgColor = getAttendanceColor(percentage);

            return (
              <div key={report._id} className="report-card">
                <div className="report-card-header">
                  <h3>{report.title}</h3>
                  <span className="report-type">{report.reportType}</span>
                </div>

                <div className="report-card-body">
                  <div className="date-range">
                    <span className="label">Period:</span>
                    <span>
                      {new Date(report.startDate).toLocaleDateString()} -{" "}
                      {new Date(report.endDate).toLocaleDateString()}
                    </span>
                  </div>

                  {report.reportType === "Individual" && data.studentDetails ? (
                    <div className="student-details">
                      <p>
                        <strong>Student:</strong> {data.studentDetails.name} (
                        {data.studentDetails.rollNumber})
                      </p>
                      <div className="attendance-stats">
                        <div className="stat-item">
                          <span>Total Days:</span>
                          <strong>{data.totalDays || 0}</strong>
                        </div>
                        <div className="stat-item">
                          <span>Present:</span>
                          <strong>{data.presentDays || 0}</strong>
                        </div>
                        <div className="stat-item">
                          <span>Absent:</span>
                          <strong>{data.absentDays || 0}</strong>
                        </div>
                        <div className="stat-item">
                          <span>Late:</span>
                          <strong>{data.lateDays || 0}</strong>
                        </div>
                      </div>
                      <div className="percentage-bar">
                        <div
                          className="percentage-fill"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: bgColor,
                          }}
                        ></div>
                      </div>
                      <p className="percentage-text">
                        Attendance:{" "}
                        <strong style={{ color: bgColor }}>
                          {percentage}%
                        </strong>
                      </p>
                    </div>
                  ) : (
                    <div className="class-report-summary">
                      <p>
                        <strong>Total Students:</strong>{" "}
                        {data.totalStudents || 0}
                      </p>
                      <p>
                        <strong>Generated on:</strong>{" "}
                        {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                      {data.studentReports &&
                      Object.keys(data.studentReports).length > 0 ? (
                        <div className="student-reports-preview">
                          <details>
                            <summary>
                              View Student Details (
                              {Object.keys(data.studentReports).length})
                            </summary>
                            <div className="student-list">
                              {Object.entries(data.studentReports).map(
                                ([studentId, studentData], idx) => (
                                  <div
                                    key={idx}
                                    className="student-report-item"
                                  >
                                    <div>
                                      <strong>{studentData.rollNumber} - {studentData.name}</strong>
                                      <div className="student-stats">
                                        <span>
                                          Total: {studentData.totalDays || 0}
                                        </span>
                                        <span>
                                          Present:{" "}
                                          {studentData.presentDays || 0}
                                        </span>
                                        <span>
                                          Absent: {studentData.absentDays || 0}
                                        </span>
                                        <span>
                                          Attendance:{" "}
                                          {studentData.attendancePercentage ||
                                            0}
                                          %
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </details>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>

                <div className="report-card-footer">
                  <button
                    className="btn btn-small"
                    onClick={() => handleExportReport(report._id, report.title)}
                  >
                    📥 Export PDF
                  </button>
                  <button
                    className="btn btn-small"
                    onClick={() => handleDeleteReport(report._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Generate Report Modal */}
      <Modal
        isOpen={showGenerateModal}
        title="Generate Report"
        onClose={() => setShowGenerateModal(false)}
      >
        <form onSubmit={handleGenerateReport} className="form">
          <div className="form-group">
            <label>Report Type:</label>
            <select
              value={reportType}
              onChange={(e) => {
                setReportType(e.target.value);
                setSelectedStudent("");
              }}
            >
              <option value="Class">Class Report</option>
              <option value="Individual">Individual Student Report</option>
            </select>
          </div>

          {reportType === "Individual" && (
            <div className="form-group">
              <label>Select Student:</label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                required
              >
                <option value="">-- Select a student --</option>
                {students.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.rollNumber})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Start Date:</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, startDate: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group">
              <label>End Date:</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, endDate: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Generate Report
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowGenerateModal(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AttendanceReport;
