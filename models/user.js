const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  image: { type: String, required: false },
  createdReviews: [
    { type: Schema.Types.ObjectId, ref: "Review" },
  ],
  createdPlaces: [
    { type: Schema.Types.ObjectId, ref: "Place" },
  ],
  createdEvents: [{ type: Schema.Types.ObjectId, ref: "Event" }],
  createdPosts: [{ type: Schema.Types.ObjectId, ref: "Post" }],
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
