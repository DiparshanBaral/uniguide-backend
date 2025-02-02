require('dotenv').config();
const bcrypt = require("bcryptjs");  // For password hashing
const mongoose = require("mongoose");  // For MongoDB interaction
const { Admin } = require("./models/userModel");  // Import Admin model
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const createAdmin = async () => {
  try {
    // Hash the password (ensure you change this if needed)
    const hashedPassword = await bcrypt.hash("123456789", 10); 

    // Create the admin user
    const admin = new Admin({
      email: "admin@gmail.com",  
      password: hashedPassword, 
    });

    // Save the admin user to the database
    await admin.save();
    console.log("Admin user created successfully");

    // Disconnect from MongoDB
    mongoose.disconnect();
  } catch (error) {
    console.error("Error creating admin user:", error);
    mongoose.disconnect();
  }
};

// Run the function to create the admin
createAdmin();
