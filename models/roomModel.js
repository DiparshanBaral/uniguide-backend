const mongoose = require('mongoose');

// Comment Reply Schema
const replySchema = new mongoose.Schema({
  replyid: { type: String, required: true },
  replycontent: { type: String, required: true },
  replyauthor: {
    name: { type: String, required: true },
    avatar: { type: String, required: true },
  },
  replyupvotes: { type: Number, default: 0 },
  replydownvotes: { type: Number, default: 0 },
  replytimestamp: { type: Date, default: Date.now },
});

// Comment Schema
const commentSchema = new mongoose.Schema({
  commentid: { type: String, required: true },
  commentcontent: { type: String, required: true },
  commentauthor: {
    name: { type: String, required: true },
    avatar: { type: String, required: true },
  },
  commentupvotes: { type: Number, default: 0 },
  commentdownvotes: { type: Number, default: 0 },
  commenttimestamp: { type: Date, default: Date.now },
  commentreplies: [replySchema], default: [] // Nested replies
});

// Post Schema
const postSchema = new mongoose.Schema(
  {
    postid: { type: String, required: true },
    posttitle: { type: String, required: true },
    postdescription: { type: String, required: true },
    postauthor: {
      authorId: { type: String, required: true },
      name: { type: String, required: true },
      avatar: { type: String, required: true },
    },
    upvotes: { type: Number, default: 0 },
    upvotedBy: [{ type: String }],
    comments: [commentSchema], default: []
  },
  { timestamps: true },
);

// Room Schema
const roomSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true },
    posts: [postSchema],
  },
  { timestamps: true },
);

// Use the Users database and name this connection as Room
const db = mongoose.connection.useDb('Users');
const Room = db.model('Room', roomSchema, 'Rooms');

module.exports = { Room };
