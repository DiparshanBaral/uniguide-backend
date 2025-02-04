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

module.exports = { addUniversity, getUniversityById };