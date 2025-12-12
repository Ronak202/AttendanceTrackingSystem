import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useClass } from "../context/ClassContext";
import apiClient from "../services/apiClient";
import Alert from "../components/Alert";
import LoadingSpinner from "../components/LoadingSpinner";
import Modal from "../components/Modal";
import "../styles/Dashboard.css";

const Dashboard = () => {
  const { user, token, logout } = useAuth();
  const { classes, updateClassList, selectClass } = useClass();

  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [formData, setFormData] = useState({
    className: "",
    classCode: "",
    section: "A",
    academicYear:
      new Date().getFullYear() + "-" + (new Date().getFullYear() + 1),
    semester: 1,
    room: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const response = await apiClient.classes.getAll(token);
      updateClassList(response.data);
    } catch (error) {
      setAlert({
        type: "error",
        message: error.message || "Failed to fetch classes",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.classes.create(formData, token);

      updateClassList([...classes, response.data]);

      setShowCreateModal(false);

      setFormData({
        className: "",
        classCode: "",
        section: "A",
        academicYear:
          new Date().getFullYear() + "-" + (new Date().getFullYear() + 1),
        semester: 1,
        room: "",
      });

      setAlert({ type: "success", message: "Class created successfully!" });

    } catch (error) {
      setAlert({
        type: "error",
        message: error.message || "Failed to create class",
      });
    }
  };

  const handleDeleteClass = async (classId) => {
    if (!window.confirm("Are you sure you want to delete this class?")) return;

    try {
      await apiClient.classes.delete(classId, token);
      updateClassList(classes.filter((c) => c._id !== classId));
      setAlert({ type: "success", message: "Class deleted successfully!" });
    } catch (error) {
      setAlert({
        type: "error",
        message: error.message || "Failed to delete class",
      });
    }
  };

  const handleClassClick = (classData) => {
    selectClass(classData);
    navigate(`/class/${classData._id}`);
  };

  const handleLogout = () => {
    logout();
    navigate("/"); // back to home page
  };

  if (loading) return <LoadingSpinner message="Loading your classes..." />;

  return (
    <div className="dashboard-container">

      {/* LOGOUT BUTTON */}
      <button
        onClick={handleLogout}
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          padding: "10px 18px",
          background: "#ff4d4d",
          border: "none",
          borderRadius: "8px",
          color: "white",
          fontWeight: "600",
          cursor: "pointer",
        }}
      >
        Logout
      </button>

      {/* HEADER */}
      <div className="dashboard-header">
        <h1>Welcome, {user?.name}! 👋</h1>
        <p>Manage your classes and attendance</p>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* CREATE CLASS BUTTON */}
      <div className="dashboard-actions">
        <button
          className="btn btn-primary btn-large"
          onClick={() => setShowCreateModal(true)}
        >
          + Create New Class
        </button>
      </div>

      {/* CLASS CARDS */}
      <div className="classes-grid">
        {classes.length === 0 ? (
          <div className="empty-state">
            <p>📚 No classes yet. Create your first class!</p>
          </div>
        ) : (
          classes.map((classData) => (
            <div key={classData._id} className="class-card">

              {/* TITLE + DELETE BUTTON */}
              <div className="class-card-header">

                <h3 onClick={() => handleClassClick(classData)}>
                  {classData.className}
                </h3>

                <div className="right-section">
                  <span className="class-code">{classData.classCode}</span>

                  <button
                    className="delete-class-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClass(classData._id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* BODY */}
              <div
                className="class-card-body"
                onClick={() => handleClassClick(classData)}
              >
                <p><strong>Section:</strong> {classData.section}</p>
                <p><strong>Year:</strong> {classData.academicYear}</p>
                <p><strong>Students:</strong> {classData.totalStudents}</p>
                <p><strong>Room:</strong> {classData.room || "N/A"}</p>
              </div>

              {/* FOOTER */}
              <div className="class-card-footer">
                <button
                  className="btn btn-small"
                  onClick={() => handleClassClick(classData)}
                >
                  View Details →
                </button>
              </div>

            </div>
          ))
        )}
      </div>

      {/* CREATE CLASS MODAL */}
      <Modal
        isOpen={showCreateModal}
        title="Create New Class"
        onClose={() => setShowCreateModal(false)}
      >
        <form onSubmit={handleCreateClass} className="form">

          <div className="form-group">
            <label>Class Name:</label>
            <input
              type="text"
              value={formData.className}
              onChange={(e) => setFormData({ ...formData, className: e.target.value })}
              placeholder="e.g., Data Structures"
              required
            />
          </div>

          <div className="form-group">
            <label>Class Code:</label>
            <input
              type="text"
              value={formData.classCode}
              onChange={(e) =>
                setFormData({ ...formData, classCode: e.target.value.toUpperCase() })
              }
              placeholder="e.g., CS101"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Section:</label>
              <input
                type="text"
                value={formData.section}
                onChange={(e) =>
                  setFormData({ ...formData, section: e.target.value })
                }
                placeholder="e.g., A"
              />
            </div>

            <div className="form-group">
              <label>Semester:</label>
              <select
                value={formData.semester}
                onChange={(e) =>
                  setFormData({ ...formData, semester: parseInt(e.target.value) })
                }
              >
                {[1,2,3,4,5,6,7,8].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Academic Year:</label>
              <input
                type="text"
                value={formData.academicYear}
                onChange={(e) =>
                  setFormData({ ...formData, academicYear: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group">
              <label>Room:</label>
              <input
                type="text"
                value={formData.room}
                onChange={(e) =>
                  setFormData({ ...formData, room: e.target.value })
                }
                placeholder="101"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">Create Class</button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default Dashboard;
