require("dotenv").config();
const mongoose = require("mongoose");
const Teacher = require("../models/Teacher");
const Class = require("../models/Class");
const Student = require("../models/Student");
const Attendance = require("../models/Attendance");

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB");

    // Clear existing data
    await Teacher.deleteMany({});
    await Class.deleteMany({});
    await Student.deleteMany({});
    await Attendance.deleteMany({});

    // Create sample teacher
    const teacher = await Teacher.create({
      name: "John Smith",
      email: "john@example.com",
      password: "password123",
      phoneNumber: "9876543210",
      department: "Computer Science",
      qualifications: "B.Tech, M.Tech",
    });

    console.log("Teacher created:", teacher.email);

    // Create sample classes
    const class1 = await Class.create({
      className: "Data Structures",
      classCode: "CS101",
      section: "A",
      academicYear: "2024-2025",
      semester: 1,
      room: "101",
      teacher: teacher._id,
      schedule: {
        monday: "09:00 AM",
        wednesday: "09:00 AM",
        friday: "09:00 AM",
      },
    });

    const class2 = await Class.create({
      className: "Web Development",
      classCode: "CS102",
      section: "B",
      academicYear: "2024-2025",
      semester: 1,
      room: "102",
      teacher: teacher._id,
      schedule: {
        tuesday: "10:00 AM",
        thursday: "10:00 AM",
      },
    });

    console.log("Classes created:", class1.classCode, class2.classCode);

    // Create sample students for class1
    const students1 = await Student.insertMany([
      {
        rollNumber: "001",
        name: "Alice Johnson",
        email: "alice@example.com",
        phoneNumber: "9876543210",
        parentPhoneNumber: "+91 9876543210",
        parentEmail: "parent.alice@example.com",
        gender: "Female",
        class: class1._id,
      },
      {
        rollNumber: "002",
        name: "Bob Williams",
        email: "bob@example.com",
        phoneNumber: "9876543211",
        parentPhoneNumber: "+91 9876543211",
        parentEmail: "parent.bob@example.com",
        gender: "Male",
        class: class1._id,
      },
      {
        rollNumber: "003",
        name: "Carol Davis",
        email: "carol@example.com",
        phoneNumber: "9876543212",
        parentPhoneNumber: "+91 9876543212",
        parentEmail: "parent.carol@example.com",
        gender: "Female",
        class: class1._id,
      },
      {
        rollNumber: "004",
        name: "David Brown",
        email: "david@example.com",
        phoneNumber: "9876543213",
        parentPhoneNumber: "+91 9876543213",
        parentEmail: "parent.david@example.com",
        gender: "Male",
        class: class1._id,
      },
    ]);

    // Create sample students for class2
    const students2 = await Student.insertMany([
      {
        rollNumber: "001",
        name: "Emma Wilson",
        email: "emma@example.com",
        phoneNumber: "9876543214",
        parentPhoneNumber: "+91 9876543214",
        parentEmail: "parent.emma@example.com",
        gender: "Female",
        class: class2._id,
      },
      {
        rollNumber: "002",
        name: "Frank Miller",
        email: "frank@example.com",
        phoneNumber: "9876543215",
        parentPhoneNumber: "+91 9876543215",
        parentEmail: "parent.frank@example.com",
        gender: "Male",
        class: class2._id,
      },
      {
        rollNumber: "003",
        name: "Grace Lee",
        email: "grace@example.com",
        phoneNumber: "9876543216",
        parentPhoneNumber: "+91 9876543216",
        parentEmail: "parent.grace@example.com",
        gender: "Female",
        class: class2._id,
      },
    ]);

    // Update class total students
    await Class.findByIdAndUpdate(class1._id, {
      totalStudents: students1.length,
    });
    await Class.findByIdAndUpdate(class2._id, {
      totalStudents: students2.length,
    });

    console.log("Students created:", students1.length + students2.length);

    // Create sample attendance records for the last 10 days
    const statuses = ["Present", "Absent", "Late", "Leave"];
    const today = new Date();

    for (let daysAgo = 0; daysAgo < 10; daysAgo++) {
      const attendanceDate = new Date(today);
      attendanceDate.setDate(today.getDate() - daysAgo);
      attendanceDate.setHours(0, 0, 0, 0);

      // Attendance for class1
      const class1Records = students1.map((student) => ({
        student: student._id,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        remarks: "Class session",
      }));

      await Attendance.create({
        class: class1._id,
        teacher: teacher._id,
        date: attendanceDate,
        records: class1Records,
      });

      // Attendance for class2
      const class2Records = students2.map((student) => ({
        student: student._id,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        remarks: "Class session",
      }));

      await Attendance.create({
        class: class2._id,
        teacher: teacher._id,
        date: attendanceDate,
        records: class2Records,
      });
    }

    console.log("Attendance records created: 20 (10 days × 2 classes)");

    console.log("\n✅ Database seeded successfully!");
    console.log("\n📝 Sample Login Credentials:");
    console.log("Email: john@example.com");
    console.log("Password: password123");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error.message);
    process.exit(1);
  }
};

seedDatabase();
