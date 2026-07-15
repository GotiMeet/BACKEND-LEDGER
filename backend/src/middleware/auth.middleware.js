/**
 * @fileoverview Middleware functions for user authentication and authorization.
 * @module middleware/auth.middleware
 */
const userModel = require('../models/user.model');
const tokenBlackListModel = require('../models/blackList.model');
const jwt = require('jsonwebtoken');

/**
 * Protects routes by requiring a valid, non-blacklisted JWT token.
 * On success, attaches the authenticated user entity to the request object.
 * @function authMiddleware
 */
async function authMiddleware(req, res, next) {
    try{

        const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

        if(!token)
        {
            return res.status(401).json({
                message: "Unauthorized access, token is missing!"
            })
        }

        const isTokenBlacklisted = await tokenBlackListModel.findOne({
            token: token
        });

        if(isTokenBlacklisted)
        {
            return res.status(401).json({
                message: "Unauthorized access, token is invalid!"
            })
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userModel.findById(decodedToken.userId);

        if(!user)
        {
            return res.status(401).json({
                message: "Unauthorized access, token is Invalid!"
            })
        }

        req.user = user;

        return next();

    }catch(error){
        console.error("Error in authentication middleware:", error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
    
}

/**
 * Protects administrative routes by ensuring the requester is an authenticated system user.
 * Combines token validation with role-based access control.
 * @function authSystemUserMiddleware
 */
async function authSystemUserMiddleware(req, res, next){
    try {
        const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

        if(!token)
        {
            return res.status(401).json({
                message: "Unauthorized access, token is missing!"
            })
        }

        const isTokenBlacklisted = await tokenBlackListModel.findOne({
            token: token
        });

        if(isTokenBlacklisted)
        {
            return res.status(401).json({
                message: "Unauthorized access, token is invalid!"
            })
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userModel.findById(decodedToken.userId).select("+systemUser");

        if(!user)
        {
            return res.status(401).json({
                message: "Unauthorized access, token is Invalid!"
            });
        }

        if(!user.systemUser)
        {
            return res.status(403).json({
                message: "Unauthorized access, user is not a system user!"
            });
        }

        req.user = user;

        return next();

    } catch (error) {
        console.error("Error in authentication middleware:", error);
        return res.status(401).json({
           message: "Unauthorized access, token is Invalid!",
        });
    }
    
}

module.exports = {
    authMiddleware,
    authSystemUserMiddleware
};