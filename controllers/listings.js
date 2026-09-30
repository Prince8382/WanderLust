const Listing = require("../models/listing");

module.exports.index = async (req, res) => {
  const { category } = req.query;

  let filter = {};

  if (category) {
    filter.category = category.toLowerCase();
  }

  const allListings = await Listing.find(filter);

  res.render("listings/index.ejs", {
    allListings: allListings || [],
    selectedCategory: category || null,
    message:
      allListings.length === 0
        ? "No listings found in this category"
        : undefined,
  });
};

// NEW FORM
module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

// SHOW SINGLE LISTING
module.exports.showListing = async (req, res) => {
  const { id } = req.params;

  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: { path: "author" },
    })
    .populate("owner");

  if (!listing) {
    req.flash("error", "Listing you requested does not exist!");
    return res.redirect("/listings");
  }

  res.render("listings/show.ejs", { listing });
};

// SEARCH LISTINGS
module.exports.searchListings = async (req, res) => {
  const query = req.query.q?.trim();

  if (!query) return res.redirect("/listings");

  const listings = await Listing.find({
    $or: [
      { title: { $regex: query, $options: "i" } },
      { location: { $regex: query, $options: "i" } },
      { category: { $regex: query, $options: "i" } },
    ],
  });

  res.render("listings/index", {
    allListings: listings,
    message:
      listings.length === 0
        ? `No results found for "${query}"`
        : `Search results for "${query}"`,
  });
};

// CREATE LISTING
module.exports.createListing = async (req, res) => {
  const url = req.file.path;
  const filename = req.file.filename;

  const newListing = new Listing(req.body.listing);
  newListing.category = req.body.listing.category.toLowerCase();
  newListing.owner = req.user._id;
  newListing.image = { url, filename };

  await newListing.save();

  req.flash("success", "New Listing Created!");
  res.redirect("/listings");
};

// EDIT FORM
module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;

  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }

  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");

  res.render("listings/edit.ejs", {
    listing,
    originalImageUrl,
  });
};

// UPDATE LISTING
module.exports.updateListing = async (req, res) => {
  const { id } = req.params;

  const listing = await Listing.findById(id);

  listing.title = req.body.listing.title;
  listing.description = req.body.listing.description;
  listing.price = req.body.listing.price;
  listing.country = req.body.listing.country;
  listing.location = req.body.listing.location;
  listing.category = req.body.listing.category.toLowerCase();

  if (req.file) {
    listing.image = {
      url: req.file.path,
      filename: req.file.filename,
    };
  }

  await listing.save();

  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};

// DELETE LISTING
module.exports.destroyListing = async (req, res) => {
  const { id } = req.params;

  await Listing.findByIdAndDelete(id);

  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};
