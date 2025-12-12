export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhoneNumber = (phone) => {
  const re = /^\d{10,}$/;
  return re.test(phone.replace(/\D/g, ""));
};

export const validateRollNumber = (rollNumber) => {
  return rollNumber && rollNumber.trim().length > 0;
};

export const validateName = (name) => {
  return name && name.trim().length > 0;
};

export const validateClassCode = (code) => {
  return code && code.trim().length > 0;
};

export const validateForm = (data, requiredFields) => {
  const errors = {};

  for (let field of requiredFields) {
    if (!data[field] || data[field].trim() === "") {
      errors[field] = `${field} is required`;
    }
  }

  if (data.email && data.email.trim() !== "" && !validateEmail(data.email)) {
    errors.email = "Invalid email format";
  }

  if (
    data.phoneNumber &&
    data.phoneNumber.trim() !== "" &&
    !validatePhoneNumber(data.phoneNumber)
  ) {
    errors.phoneNumber = "Invalid phone number";
  }

  return errors;
};
