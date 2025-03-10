const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Student } = require('../models/studentModel');
const {
  USUniversity,
  UKUniversity,
  CanadaUniversity,
  AustraliaUniversity,
} = require('../models/universityModel');

const universityModels = {
  US: USUniversity,
  UK: UKUniversity,
  Canada: CanadaUniversity,
  Australia: AustraliaUniversity,
};

// Register a new student
const registerStudent = async (req, res) => {
  const { firstname, lastname, email, password, confirmPassword } = req.body;

  try {
    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Check if student already exists
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({ message: 'Student already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new student
    const newStudent = await Student.create({
      firstname,
      lastname,
      email,
      password: hashedPassword,
    });

    // Return success response
    res.status(201).json({
      message: 'Student created successfully',
      _id: newStudent.id,
      firstname: newStudent.firstname,
      lastname: newStudent.lastname,
      email: newStudent.email,
    });
  } catch (error) {
    console.error('Error during registration:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Authenticate a student
const loginStudent = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find student by email
    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(401).json({ message: 'Student not found' });
    }

    // Compare passwords
    const matchPassword = await bcrypt.compare(password, student.password);
    if (!matchPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: student._id, role: 'student' }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    res.json({
      message: `Welcome back, ${student.firstname}!`,
      _id: student._id,
      firstname: student.firstname,
      lastname: student.lastname,
      email: student.email,
      token,
    });
  } catch (error) {
    console.error('Error during login:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Fetch student by ID
const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select('-password');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update student details
const updateStudent = async (req, res) => {
  const { firstname, lastname, email, bio, major } = req.body;

  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Update student details
    student.firstname = firstname || student.firstname;
    student.lastname = lastname || student.lastname;
    student.email = email || student.email;
    student.bio = bio || student.bio;
    student.major = major || student.major; 

    // Check if a file was uploaded
    if (req.file) {
      student.profilePic = req.file.path; // Save the profile picture URL
    }

    const updatedStudent = await student.save();

    res.status(200).json({
      message: 'Profile updated successfully',
      _id: updatedStudent._id,
      firstname: updatedStudent.firstname,
      lastname: updatedStudent.lastname,
      email: updatedStudent.email,
      profilePic: updatedStudent.profilePic,
      bio: updatedStudent.bio,
      major: updatedStudent.major,
    });
  } catch (error) {
    console.error('Error updating student:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

//Delete student by id
const deleteStudentById = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.status(200).json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Fetch public student profile (accessible to mentors and other students)
const getPublicStudentProfile = async (req, res) => {
  try {
    const { id } = req.params; // Extract student ID from URL params

    // Fetch the student's public profile details
    const student = await Student.findById(id).select(
      'firstname lastname profilePic bio major targetedUniversities',
    );

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    console.error('Error fetching public profile:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const addToWishlist = async (req, res) => {
  const studentId = req.user.id; // Since the student is now attached to req.user
  const { universityId, country } = req.body;

  try {
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Map the country to the respective University Model
    const UniversityModel = universityModels[country];
    if (!UniversityModel) {
      return res.status(400).json({ message: "Invalid country specified" });
    }

    const university = await UniversityModel.findById(universityId);
    if (!university) {
      return res.status(404).json({ message: "University not found" });
    }

    // Check if the university is already in the wishlist
    if (student.targetedUniversities.includes(universityId)) {
      return res.status(409).json({ message: "University already in wishlist" });
    }

    // Add to wishlist
    student.targetedUniversities.push(universityId);
    await student.save();

    res.status(200).json({
      message: "University added to wishlist",
      targetedUniversities: student.targetedUniversities,
    });
  } catch (error) {
    console.error("Error adding to wishlist:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



module.exports = {
  registerStudent,
  loginStudent,
  getStudentById,
  updateStudent,
  deleteStudentById,
  getPublicStudentProfile,
  addToWishlist,
};
