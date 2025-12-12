const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost:27017/attendance-tracker",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const db = mongoose.connection;

db.on("connected", async () => {
  console.log("✅ Connected to MongoDB");
  console.log("🗑️  Clearing all collections...\n");

  try {
    // Get all collections
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();

    console.log(`Found ${collections.length} collections to delete:`);

    for (const collection of collections) {
      await mongoose.connection.db.dropCollection(collection.name);
      console.log(`  ✓ Deleted: ${collection.name}`);
    }

    console.log("\n✅ All collections deleted successfully!");
    console.log("\n📝 Next step: Run 'npm run seed' to populate fresh data\n");

    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error clearing database:", error.message);
    mongoose.connection.close();
    process.exit(1);
  }
});

db.on("error", (error) => {
  console.error("❌ MongoDB connection error:", error.message);
  process.exit(1);
});
