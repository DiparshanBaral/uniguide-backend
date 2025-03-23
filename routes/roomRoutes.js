const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { protect } = require('../middleware/authMiddleware');


// Get all posts sorted by upvotes
router.get('/posts/popular/:roomId', protect, roomController.getAllPostsWithHighestUpvotes);

// Get all posts sorted by timestamp
router.get('/posts/recent/:roomId', protect, roomController.getAllRecentPosts);

// Get posts by author ID
router.get('/yourposts/:roomId', protect, roomController.getPostsByAuthorId);

// Create a new post
router.post('/create/post', protect, roomController.createPost);

// Update a post
router.put('/update/post', protect, roomController.updatePost);

// Delete a post
router.delete('/delete/post', protect, roomController.deletePost);

module.exports = router;