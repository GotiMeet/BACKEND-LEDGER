/**
 * @fileoverview Defines Express routes for user authentication, including registration, login, and logout.
 * @module routes/auth.routes
 */
const express = require('express');
const authController = require("../controllers/auth.controller");


const router = express.Router()

/**
 * Registers a new user and returns an authentication token.
 * @name POST /api/auth/register
 * @function
 * @memberof module:routes/auth.routes
 */
router.post("/register", authController.userRegisterController);

/**
 * Verifies user credentials and issues a new session token.
 * @name POST /api/auth/login 
 * @function
 * @memberof module:routes/auth.routes
 */
router.post("/login", authController.userLoginController);

/**
 * Terminates a user session by invalidating the active token.
 * @name POST /api/auth/logout 
 * @function
 * @memberof module:routes/auth.routes
 */
router.post("/logout", authController.userLogoutController);


module.exports = router;