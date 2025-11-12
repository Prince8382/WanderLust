//const { ref } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const listingSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, trim: true },
  image: {
    // filename: String,
    // url: {
    //   type: String,
    //   default: "https://www.istockphoto.com/photo/maldives-island-gm1442179368-481642124"
    // }
    url: String,
    filename: String,
  },
  price: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  location: String,
  country: String,

  category: {
    type: String,
    enum: ["trending", "rooms", "castles", "pools", "cities", "mountain", "camping", "farms", "arctic", "domes", "boats"],
    default: "trending"
  },

  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

listingSchema.post("findOneAndDelete", async (listing) => {
  if(listing) {
    await Review.deleteMany({_id: {$in: listing.reviews} });
  }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;


