const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullName : {type: String, required: true, trim: true},
  email: { type: String, required: true, unique: true, lowercase: true, trim: true }, 
  password: {type : String, required: true},
});

// Prevent model overwrite error
module.exports = mongoose.models.User || mongoose.model("User", userSchema);
