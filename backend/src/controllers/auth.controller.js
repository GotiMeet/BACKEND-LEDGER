/**
 * @fileoverview Controllers for user authentication, handling registration, login, and logout.
 * @module controllers/auth.controller
 */
const userModel = require('../models/user.model');
const tokenBlackListModel = require('../models/blackList.model');
const jwt = require('jsonwebtoken');
const emailService = require("../services/email.service");
/**
 * Handles the creation of a new user account, generates an initial session token,
 * and triggers a welcome email.
 * @function userRegisterController
 * @route POST /api/auth/register
 * @access Public
 */
async function userRegisterController(req, res) {
    
    const {email, password, name} = req.body
    
    const isExists = await userModel.findOne({
        email:email
    })
    
    if(isExists)
    {
        return res.status(422).json({
            message: "User already exists with this email.",
            status: failed
        })
    }
        
    const user = await userModel.create({
        email, password,name
    })
        
    const token = jwt.sign({userId: user._id}, process.env.JWT_SECRET, {expiresIn: "3d"});
        
    res.cookie("token", token);
        
    res.status(201).json({
        user:{
            _id:user._id,
            email: user.email,
            name: user.name
        },
        token
    });

    await emailService.sendRegistrationEmail(user.email, user.name);
}

/**
 * Verifies user credentials and issues a new JWT session token upon success.
 * @function userLoginController
 * @route POST /api/auth/login
 * @access Public
 */
async function userLoginController(req, res) {
    const {email, password} = req.body;

    // Password field is excluded by default for security; explicitly select it for verification
    const user = await userModel.findOne({email}).select("+password");

    if(!user)
    {
        return res.status(401).json({
            message: "User doesn't exists"
        });
    }

    const isValidPassword = user.comparePassword(password);

    if(!isValidPassword)
    {
        return res.status(401).json({
            message: "Password is INVALID"
        });
    }

    const token = jwt.sign({userId: user._id}, process.env.JWT_SECRET, {expiresIn: "3d"});
        
    res.cookie("token", token);
        
    res.status(200).json({
        user:{
            _id:user._id,
            email: user.email,
            name: user.name
        },
        token
    })
}

/**
 * Terminates a user session by invalidating the active JWT token and clearing client cookies.
 * @function userLogoutController
 * @route POST /api/auth/logout
 * @access Private
 */
async function userLogoutController(req, res) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token)
    {
        return res.status(401).json({
            message: "You are not logged in"
        })
    }
    
    await tokenBlackListModel.create({
        token: token
    });

    res.clearCookie("token");
    
    res.status(200).json({
        message: "You are logged out successfully."
    });
}

module.exports = {
    userRegisterController, 
    userLoginController,
    userLogoutController
};