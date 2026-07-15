/**
 * @fileoverview Database configuration and initialization module.
 * 
 * BUSINESS PURPOSE:
 * Establishes the connection to the MongoDB cluster. The entire application depends 
 * on this connection to persist user accounts, ledger entries, and transaction records securely.
 * Without a successful connection, the backend cannot guarantee financial consistency 
 * and must not accept incoming requests.
 * 
 * @module config/db
 */
const mongoose = require("mongoose")

/**
 * Initializes the connection to the primary database.
 * Relies on the MONGO_URI environment variable to securely locate the database cluster.
 * @function connectToDB
 */
function connectToDB(){

    mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("server is connected to DB")
    }).catch((error) => {
        // A database connection failure is a fatal application error; 
        // exit immediately to prevent processing requests without persistence guarantees.
        console.error("Error connecting to DB:", error)
        process.exit(1)
    })

}

module.exports = connectToDB;