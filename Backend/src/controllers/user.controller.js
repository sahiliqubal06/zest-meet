import bcrypt from "bcrypt";
import crypto from "crypto";
import httpStatus from "http-status";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Meeting } from "../models/meeting.model.js";

const register = asyncHandler(async (req, res, next) => {
  try {
    const { name, username, password } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res
        .status(httpStatus.CONFLICT)
        .json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      username,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(httpStatus.CREATED).json({ message: "User Registered" });
  } catch (error) {
    next(error);
  }
});

const login = asyncHandler(async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      message: "Please provide valid credentials",
    });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "User not found",
      });
    }

    const isPasswordMatched = await bcrypt.compare(password, user.password);

    if (isPasswordMatched) {
      const token = crypto.randomBytes(20).toString("hex");

      user.token = token;
      await user.save();

      return res.status(httpStatus.OK).json({
        message: "Login Successfully",
        token,
      });
    } else {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Invalid password",
      });
    }
  } catch (error) {
    next(error);
  }
});

const getUserHistory = asyncHandler(async (req, res, next) => {
  const { token } = req.query;

  try {
    const user = await User.findOne({ token: token });
    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "User not found",
      });
    }

    const meetings = await Meeting.find({ user_id: user.username });
    res.status(httpStatus.OK).json(meetings);
  } catch (error) {
    next(error);
  }
});

const addToHistory = asyncHandler(async (req, res, next) => {
  const { token, meeting_code } = req.body;

  try {
    const user = await User.findOne({ token: token });
    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "User not found",
      });
    }

    const newMeeting = new Meeting({
      user_id: user.username,
      meetingCode: meeting_code,
    });

    await newMeeting.save();
    res.status(httpStatus.CREATED).json({
      message: "Added code to history",
    });
  } catch (error) {
    next(error);
  }
});

export { register, login, getUserHistory, addToHistory };
