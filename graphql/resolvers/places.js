const fs = require("fs");

const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const getCoordsForAddress = require("../../util/location");
const Place = require("../../models/place");
const User = require("../../models/user");
const { transformPlace } = require("./merge");


module.exports = {
  getPlaces: async () => {
    try {
      const places = await Place.find();
      return places.map((place) => {
        return transformPlace(place);
      });
    } catch (err) {
      throw err;
    }
  },
  getPlaceById: async (args, req) => {
    // const placeId = req.params.pid;

    let place;
    try {
      place = await Place.findById(args.getPlaceByIdInput.placeId);
    } catch (err) {
      throw new Error("Something went wrong, could not find a place.");
    }

    if (!place) {
      throw new Error("Could not find place for the provided id.");
    }
    return place;
    // return transformPlace(place);
  },
  getPlacesByUserId: async (args, req) => {
    // let places;
    let userWithPlaces;
    try {
      userWithPlaces = await User.findById(
        args.getPlacesByUserIdInput.userId
      ).populate("createdPlaces");
    } catch (err) {
      throw new Error("Fetching places failed, please try again later.");
    }

    // if (!places || places.length === 0) {
    if (!userWithPlaces || userWithPlaces.createdPlaces.length === 0) {
      throw new Error("Could not find places for the provided user id.");
    }

    try {
      // return {
      //   ...userWithPlaces.createdPlaces._doc,
      //   _id: userWithPlaces.createdPlaces._id.toString(),
      // };
      return userWithPlaces.createdPlaces.map((place) => {
        return {
          ...place._doc,
          _id: place._id.toString(),
        };
      });
    } catch {
      throw new Error("Transform error.");
    }
  },
  createPlace: async (args, req) => {
    if (!req.isAuth) {
      throw new Error("Unauthenticated! 500");
    }
    // const { title, description, address } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new Error("Invalid inputs passed, please check your data.");
    }

    let coordinates;
    try {
      coordinates = await getCoordsForAddress(args.createPlaceInput.address);
    } catch (error) {
      throw error;
    }

    let user;
    try {
      user = await User.findById(req.userId);
    } catch (err) {
      throw new Error("Creating place failed, please try again.");
    }

    if (!user) {
      throw new Error("Could not find user for provided id.");
    }

    //console.log(user);

    const createdPlace = new Place({
      title: args.createPlaceInput.title,
      description: args.createPlaceInput.description,
      address: args.createPlaceInput.address,
      location: coordinates,
      image: args.createPlaceInput.image,
      //image: req.file.path,
      creator: user,
    });
    console.log(createdPlace);

    //let result = transformPlace(createdPlace);

    try {
      const sess = await mongoose.startSession();
      sess.startTransaction();
      await createdPlace.save({ session: sess });
      user.createdPlaces.push(createdPlace);
      await user.save({ session: sess });
      await sess.commitTransaction();

      return {
        ...createdPlace._doc,
        _id: createdPlace._id.toString(),
      };
    } catch (err) {
      throw new Error("Creating place failed, please try again.");
    }
  },
  updatePlace: async (args, req) => {
    if (!req.isAuth) {
      throw new Error("Unauthenticated!");
    }
    // const { title, description } = req.body;
    // const placeId = req.params.pid;

    let place;
    try {
      place = await Place.findById(args.updatePlaceInput.placeId);
    } catch (err) {
      throw new Error("Something went wrong, could not update place.");
    }

    if (place.creator.toString() !== req.userId) {
      throw new Error("You are not allowed to edit this place.");
    }

    place.title = args.updatePlaceInput.title;
    place.description = args.updatePlaceInput.description;

    try {
      await place.save();
      // return transformPlace(place);
      return place;
    } catch (err) {
      throw new Error("Something went wrong, could not update place.");
    }
  },
  deletePlace: async (args, req) => {
    if (!req.isAuth) {
      throw new Error("Unauthenticated!");
    }
    // const placeId = req.params.pid;

    let place;
    try {
      place = await Place.findById(args.deletePlaceInput.placeId).populate(
        "creator"
      );
    } catch (err) {
      throw new Error("Something went wrong, could not delete place.");
    }

    if (!place) {
      throw new Error("Could not find place for this id.");
    }

    if (place.creator.id !== req.userId) {
      throw new Error("You are not allowed to delete this place.");
    }

    const imagePath = place.image;

    try {
      const sess = await mongoose.startSession();
      sess.startTransaction();
      await place.remove({ session: sess });
      place.creator.createdPlaces.pull(place);
      await place.creator.save({ session: sess });
      await sess.commitTransaction();
    } catch (err) {
      throw new Error("Something went wrong, could not delete place.");
    }

    fs.unlink(imagePath, (err) => {
      console.log(err);
    });

    try {
      const places = await Place.find();
      // return places.map((place) => {
      //   return transformPlace(place);
      // });
      return places;
    } catch (err) {
      throw err;
    }
  },
};
