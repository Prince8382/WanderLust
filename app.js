const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const multer = require("multer");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema } = require("./schema.js");


                                      
const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
main()
.then(() => console.log("Connected to DB"))
.catch((err) => console.log(err));
async function main() { 
  await mongoose.connect(MONGO_URL); }

                                       // EJS setup
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

                                      // Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

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

//Route
app.get("/", (req, res) => res.send("Hii, I am root"));

const validateListing = (req, res, next) => {
  const { error } = listingSchema.validate(req.body);
  if (error) {
    const msg = error.details.map(el => el.message).join(",");
    throw new ExpressError(400, msg);
  } else {
    next();
  }
};


// Index Route
app.get("/listings", wrapAsync(async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
}));

// New Route
app.get("/listings/new", (req, res) => {
  res.render("listings/new.ejs");
});

//// Create Route
// app.post("/listings", 
//   wrapAsync(async (req, res, next) => {
//     const newListing = new Listing(req.body.listing);
//     await newListing.save();
//     res.redirect("/listings");
//   })
// );
app.post(
  "/listings",
  upload.none(),        // because form uses multipart/form-data
  validateListing,     // validate after multer
  wrapAsync(async (req, res) => {
    const newListing = new Listing(req.body.listing);
    await newListing.save();
    res.redirect("/listings");
  })
);


// Show Route
app.get("/listings/:id", validateListing, wrapAsync(async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/show.ejs", { listing });
}));

// Edit Route
app.get("/listings/:id/edit", validateListing, wrapAsync(async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/edit.ejs", { listing });
}));

// Update Route 
app.put("/listings/:id", validateListing, upload.single("image"), wrapAsync(async (req, res) => {
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
  res.redirect(`/listings/${id}`);
}));


// DELETE Route
app.delete("/listings/:id", wrapAsync(async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndDelete(id);
  res.redirect("/listings");
}));

 //Error handling 
 app.all(/(.*)/, (req, res, next) => {
  next(new ExpressError(404, "Page Not Found!"));
 });
 app.use((err, req, res, next) => {
  let {statusCode = 500, message ="Something went wrong!"} = err;
  res.status(statusCode).send(message);
 });

app.listen(8080, () => {
  console.log("server is listening to port 8080")
});