import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(email) {
        // Email is optional, but if provided, must be valid
        if (!email) return true;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Please enter a valid email address'
    }
  },
  phonenumber: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    validate: {
      validator: function(phone) {
        return /^[+]?[0-9]{10,15}$/.test(phone);
      },
      message: 'Please enter a valid phone number'
    }
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
// userSchema.index({ phonenumber: 1 }); // Removed to avoid duplicate index
userSchema.index({ email: 1 });

// Pre-save middleware to update the updatedAt field
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLoginAt = Date.now();
  return this.save();
};

// Static method to find user by phone number
userSchema.statics.findByPhoneNumber = function(phonenumber) {
  return this.findOne({ phonenumber });
};

// Static method to find verified user by phone number
userSchema.statics.findVerifiedUser = function(phonenumber) {
  return this.findOne({ phonenumber, isPhoneVerified: true, isActive: true });
};

// Transform the output to remove sensitive data
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.__v;
  return user;
};

const User = mongoose.model('User', userSchema);

export default User;