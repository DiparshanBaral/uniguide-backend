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

// Add a comment to a post
router.post('/add/comment', protect, roomController.addComment);

// Reply to a comment
router.post('/reply/comment', protect, roomController.replyToComment);

// Get all comments for a post
router.get('/comments/:roomId/:postId', protect, roomController.getCommentsForPost);

// Increase upvote count
router.post('/post/upvote', protect, roomController.increaseUpvote);

// Decrease the upvote count
router.post('/post/downvote', protect, roomController.decreaseUpvote);

module.exports = router;