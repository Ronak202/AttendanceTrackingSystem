const validateCSV = (data) => {
  const errors = [];

  if (!data || data.length === 0) {
    errors.push("CSV file is empty");
    return errors;
  }

  const requiredFields = ["rollNumber", "name"];
  const firstRow = data[0];

  // Check if required fields exist
  for (let field of requiredFields) {
    if (!firstRow.hasOwnProperty(field)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate each row
  data.forEach((row, index) => {
    if (!row.rollNumber || row.rollNumber.trim() === "") {
      errors.push(`Row ${index + 1}: Roll number is required`);
    }
    if (!row.name || row.name.trim() === "") {
      errors.push(`Row ${index + 1}: Name is required`);
    }

    // Validate email if provided
    if (row.email && row.email.trim() !== "") {
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(row.email)) {
        errors.push(`Row ${index + 1}: Invalid email format - ${row.email}`);
      }
    }

    // Validate phone if provided
    if (row.phoneNumber && row.phoneNumber.trim() !== "") {
      if (!/^\d{10,}$/.test(row.phoneNumber.replace(/\D/g, ""))) {
        errors.push(
          `Row ${index + 1}: Invalid phone number - ${row.phoneNumber}`
        );
      }
    }
  });

  return errors;
};

module.exports = { validateCSV };
