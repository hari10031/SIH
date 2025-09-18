import mongoose from 'mongoose';

const uploadSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userPhoneNumber: {
    type: String,
    required: true,
    match: /^[+]?[0-9]{10,15}$/
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  imagePath: {
    type: String,
    required: true
  },
  originalImageName: {
    type: String,
    required: true
  },
  imageSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true,
    enum: ['image/jpeg', 'image/png', 'image/jpg', 'image/heic', 'image/webp']
  },
  location: {
    latitude: {
      type: Number,
      required: function() {
        return this.locationType === 'manual' || this.locationType === 'automatic';
      },
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: function() {
        return this.locationType === 'manual' || this.locationType === 'automatic';
      },
      min: -180,
      max: 180
    },
    accuracy: {
      type: Number,
      default: null
    },
    address: {
      type: String,
      default: ''
    }
  },
  locationType: {
    type: String,
    enum: ['automatic', 'manual', 'none'],
    default: 'none',
    required: true
  },
  imageSource: {
    type: String,
    enum: ['camera', 'gallery'],
    required: true
  },
  voiceNotePath: {
    type: String,
    default: null
  },
  voiceNoteDuration: {
    type: Number,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'processed', 'failed'],
    default: 'pending'
  },
  metadata: {
    deviceInfo: {
      type: String,
      default: ''
    },
    appVersion: {
      type: String,
      default: ''
    },
    uploadMethod: {
      type: String,
      enum: ['mobile', 'web'],
      default: 'mobile'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
uploadSchema.index({ userId: 1, createdAt: -1 });
uploadSchema.index({ userPhoneNumber: 1, createdAt: -1 });
uploadSchema.index({ status: 1 });
uploadSchema.index({ locationType: 1 });
uploadSchema.index({ imageSource: 1 });

// Virtual for formatted location
uploadSchema.virtual('formattedLocation').get(function() {
  if (this.location && this.location.latitude && this.location.longitude) {
    return {
      coordinates: [this.location.longitude, this.location.latitude],
      accuracy: this.location.accuracy,
      address: this.location.address || 'Address not available'
    };
  }
  return null;
});

// Static method to find uploads by user phone number
uploadSchema.statics.findByUserPhone = function(phoneNumber, limit = 20, skip = 0) {
  return this.find({ userPhoneNumber: phoneNumber })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('userId', 'name email phonenumber');
};

// Static method to find uploads by location range
uploadSchema.statics.findByLocationRange = function(latitude, longitude, radiusKm = 10) {
  const radiusInRadians = radiusKm / 6371; // Earth's radius in km
  
  return this.find({
    'location.latitude': {
      $gte: latitude - radiusInRadians,
      $lte: latitude + radiusInRadians
    },
    'location.longitude': {
      $gte: longitude - radiusInRadians,
      $lte: longitude + radiusInRadians
    }
  }).sort({ createdAt: -1 });
};

// Instance method to update status
uploadSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  return this.save();
};

// Pre-save middleware to ensure data consistency
uploadSchema.pre('save', function(next) {
  // If imageSource is camera, locationType should be automatic (if location provided)
  if (this.imageSource === 'camera' && this.location.latitude && this.location.longitude) {
    this.locationType = 'automatic';
  }
  
  // If imageSource is gallery and location is provided manually
  if (this.imageSource === 'gallery' && this.location.latitude && this.location.longitude) {
    if (!this.locationType || this.locationType === 'none') {
      this.locationType = 'manual';
    }
  }
  
  next();
});

const Upload = mongoose.model('Upload', uploadSchema);

export default Upload;