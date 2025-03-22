const mongoose = require('mongoose');

const discussionRoomSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    participants: { type: Number, default: 0 },
    activity: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'low',
    },
    tags: [{ type: String }],
    joined: { type: Boolean, default: false },
    category: {
      type: String,
      enum: ['general', 'joined', 'your'],
      default: 'general',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true },
);

// Store the model in the Users database
const db = mongoose.connection.useDb('Users');
const DiscussionRoom = db.model('DiscussionRoom', discussionRoomSchema, 'DiscussionRooms');

module.exports = { DiscussionRoom };
