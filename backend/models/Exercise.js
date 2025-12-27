const mongoose = require("mongoose");

const exerciseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, default: "Strength" },
  muscleGroup: { type: String, default: "Full Body" },
  equipment: { type: String, default: "Bodyweight" },
  difficulty: { type: String, default: "Beginner" },
  description: { type: String, default: "" },
  isCustom: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("Exercise", exerciseSchema);
