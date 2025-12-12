import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../services/apiClient";
import Alert from "./Alert";
import LoadingSpinner from "./LoadingSpinner";
import "../styles/LowAttendanceAlert.css";

const LowAttendanceAlert = ({ onClose, isOpen }) => {
  const { classId } = useParams();
  const { token } = useAuth();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [threshold, setThreshold] = useState("75");   // <-- FIXED (keep as string)
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchLowAttendanceStudents();
    }
  }, [isOpen, classId, threshold]);

  const fetchLowAttendanceStudents = async () => {
    setLoading(true);
    try {
      const response = await apiClient.notifications.getLowAttendance(
        classId,
        token,
        Number(threshold)   // convert safely when sending to API
      );

      setStudents(response.data.lowAttendanceStudents || []);

      setSelectedStudents(
        (response.data.lowAttendanceStudents || []).map((s) => s.studentId)
      );
    } catch (error) {
      setAlert({
        type: "error",
        message: error.message || "Failed to fetch low attendance students",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleStudentSelection = (studentId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSendNotification = async (type) => {
    if (selectedStudents.length === 0) {
      setAlert({ type: "warning", message: "Select at least one student." });
      return;
    }

    setSending(true);
    try {
      let response;

      const payload = {
        threshold: Number(threshold),
        studentIds: selectedStudents,
      };

      if (type === "sms") {
        response = await apiClient.notifications.sendSMS(classId, payload, token);
      } else if (type === "whatsapp") {
        response = await apiClient.notifications.sendWhatsApp(classId, payload, token);
      } else {
        response = await apiClient.notifications.sendEmail(classId, payload, token);
      }

      const count = response.data.filter((d) => d.status === "sent").length;

      setAlert({
        type: "success",
        message: `${count} ${type.toUpperCase()} notifications sent successfully!`,
      });
    } catch (error) {
      setAlert({
        type: "error",
        message: error.message || "Failed to send notification",
      });
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="low-attendance-modal-overlay">
      <div className="low-attendance-modal">
        <div className="modal-header">
          <h2>📊 Low Attendance Alert</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        <div className="modal-body">

          {/* ------- FIXED INPUT ------- */}
          <div className="threshold-control">
            <label>Attendance Threshold (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}  // <-- FIXED
            />
          </div>

          {loading ? (
            <LoadingSpinner message="Fetching low attendance students..." />
          ) : students.length === 0 ? (
            <div className="empty-state">
              <p>✓ All students have attendance above {threshold}%</p>
            </div>
          ) : (
            <>
              {/* LIST */}
              <div className="students-list">
                <div className="list-header">
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedStudents.length === students.length}
                      onChange={(e) =>
                        e.target.checked
                          ? setSelectedStudents(students.map((s) => s.studentId))
                          : setSelectedStudents([])
                      }
                    />
                    Select All ({students.length})
                  </label>
                </div>

                {students.map((student) => (
                  <div key={student.studentId} className="student-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.studentId)}
                        onChange={() => toggleStudentSelection(student.studentId)}
                      />

                      <div className="student-info">
                        <div>
                          <strong>{student.name}</strong>
                          <span className="roll">({student.rollNumber})</span>
                        </div>

                        <div className="attendance-status">
                          <span
                            className="percentage"
                            style={{
                              color:
                                student.attendance.percentage < 50
                                  ? "#d32f2f"
                                  : "#ff9800",
                            }}
                          >
                            {student.attendance.percentage}%
                          </span>

                          <span className="days">
                            {student.attendance.presentDays}/
                            {student.attendance.totalDays} days
                          </span>
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>

              {/* ACTION BUTTONS */}
              <div className="modal-actions">
                <button
                  className="btn btn-primary"
                  disabled={sending}
                  onClick={() => handleSendNotification("sms")}
                >
                  📱 Send SMS
                </button>

                <button
                  className="btn btn-primary"
                  disabled={sending}
                  onClick={() => handleSendNotification("whatsapp")}
                >
                  💬 WhatsApp
                </button>

                <button
                  className="btn btn-primary"
                  disabled={sending}
                  onClick={() => handleSendNotification("email")}
                >
                  📧 Email
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LowAttendanceAlert;
