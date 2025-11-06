const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Global options for business schema
const GlobalOptions = {
  departments: {
    'Agriculture': ['Crop Production', 'Livestock', 'Aquaculture'],
    'Food Processing': ['Dairy', 'Meat Processing', 'Grain Milling'],
    'Distribution': ['Wholesale', 'Retail', 'Logistics']
  },
  employeesRange: [0, 1, 2, 3, 4, 5, 10, 20, 50, 100, 200, 500, 1000],
  businessStatuses: ['active', 'inactive', 'pending', 'suspended'],
  days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
};

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    trim: true
  },
  // Farmer specific fields
  farmSize: {
    type: Number,
    default: 0
  },
  mainCrops: {
    type: String,
    trim: true
  },
  // Retailer specific fields
  storeLocation: {
    type: String,
    trim: true
  },
  businessType: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  business: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Business' 
  }
});
const BusinessSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  email: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  department: { type: String, required: true, enum: Object.keys(GlobalOptions.departments) },
  subDepartment: { type: String, required: true, enum: [].concat(...Object.values(GlobalOptions.departments)) },
  logo: { type: String, default: null },
  address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
  },
  phone: { type: String, required: true },
  socialMedia: {
      facebook: { type: String, default: "" },
      twitter: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      instagram: { type: String, default: "" },
  },
  website: { type: String, default: "" },
  description: { type: String, default: "" },
  creationYear: { type: Number, required: true },
  registrationNumber: { type: String, required: true },
  taxId: { type: String, required: true },
  annualRevenue: { type: Number, default: 0 },
  currency: { type: String, default: "USD" },
  numberOfEmployees: {
      type: Number,
      enum: GlobalOptions.employeesRange,
      default: 0
  },
  documents: {
      certificate: { type: String, default: null },
      license: { type: String, default: null },
  },
  status: {
      type: String,
      enum: GlobalOptions.businessStatuses,
      required: true
  },
  openingHours: {
      type: [
          {
              day: {
                  type: String,
                  required: true,
                  enum: GlobalOptions.days,
              },
              open: {
                  type: String,
                  default: null,
              },
              close: {
                  type: String,
                  default: null,
              },
              isOpen: {
                  type: Boolean,
                  default: false,
              },
          },
      ],
      default: [
          { day: "monday", open: null, close: null, isOpen: false },
          { day: "tuesday", open: null, close: null, isOpen: false },
          { day: "wednesday", open: null, close: null, isOpen: false },
          { day: "thursday", open: null, close: null, isOpen: false },
          { day: "friday", open: null, close: null, isOpen: false },
          { day: "saturday", open: null, close: null, isOpen: false },
          { day: "sunday", open: null, close: null, isOpen: false },
      ],
  },
  location: { type: [Number], default: [0, 0] },
  isActive: {
      type: Boolean,
      default: false,
  },
  isActiveAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },


  users: [{
      user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
      },
      permissions: [{
          type: String,
      }]
  }]
});

const Business = mongoose.model("Business", BusinessSchema);
// Encrypt password using bcrypt
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
module.exports.Business = Business;
