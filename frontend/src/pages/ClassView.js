import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../services/apiClient";
import Alert from "../components/Alert";
import LoadingSpinner from "../components/LoadingSpinner";
import Modal from "../components/Modal";
import LowAttendanceAlert from "../components/LowAttendanceAlert";
import "../styles/ClassView.css";

const ClassView = () => {
  const { classId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showLowAttendanceAlert, setShowLowAttendanceAlert] = useState(false);
  const [importMode, setImportMode] = useState("csv");
  const [csvFile, setCsvFile] = useState(null);
  const [formData, setFormData] = useState({
    rollNumber: "",
    name: "",
    email: "",
    phoneNumber: "",
    parentPhoneNumber: "",
  });
  const [existingClasses, setExistingClasses] = useState([]);

  useEffect(() => {
    fetchClassData();
    // eslint-disable-next-line
  }, [classId]);

  const fetchClassData = async () => {
    setLoading(true);
    try {
      const classResponse = await apiClient.classes.getById(classId, token);
      if (!classResponse.data) throw new Error("No class data received");

      setClassData(classResponse.data);

      try {
        const studentsResponse = await apiClient.students.getByClass(
          classId,
          token
        );
        setStudents(studentsResponse.data || []);
      } catch {
        setStudents([]);
      }
    } catch (error) {
      setAlert({
        type: "error",
        message:
          error.message || "Failed to fetch class data. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingClasses = async () => {
    try {
      const response = await apiClient.classes.getAll(token);
      setExistingClasses(response.data.filter((c) => c._id !== classId));
    } catch {}
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.students.add(classId, formData, token);
      setStudents([...students, response.data]);
      setShowAddStudentModal(false);
      setFormData({
        rollNumber: "",
        name: "",
        email: "",
        phoneNumber: "",
        parentPhoneNumber: "",
      });
      setAlert({ type: "success", message: "Student added successfully!" });
    } catch (error) {
      setAlert({
        type: "error",
        message: error.message || "Failed to add student",
      });
    }
  };

  const handleImportCSV = async (e) => {
    e.preventDefault();
    if (!csvFile)
      return setAlert({ type: "error", message: "Please select a CSV file" });

    try {
      const response = await apiClient.students.importCSV(
        classId,
        csvFile,
        token
      );
      setStudents([...students, ...response.data]);
      setShowImportModal(false);
      setCsvFile(null);
      setAlert({
        type: "success",
        message: `${response.data.length} students imported successfully!`,
      });
    } catch (error) {
      setAlert({
        type: "error",
        message: error.message || "Failed to import CSV",
      });
    }
  };

  const handleImportFromExisting = async (e) => {
    e.preventDefault();
    const sourceClassId = e.target.sourceClass.value;

    if (!sourceClassId)
      return setAlert({
        type: "error",
        message: "Please select a source class",
      });

    try {
      const response = await apiClient.students.importFromExisting(
        classId,
        sourceClassId,
        token
      );
      setStudents([...students, ...response.data]);
      setShowImportModal(false);
      setAlert({
        type: "success",
        message: `${response.data.length} students imported successfully!`,
      });
    } catch (error) {
      setAlert({
        type: "error",
        message: error.message || "Failed to import students",
      });
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm("Are you sure you want to delete this student?"))
      return;

    try {
      await apiClient.students.delete(classId, studentId, token);
      setStudents(students.filter((s) => s._id !== studentId));
      setAlert({ type: "success", message: "Student deleted successfully!" });
    } catch (error) {
      setAlert({
        type: "error",
        message: error.message || "Failed to delete student",
      });
    }
  };

  if (loading) return <LoadingSpinner message="Loading class details..." />;

  if (!classData)
    return (
      <div className="error-container">
        <p>❌ Class not found or failed to load</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="btn btn-primary"
        >
          Back to Dashboard
        </button>
      </div>
    );

  return (
    <div className="class-view-container">
      {/* FIXED HEADER */}
      <div className="class-view-header">
        <button className="btn-back" onClick={() => navigate("/dashboard")}>
          ← Back
        </button>

        <h1>{classData.className}</h1>
        <p className="class-subtitle">
          {classData.classCode} • Section {classData.section}
        </p>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* CLASS INFO */}
      <div className="class-info-grid">
        <div className="info-card">
          <span className="label">Academic Year</span>
          <span className="value">{classData.academicYear}</span>
        </div>
        <div className="info-card">
          <span className="label">Semester</span>
          <span className="value">{classData.semester}</span>
        </div>
        <div className="info-card">
          <span className="label">Total Students</span>
          <span className="value">{students.length}</span>
        </div>
        <div className="info-card">
          <span className="label">Room</span>
          <span className="value">{classData.room || "N/A"}</span>
        </div>
      </div>

      {/* STUDENT SECTION */}
      <div className="section-header">
        <h2>Students ({students.length})</h2>
        <div className="button-group">
          <button
            className="btn btn-primary"
            onClick={() => setShowAddStudentModal(true)}
          >
            + Add Student
          </button>

          <button
            className="btn btn-primary"
            onClick={() => setShowLowAttendanceAlert(true)}
            style={{
              background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)",
            }}
          >
            ⚠️ Low Attendance
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => {
              setImportMode("csv");
              setShowImportModal(true);
              fetchExistingClasses();
            }}
          >
            📥 Import
          </button>

          <button
            className="btn btn-success"
            onClick={() => navigate(`/class/${classId}/attendance`)}
          >
            📋 Mark Attendance
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="students-table-container">
        {students.length === 0 ? (
          <div className="empty-state">
            <p>📚 No students in this class yet</p>
            <p style={{ fontSize: "0.9rem", color: "#bbb" }}>
              Add students manually or import from CSV / existing class.
            </p>
          </div>
        ) : (
          <table className="students-table">
            <thead>
              <tr>
                <th>Roll No.</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {students.map((student) => (
                <tr key={student._id}>
                  <td>{student.rollNumber}</td>
                  <td>{student.name}</td>
                  <td>{student.email || "-"}</td>
                  <td>{student.phoneNumber || "-"}</td>

                  <td>
                    <button
                      className="btn btn-small btn-danger"
                      onClick={() => handleDeleteStudent(student._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Student Modal */}
      <Modal
        isOpen={showAddStudentModal}
        title="Add New Student"
        onClose={() => setShowAddStudentModal(false)}
      >
        <form onSubmit={handleAddStudent} className="form">
          <div className="form-group">
            <label>Roll Number:</label>
            <input
              type="text"
              value={formData.rollNumber}
              onChange={(e) =>
                setFormData({ ...formData, rollNumber: e.target.value })
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>Phone Number:</label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) =>
                setFormData({ ...formData, phoneNumber: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>Parent Phone Number:</label>
            <input
              type="tel"
              value={formData.parentPhoneNumber}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  parentPhoneNumber: e.target.value,
                })
              }
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Add Student
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowAddStudentModal(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Import Modal */}
      <Modal
        isOpen={showImportModal}
        title="Import Students"
        onClose={() => setShowImportModal(false)}
      >
        <div className="import-tabs">
          <button
            className={`tab-button ${importMode === "csv" ? "active" : ""}`}
            onClick={() => setImportMode("csv")}
          >
            From CSV
          </button>

          <button
            className={`tab-button ${
              importMode === "existing" ? "active" : ""
            }`}
            onClick={() => setImportMode("existing")}
          >
            From Existing Class
          </button>
        </div>

        {importMode === "csv" ? (
          <form onSubmit={handleImportCSV} className="form">
            <div className="form-group">
              <label>Select CSV File:</label>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files[0])}
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Import from CSV
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowImportModal(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleImportFromExisting} className="form">
            <div className="form-group">
              <label>Select Source Class:</label>
              <select name="sourceClass" required>
                <option value="">-- Select a class --</option>
                {existingClasses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.className} ({c.classCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Import Students
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowImportModal(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Low Attendance Alert Modal */}
      <LowAttendanceAlert
        isOpen={showLowAttendanceAlert}
        onClose={() => setShowLowAttendanceAlert(false)}
      />
    </div>
  );
};

export default ClassView;
