import express from "express";
import { findAllUsersHandler, getUserHandler, removeUserHandler, updateUserHandler } from "../controllers/UserController"
import { deserializeUser } from "../middleware/DeserializeUser";
import { requireUser } from "../middleware/RequireUser";
import { validate } from "../middleware/Validate";
import { createUserSchema, updateUserSchema } from "../schemas/UserSchema";
import { registerUserHandler } from "../controllers/AuthenticationController";

const router = express.Router();

// Checks existence of user and must require user to be logged to access routes
router.use(deserializeUser, requireUser);

// Get all users
router.get('', findAllUsersHandler);

// Get user from id
router.get('/:id', getUserHandler);

// Create new User
router.post('', validate(createUserSchema), registerUserHandler);

// Update user data: name or email or both
router.put('/:id', validate(updateUserSchema), updateUserHandler);

// Delete user
router.delete('/:id', removeUserHandler);

export default router;