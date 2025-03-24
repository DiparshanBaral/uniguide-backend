const mongoose = require('mongoose');
const { Room } = require('../models/roomModel');
const { Student } = require('../models/studentModel');
const { Mentor } = require('../models/mentorModel');

// Get all posts sorted by upvotes (highest to lowest)
exports.getAllPostsWithHighestUpvotes = async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    const sortedPosts = room.posts.sort((a, b) => b.upvotes - a.upvotes);
    res.status(200).json({ success: true, data: sortedPosts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all posts sorted by timestamp (most recent to least recent)
exports.getAllRecentPosts = async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    const sortedPosts = room.posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.status(200).json({ success: true, data: sortedPosts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get posts by author ID using query parameters
exports.getPostsByAuthorId = async (req, res) => {
  try {
    const { roomId } = req.params; // Extract roomId from URL parameters
    const { authorId } = req.query; // Extract authorId from query parameters

    // Find the room by roomId
    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Filter posts by postauthor.authorId
    const postsByAuthor = room.posts.filter((post) => post.postauthor.authorId === authorId);

    // Return the filtered posts (can be an empty array if no posts are found)
    res.status(200).json({ success: true, data: postsByAuthor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new post
exports.createPost = async (req, res) => {
  try {
    const { roomId, posttitle, postdescription, postauthor } = req.body;

    // Validate required fields
    if (!roomId || !posttitle || !postdescription || !postauthor) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    if (!postauthor.authorId || !postauthor.name || !postauthor.avatar) {
      return res.status(400).json({ message: 'Post author details are incomplete' });
    }

    // Generate a unique ObjectId for the postid
    const postid = new mongoose.Types.ObjectId();

    // Create new post
    const newPost = {
      postid: postid.toString(), // Convert ObjectId to string for consistency
      posttitle,
      postdescription,
      postauthor: {
        authorId: postauthor.authorId,
        name: postauthor.name,
        avatar: postauthor.avatar,
      },
      upvotes: 0,
      downvotes: 0,
      comments: [],
    };

    // Add new post to the room's posts array using $push
    const result = await Room.updateOne(
      { roomId },
      { $push: { posts: newPost } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.status(201).json({ message: 'Post created successfully', post: newPost });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update a post
exports.updatePost = async (req, res) => {
  try {
    const { roomId, postId, posttitle, postdescription } = req.body;

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    const post = room.posts.find((post) => post.postid === postId);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    post.posttitle = posttitle || post.posttitle;
    post.postdescription = postdescription || post.postdescription;

    await room.save();

    res.status(200).json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a post
exports.deletePost = async (req, res) => {
  try {
    const { roomId, postId } = req.body;

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    const postIndex = room.posts.findIndex((post) => post.postid === postId);

    if (postIndex === -1) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    room.posts.splice(postIndex, 1);
    await room.save();

    res.status(200).json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
