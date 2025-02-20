const { USUniversity, UKUniversity, CanadaUniversity, AustraliaUniversity } = require('../models/universityModel');

// Controller to add university to the respective collection
const addUniversity = async (req, res) => {
  const { country, name, location, ranking, coursesOffered, contact, website, description, tuitionFee, acceptanceRate, graduationRate } = req.body;

  // Check for required fields
  if (!country || !name || !location || !ranking || !tuitionFee || !acceptanceRate || !graduationRate) {
    return res.status(400).json({ message: 'Missing required fields' });
  }


  try {
    let university;

    // Ensure the correct schema is being selected based on the country
    switch (country) {
      case 'US':
        university = new USUniversity({
          country, name, location, ranking, coursesOffered, contact, website, description, tuitionFee, acceptanceRate, graduationRate
        });
        break;
      case 'UK':
        university = new UKUniversity({
          country, name, location, ranking, coursesOffered, contact, website, description, tuitionFee, acceptanceRate, graduationRate
        });
        break;
      case 'Canada':
        university = new CanadaUniversity({
          country, name, location, ranking, coursesOffered, contact, website, description, tuitionFee, acceptanceRate, graduationRate
        });
        break;
      case 'Australia':
        university = new AustraliaUniversity({
          country, name, location, ranking, coursesOffered, contact, website, description, tuitionFee, acceptanceRate, graduationRate
        });
        break;
      default:
        return res.status(400).json({ message: 'Invalid country' });
    }

    // Save the university to the database
    const savedUniversity = await university.save();
    res.status(201).json(savedUniversity);
  } catch (error) {
    console.error('Error adding university:', error);
    res.status(500).json({ message: 'Error adding university' });
  }
};

// Function to get a university by ID based on country
const getUniversityById = async (req, res) => {
  const { country, id } = req.params;
  let universityModel;

  // Determine which model to use based on the country
  switch (country) {
    case 'us':
      universityModel = USUniversity;
      break;
    case 'uk':
      universityModel = UKUniversity;
      break;
    case 'canada':
      universityModel = CanadaUniversity;
      break;
    case 'australia':
      universityModel = AustraliaUniversity;
      break;
    default:
      return res.status(400).json({ message: 'Invalid country' });
  }

  try {
    const university = await universityModel.findById(id);

    if (!university) {
      return res.status(404).json({ message: 'University not found' });
    }

    res.status(200).json(university);
  } catch (error) {
    console.error(`Error fetching ${country.toUpperCase()} university:`, error);
    res.status(500).json({ message: 'Error fetching university' });
  }
};

// Function to fetch all universities by country
const getUniversitiesByCountry = async (req, res) => {
  const { country } = req.params;
  let universityModel;

  switch (country.toLowerCase()) {
    case 'us':
      universityModel = USUniversity;
      break;
    case 'uk':
      universityModel = UKUniversity;
      break;
    case 'canada':
      universityModel = CanadaUniversity;
      break;
    case 'australia':
      universityModel = AustraliaUniversity;
      break;
    default:
      return res.status(400).json({ message: 'Invalid country' });
  }

  try {
    const universities = await universityModel.find();
    res.status(200).json(universities);
  } catch (error) {
    console.error(`Error fetching universities in ${country.toUpperCase()}:`, error);
    res.status(500).json({ message: 'Error fetching universities' });
  }
};

//delete university
const deleteUniversityById = async (req, res) => {
  const { country, id } = req.params;
  let universityModel;

  switch (country.toLowerCase()) {
    case 'us':
      universityModel = USUniversity;
      break;
    case 'uk':
      universityModel = UKUniversity;
      break;
    case 'canada':
      universityModel = CanadaUniversity;
      break;
    case 'australia':
      universityModel = AustraliaUniversity;
      break;
    default:
      return res.status(400).json({ message: 'Invalid country' });
  }

  try {
    const university = await universityModel.findByIdAndDelete(id);
    if (!university) {
      return res.status(404).json({ message: 'University not found' });
    }
    res.status(200).json({ message: 'University deleted successfully' });
  } catch (error) {
    console.error(`Error deleting ${country.toUpperCase()} university:`, error);
    res.status(500).json({ message: 'Error deleting university' });
  }
};

// Function to update a university by ID
const updateUniversityById = async (req, res) => {
  try {
    const { country, id } = req.params;

    // Trim whitespace from country
    const trimmedCountry = country.trim();

    let UniversityModel;

    // Directly determine the UniversityModel based on the country
    if (trimmedCountry === 'us') {
      UniversityModel = USUniversity;
    } else if (trimmedCountry === 'uk') {
      UniversityModel = UKUniversity;
    } else if (trimmedCountry === 'canada') {
      UniversityModel = CanadaUniversity;
    } else if (trimmedCountry === 'australia') {
      UniversityModel = AustraliaUniversity;
    } else {
      return res.status(400).json({ message: 'Invalid country specified.' });
    }

    // Prepare the update data
    const updateData = req.body;

    // If an image is uploaded, get the URL and add it to the update data
    if (req.file) {
      updateData.image = req.file.path; // Cloudinary returns the image URL in req.file.path
    }

    // Update the university in the database
    const updatedUniversity = await UniversityModel.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedUniversity) {
      return res.status(404).json({ message: 'University not found.' });
    }

    return res.status(200).json(updatedUniversity);
  } catch (error) {
    return res.status(500).json({ message: 'Error updating university.', error });
  }
};


module.exports = { addUniversity, getUniversityById, getUniversitiesByCountry, deleteUniversityById, updateUniversityById };