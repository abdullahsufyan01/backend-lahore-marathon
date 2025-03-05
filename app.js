const express = require("express");
const connectDB = require("./connection");
const dotenv = require("dotenv");
const cors = require("cors");
const Runner = require("./Runner");
//  vercel --prod for next depoloyement
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const db_Url = process.env.MONGO_URI;

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(cors()); // Enable CORS

// MongoDB Connection
connectDB(db_Url);

// Default Route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Get all runners with structured response
app.get("/api/runners", async (req, res) => {
  try {
    const completeData = await Runner.find({});

    // Helper function to get top 3 male & female positions based on rankInSimilarGender
    const getTopPositionsByGender = (runners) => ({
      male: runners
        .filter(r => r.gender.toUpperCase() === "MALE" && ["1", "2", "3"].includes(r.rankInSimilarGender))
        .sort((a, b) => a.rankInSimilarGender - b.rankInSimilarGender),
      female: runners
        .filter(r => r.gender.toUpperCase() === "FEMALE" && ["1", "2", "3"].includes(r.rankInSimilarGender))
        .sort((a, b) => a.rankInSimilarGender - b.rankInSimilarGender)
    });

    // Grouping runners by race type
    const runners_5k = completeData.filter(r => r.raceType === "5K");
    const runners_half_marathon = completeData.filter(r => r.raceType === "Half Marathon");
    const runners_full_marathon = completeData.filter(r => r.raceType === "Full Marathon");

    res.json({
      msg: "Data fetched successfully",
      complete_data: completeData,
      races: {
        "Full Marathon": {
          runners: runners_full_marathon,
          positions: getTopPositionsByGender(runners_full_marathon)
        },
        "Half Marathon": {
          runners: runners_half_marathon,
          positions: getTopPositionsByGender(runners_half_marathon)
        },
        "5K": {
          runners: runners_5k,
          positions: getTopPositionsByGender(runners_5k)
        },
      }
    });

  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});


// Get a specific runner by bib number
app.get('/api/runners/:bibNo', async (req, res) => {
  try {
    const { bibNo } = req.params;
    const runner = await Runner.findOne({ bibNo: bibNo });

    if (!runner) {
      return res.status(404).json({ message: 'Runner not found' });
    }

    res.json(runner);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
