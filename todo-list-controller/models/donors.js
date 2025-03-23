const mongoose = require("mongoose");
const {pacsdb} = require("./connection");
const validator = require('validator');

//* Donor Schema 
const DonorSchema = mongoose.Schema({
  "donorId": {
    type: String,
    required: true,
    trim: true
  },
  "firstName": {
    type: String
  },
  "lastName": {
    type: String
  },
  "email": {
    type: String,
    unique: true,
    trim: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error('Invalid Email Address');
      }
    },
  },
  "registerTS": {
    type: Date,
    default: new Date()
  }
});

module.exports = pacsdb.model("donors", DonorSchema);