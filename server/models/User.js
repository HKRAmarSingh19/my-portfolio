import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: 'Admin',
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['admin'],
      default: 'admin',
    },
    // Bumped on logout to invalidate every previously-issued JWT. Lets a
    // leaked/stolen token be killed server-side just by logging in again.
    tokenVersion: {
      type: Number,
      default: 0,
      select: false,
    },
    avatar: {
      type: String,
      // Ships with the client bundle; replaced by an /uploads/... path once the
      // admin uploads their own portrait.
      default: '/profile.jpeg',
    },
    bio: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Sign JWT Token. The secret is required — never fall back to a hardcoded
// default (a public/predictable secret would let anyone forge an admin token).
userSchema.methods.getSignedJwtToken = function () {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set. Add a strong secret to server/.env before starting the server.');
  }
  return jwt.sign(
    { id: this._id, role: this.role, tokenVersion: this.tokenVersion },
    secret,
    {
      expiresIn: process.env.JWT_EXPIRE || '24h',
    }
  );
};

const User = mongoose.model('User', userSchema);
export default User;

