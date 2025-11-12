const Listing = require("../models/listing");

// module.exports.index = async (req, res) => {
//   const allListings = await Listing.find({});
//   res.render("listings/index.ejs", { allListings });
// };
module.exports.index = async (req, res) => {
  const { category } = req.query; 
  let allListings;

  if (category) {
    allListings = await Listing.find({ category });
  } else {
    allListings = await Listing.find({});
  }
  res.render("listings/index.ejs", { allListings, selectedCategory: category || null  });
};


module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
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
};


module.exports.searchListings = async (req, res) => {
  const query = req.query.q?.trim(); 

  if (!query) {
    return res.redirect("/listings");
  }


  const listings = await Listing.find({
    $or: [
      { title: { $regex: query, $options: "i" } },
      { location: { $regex: query, $options: "i" } },
      { category: { $regex: query, $options: "i" } }
    ]
  });

  
  if (listings.length === 0) {
    return res.render("listings/index", {
      allListings: [],
      message: `No results found for "${query}". Try a different keyword!`
    });
  }


  res.render("listings/index", {
    allListings: listings,
    message: `Search results for "${query}"`
  });
};


module.exports.createListing = async (req, res) => {
    let url = req.file.path;
    let filename = req.file.filename;

    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = {url, filename};
    await newListing.save();
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if(!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    res.redirect("/listings");
  }

  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  

  listing.title = req.body.listing.title;
  listing.description = req.body.listing.description;
  listing.price = req.body.listing.price;
  listing.country = req.body.listing.country;
  listing.location = req.body.listing.location;

if ( req.file) {
      const url = req.file.path;
      const filename = req.file.filename;
      listing.image = { url, filename};
  
  }
  await listing.save();
  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};

module.exports.listByCategory = async (req, res) => {
  const { categoryName } = req.params;
  const allListings = await Listing.find({ category: categoryName });
  if (!allListings.length) {
    req.flash("error", `No listings found for category: ${categoryName}`);
    return res.redirect("/listings");
  }
  res.render("listings/index", { allListings, selectedCategory: categoryName });
};

