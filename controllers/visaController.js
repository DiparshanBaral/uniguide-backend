const mongoose = require('mongoose');
const { Visa } = require('../models/visaModel');

// 1. Get all visa experiences
exports.getAllVisaExperiences = async (req, res) => {
  try {
    const visas = await Visa.find({}, 'country flag experiences');
    const allExperiences = visas.flatMap((visa) =>
      visa.experiences.map((exp) => ({
        country: visa.country,
        flag: visa.flag,
        title: exp.title,
        excerpt: exp.excerpt,
        authorName: exp.author.name,
        avatar: exp.author.avatar,
        date: exp.date,
      }))
    );
    res.status(200).json(allExperiences);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching visa experiences', error });
  }
};

// 2. Post a new visa experience
exports.postVisaExperience = async (req, res) => {
    try {
      const { country, title, excerpt, author, flag } = req.body;
  
      // Validate required fields
      if (!country || !title || !excerpt || !author.authorId || !author.name || !author.avatar || !flag) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
  
      // Generate a unique ObjectId for the postid
      const postid = new mongoose.Types.ObjectId().toString();
  
      // Find the visa by country or create a new one if it doesn't exist
      let visa = await Visa.findOne({ country });
      
      if (!visa) {
        // Create a new visa document if none exists for this country
        visa = new Visa({
          country,
          flag,
          experiences: []
        });
      }
  
      // Create the new experience
      const newExperience = {
        postid,
        title,
        excerpt,
        author,
        country,
        flag,
        date: new Date()
      };
  
      // Add the experience to the visa document
      visa.experiences.push(newExperience);
  
      // Save the updated visa document
      await visa.save();
  
      res.status(201).json({ 
        message: 'Visa experience added successfully',
        experience: newExperience 
      });
      
    } catch (error) {
      console.error('Error posting visa experience:', error);
      res.status(500).json({ message: 'Error posting visa experience', error: error.message });
    }
  };

// Update a visa experience
exports.updateVisaExperience = async (req, res) => {
    try {
      const { country, postid, title, excerpt, authorId } = req.body;
  
      // Validate required fields
      if (!country || !postid || !title || !excerpt || !authorId) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
  
      // Find the visa by country
      const visa = await Visa.findOne({ country });
      if (!visa) {
        return res.status(404).json({ message: 'Visa not found for the specified country' });
      }
  
      // Find the experience by postid
      const experienceIndex = visa.experiences.findIndex(exp => exp.postid === postid);
      if (experienceIndex === -1) {
        return res.status(404).json({ message: 'Experience not found' });
      }
  
      // Verify that the requesting user is the author
      if (visa.experiences[experienceIndex].author.authorId !== authorId) {
        return res.status(403).json({ message: 'You are not authorized to update this experience' });
      }
  
      // Update the experience
      visa.experiences[experienceIndex].title = title;
      visa.experiences[experienceIndex].excerpt = excerpt;
      
      // Save the updated visa document
      await visa.save();
  
      res.status(200).json({ 
        message: 'Visa experience updated successfully',
        experience: visa.experiences[experienceIndex]
      });
      
    } catch (error) {
      console.error('Error updating visa experience:', error);
      res.status(500).json({ message: 'Error updating visa experience', error: error.message });
    }
  };

// 4. Delete a visa experience
exports.deleteVisaExperience = async (req, res) => {
  try {
    const { country, postid } = req.body;

    // Find the visa by country
    const visa = await Visa.findOne({ country });

    if (!visa) {
      return res.status(404).json({ message: 'Visa not found for the specified country' });
    }

    // Find the index of the experience by postid
    const experienceIndex = visa.experiences.findIndex((exp) => exp.postid === postid);

    if (experienceIndex === -1) {
      return res.status(404).json({ message: 'Experience not found' });
    }

    // Remove the experience from the array
    visa.experiences.splice(experienceIndex, 1);
    await visa.save();

    res.status(200).json({ message: 'Experience deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting experience', error });
  }
};

// 5. Get an author's posts
exports.getAuthorPosts = async (req, res) => {
  try {
    const { authorId } = req.params;

    const visas = await Visa.find({}, 'country flag experiences');
    const authorPosts = visas.flatMap((visa) =>
      visa.experiences
        .filter((exp) => exp.author.authorId === authorId)
        .map((exp) => ({
          country: visa.country,
          flag: visa.flag,
          title: exp.title,
          excerpt: exp.excerpt,
          authorName: exp.author.name,
          avatar: exp.author.avatar,
          date: exp.date,
        }))
    );

    res.status(200).json(authorPosts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching author posts', error });
  }
};

// 6. Get recent visa experiences sorted by date
exports.getRecentExperiences = async (req, res) => {
  try {
    // Get limit from query params or default to 10
    const limit = parseInt(req.query.limit) || 10;
    
    // Find all visas and their experiences
    const visas = await Visa.find({}, 'country flag experiences');
    
    // Extract all experiences from all visas into a flat array
    let allExperiences = visas.flatMap((visa) =>
      visa.experiences.map((exp) => ({
        postid: exp.postid,
        country: visa.country,
        flag: visa.flag,
        title: exp.title,
        excerpt: exp.excerpt,
        authorName: exp.author.name,
        authorId: exp.author.authorId,
        avatar: exp.author.avatar,
        date: exp.date,
        likes: exp.likes
      }))
    );
    
    // Sort experiences by date (newest first)
    allExperiences.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Limit the number of results
    const recentExperiences = allExperiences.slice(0, limit);
    
    res.status(200).json(recentExperiences);
  } catch (error) {
    console.error('Error fetching recent experiences:', error);
    res.status(500).json({ message: 'Error fetching recent experiences', error: error.message });
  }
};

// 7. Toggle like on a visa experience
exports.toggleLike = async (req, res) => {
  try {
    const { country, postid } = req.body;
    
    // Validate required fields
    if (!country || !postid) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Find the visa by country
    const visa = await Visa.findOne({ country });
    if (!visa) {
      return res.status(404).json({ message: 'Visa not found for the specified country' });
    }
    
    // Find the experience by postid
    const experienceIndex = visa.experiences.findIndex(exp => exp.postid === postid);
    if (experienceIndex === -1) {
      return res.status(404).json({ message: 'Experience not found' });
    }
    
    // Increment the likes count by 1
    visa.experiences[experienceIndex].likes = (visa.experiences[experienceIndex].likes || 0) + 1;
    
    // Save the updated visa document
    await visa.save();
    
    // Return the updated likes count
    res.status(200).json({ 
      message: 'Post liked successfully',
      likes: visa.experiences[experienceIndex].likes
    });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ message: 'Error liking post', error: error.message });
  }
};