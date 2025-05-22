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
    
    // Fix: Use lowercase for country comparison
    const countryLower = country.toLowerCase();

    // Ensure the correct schema is being selected based on the country
    switch (countryLower) {
      case 'us':
        university = new USUniversity({
          country: 'US', // Store the standardized country code
          name, location, ranking, coursesOffered, contact, website, description, 
          tuitionFee, acceptanceRate, graduationRate
        });
        break;
      case 'uk':
        university = new UKUniversity({
          country: 'UK',
          name, location, ranking, coursesOffered, contact, website, description, 
          tuitionFee, acceptanceRate, graduationRate
        });
        break;
      case 'canada':
        university = new CanadaUniversity({
          country: 'Canada',
          name, location, ranking, coursesOffered, contact, website, description, 
          tuitionFee, acceptanceRate, graduationRate
        });
        break;
      case 'australia':
        university = new AustraliaUniversity({
          country: 'Australia',
          name, location, ranking, coursesOffered, contact, website, description, 
          tuitionFee, acceptanceRate, graduationRate
        });
        break;
      default:
        return res.status(400).json({ 
          message: 'Invalid country. Please use: us, uk, canada, or australia' 
        });
    }

    // Add image URL if a file was uploaded
    if (req.file) {
      university.image = req.file.path;
    }

    // Save the university to the database
    const savedUniversity = await university.save();
    res.status(201).json(savedUniversity);
  } catch (error) {
    console.error('Error adding university:', error);
    res.status(500).json({ message: 'Error adding university', error: error.message });
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

// Real-time search suggestions
const searchUniversities = async (req, res) => {
  const { query, country } = req.body;

  // Validate the query parameter
  if (!query || query.trim() === '') {
    return res.status(200).json([]); // Return an empty array if no query is provided
  }

  try {
    // Normalize the country parameter to lowercase and trim whitespace
    const trimmedCountry = country?.trim().toLowerCase();

    // Define valid countries
    const validCountries = ['us', 'uk', 'canada', 'australia'];

    // Validate the country parameter
    if (trimmedCountry && !validCountries.includes(trimmedCountry)) {
      console.error(`Invalid country received: ${trimmedCountry}`);
      return res.status(400).json({ message: 'Invalid country. Please choose from: us, uk, canada, australia' });
    }

    // Define a regex pattern for case-insensitive partial matching
    const regexPattern = new RegExp(query.trim(), 'i');

    let results = [];
    if (trimmedCountry) {
      switch (trimmedCountry) {
        case 'us':
          results = await USUniversity.find({ name: regexPattern }, 'name country').limit(5);
          break;
        case 'uk':
          results = await UKUniversity.find({ name: regexPattern }, 'name country').limit(5);
          break;
        case 'canada':
          results = await CanadaUniversity.find({ name: regexPattern }, 'name country').limit(5);
          break;
        case 'australia':
          results = await AustraliaUniversity.find({ name: regexPattern }, 'name country').limit(5);
          break;
      }
    } else {
      // If no country is specified, search across all collections
      const allResults = await Promise.all([
        USUniversity.find({ name: regexPattern }, 'name country').limit(5),
        UKUniversity.find({ name: regexPattern }, 'name country').limit(5),
        CanadaUniversity.find({ name: regexPattern }, 'name country').limit(5),
        AustraliaUniversity.find({ name: regexPattern }, 'name country').limit(5),
      ]);
      results = allResults.flat();
    }

    // Limit the combined results to at most 5 universities
    const limitedResults = results.slice(0, 5);

    res.status(200).json(limitedResults);
  } catch (error) {
    console.error('Error searching universities:', error);
    res.status(500).json({ message: 'Error searching universities', error: error.message });
  }
};

// Full Search Functionality (For "Find Universities" Button)
const findUniversities = async (req, res) => {
  try {
    const { query, country, fieldOfStudy, budgetRange } = req.body; // Extract parameters from the body

    // Validate the query parameter
    if (!query || query.trim() === '') {
      return res.status(200).json([]); // Return an empty array if no query is provided
    }

    // Normalize the country parameter to lowercase and trim whitespace
    const trimmedCountry = country?.trim().toLowerCase();

    // Define valid countries
    const validCountries = ['us', 'uk', 'canada', 'australia'];

    // Validate the country parameter
    if (trimmedCountry && !validCountries.includes(trimmedCountry)) {
      console.error(`Invalid country received: ${trimmedCountry}`);
      return res.status(400).json({ message: 'Invalid country. Please choose from: us, uk, canada, australia' });
    }

    // Define a regex pattern for case-insensitive partial matching
    const regexPattern = new RegExp(query.trim(), 'i');

    // Build the filter object
    const filter = { name: regexPattern };

    // Add field of study filter if provided
    if (fieldOfStudy) {
      filter.coursesOffered = { $in: [fieldOfStudy] }; // Check if the field of study exists in coursesOffered
    }

    // Add budget range filter if provided
    if (budgetRange) {
      switch (budgetRange) {
        case 'low':
          filter['tuitionFee.undergraduate'] = { $lte: 20000 }; // Undergraduate tuition <= $20k
          break;
        case 'medium':
          filter['tuitionFee.undergraduate'] = { $gt: 20000, $lte: 35000 }; // $20k < Undergraduate tuition <= $35k
          break;
        case 'high':
          filter['tuitionFee.undergraduate'] = { $gt: 35000 }; // Undergraduate tuition > $35k
          break;
        default:
          break;
      }
    }

    let results = [];
    if (trimmedCountry) {
      switch (trimmedCountry) {
        case 'us':
          results = await USUniversity.find(filter).limit(6);
          break;
        case 'uk':
          results = await UKUniversity.find(filter).limit(6);
          break;
        case 'canada':
          results = await CanadaUniversity.find(filter).limit(6);
          break;
        case 'australia':
          results = await AustraliaUniversity.find(filter).limit(6);
          break;
      }
    } else {
      // If no country is specified, search across all collections
      const allResults = await Promise.all([
        USUniversity.find(filter).limit(6),
        UKUniversity.find(filter).limit(6),
        CanadaUniversity.find(filter).limit(6),
        AustraliaUniversity.find(filter).limit(6),
      ]);
      results = allResults.flat();
    }

    res.status(200).json(results);
  } catch (error) {
    console.error('Error finding universities:', error);
    res.status(500).json({ message: 'Error finding universities', error: error.message });
  }
};

// Controller to handle the survey submission
const takeSurvey = async (req, res) => {
  try {
    const {
      country,
      fieldOfStudy,
      budgetRange,
      acceptanceRateRange,
      graduationRateRange,
    } = req.body;

    // Validate required fields
    if (!country || !fieldOfStudy || !budgetRange) {
      return res.status(400).json({ message: 'Missing required survey fields' });
    }

    // Normalize inputs
    const trimmedCountry = country.trim().toLowerCase();
    const validCountries = ['us', 'uk', 'canada', 'australia'];

    if (!validCountries.includes(trimmedCountry)) {
      return res.status(400).json({ message: 'Invalid country specified' });
    }

    // Build the filter object
    const filter = {
      coursesOffered: { $in: [fieldOfStudy] }, // Match field of study
    };

    // Add budget range filter
    switch (budgetRange) {
      case 'low':
        filter['tuitionFee.undergraduate'] = { $lte: 20000 }; // Undergraduate tuition ≤ $20k
        break;
      case 'medium':
        filter['tuitionFee.undergraduate'] = { $gt: 20000, $lte: 35000 }; // $20k < Undergraduate tuition ≤ $35k
        break;
      case 'high':
        filter['tuitionFee.undergraduate'] = { $gt: 35000 }; // Undergraduate tuition > $35k
        break;
      default:
        break;
    }

    // Add acceptance rate filter
    if (acceptanceRateRange) {
      const [minAcceptanceRate, maxAcceptanceRate] = acceptanceRateRange.split('-').map(Number);
      filter.acceptanceRate = { $gte: minAcceptanceRate, $lte: maxAcceptanceRate };
    }

    // Add graduation rate filter
    if (graduationRateRange) {
      const [minGraduationRate, maxGraduationRate] = graduationRateRange.split('-').map(Number);
      filter.graduationRate = { $gte: minGraduationRate, $lte: maxGraduationRate };
    }

    // Search universities based on the filter
    let results = [];
    switch (trimmedCountry) {
      case 'us':
        results = await USUniversity.find(filter).limit(6); // Limit to 6 results
        break;
      case 'uk':
        results = await UKUniversity.find(filter).limit(6);
        break;
      case 'canada':
        results = await CanadaUniversity.find(filter).limit(6);
        break;
      case 'australia':
        results = await AustraliaUniversity.find(filter).limit(6);
        break;
    }

    res.status(200).json(results);
  } catch (error) {
    console.error('Error processing survey:', error);
    res.status(500).json({ message: 'Error processing survey', error: error.message });
  }
};

module.exports = {
  addUniversity,
  getUniversityById,
  getUniversitiesByCountry,
  deleteUniversityById,
  updateUniversityById,
  searchUniversities,
  findUniversities,
  takeSurvey,
};
