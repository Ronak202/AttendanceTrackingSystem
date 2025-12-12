import React, { createContext, useContext, useState, useCallback } from "react";

const ClassContext = createContext();

export const ClassProvider = ({ children }) => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addClass = useCallback((newClass) => {
    setClasses((prev) => [...prev, newClass]);
  }, []);

  const updateClassList = useCallback((classList) => {
    setClasses(classList);
  }, []);

  const selectClass = useCallback((classData) => {
    setSelectedClass(classData);
  }, []);

  const updateStudents = useCallback((studentList) => {
    setStudents(studentList);
  }, []);

  const addStudent = useCallback((student) => {
    setStudents((prev) => [...prev, student]);
  }, []);

  const removeStudent = useCallback((studentId) => {
    setStudents((prev) => prev.filter((s) => s._id !== studentId));
  }, []);

  const value = {
    classes,
    selectedClass,
    students,
    loading,
    error,
    addClass,
    updateClassList,
    selectClass,
    updateStudents,
    addStudent,
    removeStudent,
    setLoading,
    setError,
  };

  return (
    <ClassContext.Provider value={value}>{children}</ClassContext.Provider>
  );
};

export const useClass = () => {
  const context = useContext(ClassContext);
  if (!context) {
    throw new Error("useClass must be used within ClassProvider");
  }
  return context;
};
