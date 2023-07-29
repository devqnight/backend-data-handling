import express from "express";
import { changePasswordUserHandler, loginUserHandler, logoutHandler, refreshAccessTokenHandler, registerUserHandler } from "../controllers/AuthenticationController";
import { deserializeUser } from "../middleware/DeserializeUser";
import { requireUser } from "../middleware/RequireUser";
import { changePasswordUserSchema, createUserSchema, loginUserSchema } from "../schemas/UserSchema";
import { validate } from "../middleware/Validate";


const router = express.Router();

// Register new user
router.post(
    '/register',
    validate(createUserSchema),
    registerUserHandler
);

// Login user
router.post(
    '/login',
    validate(loginUserSchema),
    loginUserHandler
);

// Logout user
router.get(
    '/logout',
    deserializeUser,
    requireUser,
    logoutHandler
);

// Refresh user token
router.get(
    '/refresh',
    refreshAccessTokenHandler
);

// Reset password for user: must be logged in
router.put('/reset', requireUser, validate(changePasswordUserSchema), changePasswordUserHandler);

export default router;