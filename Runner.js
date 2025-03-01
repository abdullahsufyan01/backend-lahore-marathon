const mongoose = require('mongoose');

const RunnerSchema = new mongoose.Schema({
  name: String,
  bibNo: String,
  runDuration: String,
  raceStatus: String,
  positionNum: String,
  raceType: String // 5K, Half Marathon, Full Marathon
});

module.exports = mongoose.model('Runner', RunnerSchema);
