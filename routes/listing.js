const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const multer = require("multer");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");


                                      // Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "public/uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Index Route
router.get("/", wrapAsync(async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
}));

// New Route
router.get("/new", isLoggedIn,(req, res) => {
  res.render("listings/new.ejs");
});

// Create Route
router.post(
  "/",
  isLoggedIn,
  upload.none(),        // because form uses multipart/form-data
  validateListing,     // validate after multer
  wrapAsync(async (req, res) => {
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    await newListing.save();
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
  })
);

// Show Route
router.get("/:id", validateListing, wrapAsync(async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");
  if(!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    res.redirect("/listings");
  }
  res.render("listings/show.ejs", { listing });
}));

// Edit Route
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if(!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    res.redirect("/listings");
  }
  res.render("listings/edit.ejs", { listing });
}));


// Update Route 
router.put("/:id", isLoggedIn, isOwner, validateListing, upload.single("image"), wrapAsync(async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  

  listing.title = req.body.listing.title;
  listing.description = req.body.listing.description;
  listing.price = req.body.listing.price;
  listing.country = req.body.listing.country;
  listing.location = req.body.listing.location;

if (req.file) {
  listing.image = {
    filename: req.file.filename,
    url: `/uploads/${req.file.filename}`,
  };
}
  await listing.save();
  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
}));

// DELETE Route
router.delete("/:id", isLoggedIn, isOwner, wrapAsync(async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
})
);

module.exports = router;