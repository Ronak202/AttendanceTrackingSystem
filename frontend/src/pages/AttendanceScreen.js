import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../services/apiClient";
import { formatDate } from "../utils/helpers";
import Alert from "../components/Alert";
import LoadingSpinner from "../components/LoadingSpinner";
import "../styles/Attendance.css";

const AttendanceScreen = () => {
  const { classId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [attendance, setAttendance] = useState(null);
  const [classData, setClassData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    fetchClassData();
  }, [classId]);

  useEffect(() => {
    if (classId) fetchAttendance();
  }, [selectedDate, classId]);

  const fetchClassData = async () => {
    try {
      const response = await apiClient.classes.getById(classId, token);
      setClassData(response.data);
    } catch (error) {
      setAlert({
        type: "error",
        message: error.message || "Failed to fetch class data",
      });
    }
  };

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const response = await apiClient.attendance.get(
        classId,
        selectedDate,
        token
      );

      if (!response.data || !response.data.records) {
        setAttendance({ records: [], date: selectedDate });
      } else {
        // 🔥 FIX: Remove deleted students (student === null)
        const cleanedRecords = response.data.records.filter(
          (r) => r.student !== null
        );

        setAttendance({
          ...response.data,
          records: cleanedRecords,
        });
      }
    } catch (error) {
      setAlert({
        type: "error",
        message: error.message || "Failed to fetch attendance",
      });
      setAttendance(null);
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Update using studentId instead of array index
  const handleStatusChange = (studentId, status) => {
    if (!attendance || !attendance.records) return;

    const updatedAttendance = {
      ...attendance,
      records: attendance.records.map((r) =>
        r.student && r.student._id === studentId ? { ...r, status } : r
      ),
    };

    setAttendance(updatedAttendance);
  };

  const handleSaveAttendance = async () => {
    try {
      await apiClient.attendance.save(
        classId,
        {
          date: selectedDate,
          records: attendance.records,
        },
        token
      );
      setAlert({ type: "success", message: "Attendance saved successfully!" });
    } catch (error) {
      setAlert({
        type: "error",
        message: error.message || "Failed to save attendance",
      });
    }
  };

  if (loading) return <LoadingSpinner message="Loading attendance..." />;

  if (!attendance || !attendance.records) {
    return (
      <div className="error-container">
        <p>❌ Unable to load attendance</p>
        <button onClick={() => navigate(-1)} className="btn btn-primary">
          Go Back
        </button>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="error-container">
        <p>❌ Unable to load class information</p>
        <button onClick={() => navigate(-1)} className="btn btn-primary">
          Go Back
        </button>
      </div>
    );
  }

  const stats = {
    present: attendance.records.filter((r) => r?.status === "Present").length,
    absent: attendance.records.filter((r) => r?.status === "Absent").length,
    late: attendance.records.filter((r) => r?.status === "Late").length,
    leave: attendance.records.filter((r) => r?.status === "Leave").length,
  };

  return (
    <div className="attendance-container">
      <div className="attendance-header">
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <div>
          <h1>Mark Attendance</h1>
          <p className="class-subtitle">
            {classData.className} ({classData.classCode})
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

      <div className="attendance-controls">
        <div className="date-picker">
          <label>Select Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <div className="stats-grid">
          <div className="stat present">
            <span className="stat-label">Present</span>
            <span className="stat-value">{stats.present}</span>
          </div>
          <div className="stat absent">
            <span className="stat-label">Absent</span>
            <span className="stat-value">{stats.absent}</span>
          </div>
          <div className="stat late">
            <span className="stat-label">Late</span>
            <span className="stat-value">{stats.late}</span>
          </div>
          <div className="stat leave">
            <span className="stat-label">Leave</span>
            <span className="stat-value">{stats.leave}</span>
          </div>
        </div>
      </div>

      <div className="attendance-table-container">
        <table className="attendance-table">
          <thead>
            <tr>
              <th>Roll No.</th>
              <th>Name</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {attendance.records.map((record, index) =>
              record && record.student ? (
                <tr key={record.student._id || index}>
                  <td>{record.student.rollNumber}</td>
                  <td>{record.student.name}</td>
                  <td>
                    <div className="status-buttons">

                      <button
                        className={`status-btn ${
                          record.status === "Present" ? "active" : ""
                        }`}
                        onClick={() =>
                          handleStatusChange(record.student._id, "Present")
                        }
                      >
                        ✓ Present
                      </button>

                      <button
                        className={`status-btn ${
                          record.status === "Absent" ? "active" : ""
                        }`}
                        onClick={() =>
                          handleStatusChange(record.student._id, "Absent")
                        }
                      >
                        ✕ Absent
                      </button>

                      <button
                        className={`status-btn ${
                          record.status === "Late" ? "active" : ""
                        }`}
                        onClick={() =>
                          handleStatusChange(record.student._id, "Late")
                        }
                      >
                        ⏱ Late
                      </button>

                      <button
                        className={`status-btn ${
                          record.status === "Leave" ? "active" : ""
                        }`}
                        onClick={() =>
                          handleStatusChange(record.student._id, "Leave")
                        }
                      >
                        🏥 Leave
                      </button>

                    </div>
                  </td>
                </tr>
              ) : null
            )}
          </tbody>
        </table>
      </div>

      <div className="attendance-actions">
        <button className="btn btn-primary" onClick={handleSaveAttendance}>
          💾 Save Attendance
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => navigate(`/class/${classId}/attendance-report`)}
        >
          📊 View Reports
        </button>
      </div>
    </div>
  );
};

export default AttendanceScreen;
