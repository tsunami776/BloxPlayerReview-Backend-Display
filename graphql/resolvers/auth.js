const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../../models/user");
const { transformUser } = require("./merge");

module.exports = {
  getUsers: async (args, req) => {
    let users;
    try {
      users = await User.find({}, "-password");
      return users.map((user) => {
        return transformUser(user);
      });
    } catch (err) {
      throw new Error("Fetching users failed, please try again later.");
    }
  },
  createUser: async (args, req) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new Error("Invalid inputs passed, please check your data.");
    }

    try {
      const existingUser = await User.findOne({ email: args.userInput.email });
      if (existingUser) {
        throw new Error("User exists already.");
      }
      const hashedPassword = await bcrypt.hash(args.userInput.password, 12);

      const user = new User({
        name: args.userInput.name,
        email: args.userInput.email,
        password: hashedPassword,
        image: args.userInput.image,
        //image: req.file.path,
        createdReviews: [],
        createdPlaces: [],
        createdEvents: [],
        createdPosts: [],
      });

      const result = await user.save();

      return { ...result._doc, password: null, _id: result.id };
    } catch (err) {
      throw err;
    }
  },
  login: async ({ email, password }) => {
    const user = await User.findOne({ email: email });
    if (!user) {
      throw new Error("User does not exist!");
    }
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      throw new Error("Password is incorrect!");
    }
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_KEY,
      {
        expiresIn: "1h",
      }
    );
    return {
      userId: user.id,
      email: user.email,
      token: token,
      tokenExpiration: 1,
    };
  },
};
