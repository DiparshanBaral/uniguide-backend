const mongoose = require('mongoose');
const { Room } = require('../models/roomModel');

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

// Add a comment to a post
exports.addComment = async (req, res) => {
  try {
    const { roomId, postId, commentcontent, commentauthor } = req.body;

    // Validate required fields
    if (!roomId || !postId || !commentcontent || !commentauthor) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    if (!commentauthor.name || !commentauthor.avatar) {
      return res.status(400).json({ message: 'Comment author details are incomplete' });
    }

    // Generate a unique ObjectId for the commentid
    const commentid = new mongoose.Types.ObjectId();

    // Create new comment
    const newComment = {
      commentid: commentid.toString(), // Convert ObjectId to string for consistency
      commentcontent,
      commentauthor: {
        name: commentauthor.name,
        avatar: commentauthor.avatar,
      },
      commentupvotes: 0,
      commentdownvotes: 0,
      commenttimestamp: new Date(),
      commentreplies: [],
    };

    // Add new comment to the post's comments array using $push
    const result = await Room.updateOne(
      { roomId, 'posts.postid': postId },
      { $push: { 'posts.$.comments': newComment } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Room or Post not found' });
    }

    res.status(201).json({ message: 'Comment added successfully', comment: newComment });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Reply to a comment
exports.replyToComment = async (req, res) => {
  try {
    const { roomId, postId, commentid, replycontent, replyauthor } = req.body;

    // Validate required fields
    if (!roomId || !postId || !commentid || !replycontent || !replyauthor) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    if (!replyauthor.name || !replyauthor.avatar) {
      return res.status(400).json({ message: 'Reply author details are incomplete' });
    }

    // Generate a unique ObjectId for the replyid
    const replyid = new mongoose.Types.ObjectId();

    // Create new reply
    const newReply = {
      replyid: replyid.toString(), // Convert ObjectId to string for consistency
      replycontent,
      replyauthor: {
        name: replyauthor.name,
        avatar: replyauthor.avatar,
      },
      replyupvotes: 0,
      replydownvotes: 0,
      replytimestamp: new Date(),
    };

    // Add new reply to the comment's replies array using $push
    const result = await Room.updateOne(
      { roomId, 'posts.postid': postId, 'posts.comments.commentid': commentid },
      { $push: { 'posts.$[post].comments.$[comment].commentreplies': newReply } },
      {
        arrayFilters: [
          { 'post.postid': postId },
          { 'comment.commentid': commentid },
        ],
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Room, Post, or Comment not found' });
    }

    res.status(201).json({ message: 'Reply added successfully', reply: newReply });
  } catch (error) {
    console.error('Error replying to comment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all comments for a post
exports.getCommentsForPost = async (req, res) => {
  try {
    const { roomId, postId } = req.params;

    // Find the room by roomId
    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Find the post by postId
    const post = room.posts.find((post) => post.postid === postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Return the comments for the post
    res.status(200).json({ success: true, data: post.comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Increase upvote count for a post
exports.increaseUpvote = async (req, res) => {
  try {
    const { roomId, postId, userId } = req.body;

    // Validate required fields
    if (!roomId || !postId || !userId) {
      return res.status(400).json({ message: 'Room ID, Post ID, and User ID are required' });
    }

    // Find the room and the post
    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const post = room.posts.find((post) => post.postid === postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if the user has already upvoted
    const alreadyUpvoted = post.upvotedBy.includes(userId);

    if (alreadyUpvoted) {
      // Remove the upvote
      post.upvotedBy = post.upvotedBy.filter((id) => id !== userId);
      post.upvotes = Math.max(0, post.upvotes - 1);
    } else {
      // Add the upvote
      post.upvotedBy.push(userId);
      post.upvotes += 1;
    }

    // Save the updated room
    await room.save();

    res.status(200).json({
      message: alreadyUpvoted ? 'Upvote removed successfully' : 'Upvote added successfully',
      upvotes: post.upvotes,
    });
  } catch (error) {
    console.error('Error toggling upvote:', error.message);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Decrease upvote count for a post
exports.decreaseUpvote = async (req, res) => {
  try {
    const { roomId, postId, userId } = req.body;

    // Validate required fields
    if (!roomId || !postId || !userId) {
      return res.status(400).json({ message: 'Room ID, Post ID, and User ID are required' });
    }

    // Find the room and the post
    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const post = room.posts.find((post) => post.postid === postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if the user has already upvoted
    const alreadyUpvoted = post.upvotedBy.includes(userId);

    if (alreadyUpvoted) {
      // Remove the upvote
      post.upvotedBy = post.upvotedBy.filter((id) => id !== userId);
      post.upvotes = Math.max(0, post.upvotes - 1);

      // Save the updated room
      await room.save();

      return res.status(200).json({
        message: 'Upvote removed successfully',
        upvotes: post.upvotes,
      });
    } else {
      return res.status(400).json({ message: 'User has not upvoted this post' });
    }
  } catch (error) {
    console.error('Error decreasing upvote:', error.message);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
