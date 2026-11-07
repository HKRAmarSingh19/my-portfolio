import mongoose from 'mongoose';

const replySchema = new mongoose.Schema(
  {
    body: { type: String, required: true, trim: true },
    from: { type: String, required: true, trim: true, lowercase: true },
    to: { type: String, required: true, trim: true, lowercase: true },
    sentAt: { type: Date, default: Date.now },
    gmailMessageId: { type: String, default: null },
  },
  { _id: true }
);

const messageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    subject: {
      type: String,
      default: 'General Inquiry',
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
    },
    // Replies sent through the connected Gmail account are stored here so the
    // admin inbox can show the original inquiry and every response together.
    replies: { type: [replySchema], default: [] },
    read: {
      type: Boolean,
      default: false,
    },
    starred: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model('Message', messageSchema);
export default Message;
