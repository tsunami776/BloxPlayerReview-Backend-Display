const fs = require("fs");

const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const Review = require("../../models/review");
const User = require("../../models/user");
const { transformReview } = require("./merge");


module.exports = {
  getReviews: async () => {
    try {
      const reviews = await Review.find();
      return reviews.map((review) => {
        return transformReview(review);
      });
    } catch (err) {
      throw err;
    }
  },
  getReviewById: async (args, req) => {
    // const placeId = req.params.pid;

    let review;
    try {
      review = await Review.findById(args.getReviewByIdInput.reviewId);
    } catch (err) {
      throw new Error("Something went wrong, could not find a review.");
    }

    if (!review) {
      throw new Error("Could not find review for the provided id.");
    }
    return review;
    // return transformPlace(place);
  },
  getReviewsByUserId: async (args, req) => {
    // let places;
    let userWithReviews;
    try {
      userWithReviews = await User.findById(
        args.getReviewsByUserIdInput.userId
      ).populate("createdReviews");
    } catch (err) {
      throw new Error("Fetching reviews failed, please try again later.");
    }

    // if (!places || places.length === 0) {
    if (!userWithReviews || userWithReviews.createdReviews.length === 0) {
      throw new Error("Could not find reviews for the provided user id.");
    }

    try {
      // return {
      //   ...userWithPlaces.createdPlaces._doc,
      //   _id: userWithPlaces.createdPlaces._id.toString(),
      // };
      return userWithReviews.createdReviews.map((review) => {
        return {
          ...review._doc,
          _id: review._id.toString(),
        };
      });
    } catch {
      throw new Error("Transform error.");
    }
  },
  createReview: async (args, req) => {
    if (!req.isAuth) {
      throw new Error("Unauthenticated! 500");
    }
    // const { title, description, address } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new Error("Invalid inputs passed, please check your data.");
    }

    let user;
    try {
      user = await User.findById(req.userId);
    } catch (err) {
      throw new Error("Creating review failed, please try again.");
    }

    if (!user) {
      throw new Error("Could not find user for provided id.");
    }

    //console.log(user);

    const createdReview = new Review({
      title: args.createReviewInput.title,
      description: args.createReviewInput.description,
      image: args.createReviewInput.image,
      //image: req.file.path,
      creator: user,
    });
    console.log(createdReview);

    try {
      const sess = await mongoose.startSession();
      sess.startTransaction();
      await createdReview.save({ session: sess });
      user.createdReviews.push(createdReview);
      await user.save({ session: sess });
      await sess.commitTransaction();

      return {
        ...createdReview._doc,
        _id: createdReview._id.toString(),
      };
    } catch (err) {
      throw new Error("Creating review failed, please try again.");
    }
  },
  updateReview: async (args, req) => {
    if (!req.isAuth) {
      throw new Error("Unauthenticated!");
    }

    let review;
    try {
      review = await Review.findById(args.updateReviewInput.reviewId);
    } catch (err) {
      throw new Error("Something went wrong, could not update review.");
    }

    if (review.creator.toString() !== req.userId) {
      throw new Error("You are not allowed to edit this review.");
    }

    review.title = args.updateReviewInput.title;
    review.description = args.updateReviewInput.description;

    try {
      await review.save();
      // return transformPlace(place);
      return review;
    } catch (err) {
      throw new Error("Something went wrong, could not update review.");
    }
  },
  deleteReview: async (args, req) => {
    if (!req.isAuth) {
      throw new Error("Unauthenticated!");
    }

    let review;
    try {
      review = await Review.findById(args.deleteReviewInput.reviewId).populate(
        "creator"
      );
    } catch (err) {
      throw new Error("Something went wrong, could not delete review.");
    }

    if (!review) {
      throw new Error("Could not find review for this id.");
    }

    if (review.creator.id !== req.userId) {
      throw new Error("You are not allowed to delete this review.");
    }

    const imagePath = review.image;

    try {
      const sess = await mongoose.startSession();
      sess.startTransaction();
      await review.remove({ session: sess });
      review.creator.createdReviews.pull(review);
      await review.creator.save({ session: sess });
      await sess.commitTransaction();
    } catch (err) {
      throw new Error("Something went wrong, could not delete review.");
    }

    fs.unlink(imagePath, (err) => {
      console.log(err);
    });

    try {
      const reviews = await Review.find();
      // return places.map((place) => {
      //   return transformPlace(place);
      // });
      return reviews;
    } catch (err) {
      throw err;
    }
  },
};
