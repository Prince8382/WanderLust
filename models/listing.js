const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const listingSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, trim: true },
  image: {
    filename: String,
    url: {
      type: String,
      default: "https://www.istockphoto.com/photo/maldives-island-gm1442179368-481642124"
    }
  },
  price: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  location: String,
  country: String
});


const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;


