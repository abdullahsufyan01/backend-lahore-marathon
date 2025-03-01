const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const csvParser = require("csv-parser");
const dotenv = require("dotenv");
const Runner = require("./Runner"); // Mongoose Model

dotenv.config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// Define race files and types
const raceFiles = [
  { filePath: path.join(__dirname, "public", "5K_Results_Sanitized.csv"), raceType: "5K", positionKey: "positions_5k" },
  { filePath: path.join(__dirname, "public", "21K_Results_Sanitized.csv"), raceType: "Half Marathon", positionKey: "positions_half_marathon" },
  { filePath: path.join(__dirname, "public", "42K_Results_Sanitized.csv"), raceType: "Full Marathon", positionKey: "positions_full_marathon" }
];

const importData = async () => {
  try {
    await Runner.deleteMany(); // Clear old data

    let completeData = [];
    let categorizedData = {
      runners_5k: [],
      positions_5k: [],
      half_marathon: [],
      positions_half_marathon: [],
      full_marathon: [],
      positions_full_marathon: []
    };

    for (const file of raceFiles) {
      if (!fs.existsSync(file.filePath)) {
        console.error(`❌ File not found: ${file.filePath}`);
        continue;
      }

      console.log(`📂 Reading file: ${file.filePath}`);

      const runners = [];

      await new Promise((resolve, reject) => {
        fs.createReadStream(file.filePath)
          .pipe(csvParser({ headers: ["name", "bibNo", "runDuration", "raceStatus", "positionNum"] }))
          .on("data", (data) => {
            const runner = {
              name: data.name.trim(),
              bibNo: String(data.bibNo).trim(),
              runDuration: data.runDuration.trim(),
              raceStatus: data.raceStatus.trim(),
              positionNum: data.positionNum.trim(),
              raceType: file.raceType,
            };

            runners.push(runner);
            completeData.push(runner); // Add to complete dataset

            if (file.raceType === "5K") categorizedData.runners_5k.push(runner);
            if (file.raceType === "Half Marathon") categorizedData.half_marathon.push(runner);
            if (file.raceType === "Full Marathon") categorizedData.full_marathon.push(runner);

            // Store only completed runners with positions
            if (runner.raceStatus.toLowerCase() === "completed" && runner.positionNum !== "0") {
              categorizedData[file.positionKey].push(runner);
            }
          })
          .on("end", async () => {
            console.log(`📊 Total records for ${file.raceType}: ${runners.length}`);

            // Insert into MongoDB
            await Runner.insertMany(runners);
            console.log(`✅ Data imported for ${file.raceType}`);

            resolve();
          })
          .on("error", (error) => reject(error));
      });
    }

    console.log(`🎉 All data imported successfully! Total records: ${completeData.length}`);
    process.exit();
  } catch (error) {
    console.error("❌ Error importing data:", error);
    process.exit(1);
  }
};

importData();
