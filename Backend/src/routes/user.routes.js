import { Router } from "express";
import {
  register,
  login,
  getUserHistory,
  addToHistory,
} from "../controllers/user.controller.js";

const router = Router();

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/add_to_history").post(addToHistory);
router.route("/get_user_history").get(getUserHistory);

export default router;
