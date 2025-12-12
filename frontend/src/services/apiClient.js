const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const apiClient = {
  request: async (method, endpoint, data = null, token = null) => {
    const config = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.body = JSON.stringify(data);
    }

    try {
      console.log(`[API] ${method} ${endpoint}`);
      const response = await fetch(`${API_URL}${endpoint}`, config);
      const result = await response.json();

      console.log(`[API Response] Status: ${response.status}`, result);

      if (!response.ok) {
        const error = new Error(result.message || "An error occurred");
        error.status = response.status;
        error.details = result;
        throw error;
      }

      return result;
    } catch (error) {
      console.error(`[API Error] ${method} ${endpoint}:`, error);
      throw error;
    }
  },

  // Auth endpoints
  auth: {
    register: (data) => apiClient.request("POST", "/auth/register", data),
    login: (data) => apiClient.request("POST", "/auth/login", data),
    getMe: (token) => apiClient.request("GET", "/auth/me", null, token),
    updateProfile: (data, token) =>
      apiClient.request("PUT", "/auth/profile", data, token),
  },

  // Class endpoints
  classes: {
    create: (data, token) => apiClient.request("POST", "/classes", data, token),
    getAll: (token) => apiClient.request("GET", "/classes", null, token),
    getById: (id, token) =>
      apiClient.request("GET", `/classes/${id}`, null, token),
    update: (id, data, token) =>
      apiClient.request("PUT", `/classes/${id}`, data, token),
    delete: (id, token) =>
      apiClient.request("DELETE", `/classes/${id}`, null, token),
  },

  // Student endpoints
  students: {
    getByClass: (classId, token) =>
      apiClient.request("GET", `/students/${classId}/students`, null, token),
    add: (classId, data, token) =>
      apiClient.request("POST", `/students/${classId}/students`, data, token),
    update: (classId, studentId, data, token) =>
      apiClient.request(
        "PUT",
        `/students/${classId}/students/${studentId}`,
        data,
        token
      ),
    delete: (classId, studentId, token) =>
      apiClient.request(
        "DELETE",
        `/students/${classId}/students/${studentId}`,
        null,
        token
      ),
    importCSV: async (classId, file, token) => {
      const formData = new FormData();
      formData.append("file", file);

      const config = {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      };

      const response = await fetch(
        `${API_URL}/students/${classId}/import/csv`,
        config
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "CSV import failed");
      }

      return result;
    },
    importFromExisting: (classId, sourceClassId, token) =>
      apiClient.request(
        "POST",
        `/students/${classId}/import/existing`,
        { sourceClassId },
        token
      ),
  },

  // Attendance endpoints
  attendance: {
    get: (classId, date, token) =>
      apiClient.request(
        "GET",
        `/attendance/${classId}/attendance?date=${date}`,
        null,
        token
      ),
    save: (classId, data, token) =>
      apiClient.request(
        "POST",
        `/attendance/${classId}/attendance`,
        data,
        token
      ),
    getHistory: (classId, startDate, endDate, token) =>
      apiClient.request(
        "GET",
        `/attendance/${classId}/attendance-history?startDate=${startDate}&endDate=${endDate}`,
        null,
        token
      ),
    lock: (classId, date, token) =>
      apiClient.request(
        "POST",
        `/attendance/${classId}/attendance/lock`,
        { date },
        token
      ),
  },

  // Report endpoints
  reports: {
    generate: (classId, data, token) =>
      apiClient.request(
        "POST",
        `/reports/${classId}/reports/generate`,
        data,
        token
      ),
    getStudent: (studentId, token) =>
      apiClient.request(
        "GET",
        `/reports/student/${studentId}/reports`,
        null,
        token
      ),
    getClass: (classId, token) =>
      apiClient.request("GET", `/reports/${classId}/reports`, null, token),
    share: (reportId, data, token) =>
      apiClient.request("POST", `/reports/${reportId}/share`, data, token),
    delete: (reportId, token) =>
      apiClient.request("DELETE", `/reports/${reportId}`, null, token),
    export: (reportId, token) =>
      apiClient.request(
        "GET",
        `/reports/${reportId}/export?format=pdf`,
        null,
        token
      ),
  },

  // Notification endpoints
  notifications: {
    getLowAttendance: (classId, token, threshold = 75) =>
      apiClient.request(
        "GET",
        `/notifications/${classId}/low-attendance?threshold=${threshold}`,
        null,
        token
      ),
    sendSMS: (classId, data, token) =>
      apiClient.request(
        "POST",
        `/notifications/${classId}/send-sms`,
        data,
        token
      ),
    sendWhatsApp: (classId, data, token) =>
      apiClient.request(
        "POST",
        `/notifications/${classId}/send-whatsapp`,
        data,
        token
      ),
    sendEmail: (classId, data, token) =>
      apiClient.request(
        "POST",
        `/notifications/${classId}/send-email`,
        data,
        token
      ),
  },
};

export default apiClient;
