const express = require("express");
const connectDB = require("./connection");
const dotenv = require("dotenv");
const cors = require("cors");
const Runner = require("./Runner");

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
      const runners_5k = completeData.filter(r => r.raceType === "5K");
      const positions_5k = runners_5k.filter(r => ["1", "2", "3"].includes(r.positionNum));
  
      const half_marathon = completeData.filter(r => r.raceType === "Half Marathon");
      const positions_half_marathon = half_marathon.filter(r => ["1", "2", "3"].includes(r.positionNum));
  
      const full_marathon = completeData.filter(r => r.raceType === "Full Marathon");
      const positions_full_marathon = full_marathon.filter(r => ["1", "2", "3"].includes(r.positionNum));
  
      res.json({
        msg: "Data fetched successfully",
        complete_data: completeData,
        runners_5k,
        positions_5k,
        half_marathon,
        positions_half_marathon,
        full_marathon,
        positions_full_marathon
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
