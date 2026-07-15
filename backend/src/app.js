/**
 * @fileoverview Application configuration and route composition module.
 * 
 * BUSINESS PURPOSE:
 * Encapsulates the Express application instance, middleware registration, and API route definitions.
 * 
 * SEPARATION OF CONCERNS (WHY):
 * By keeping `app.js` strictly focused on application logic and completely decoupled from network 
 * or database initialization (which live in `server.js`), this file can be seamlessly imported 
 * into automated testing frameworks (like Supertest) without triggering side effects such as 
 * binding to a network port or establishing live database connections.
 * 
 * @module src/app
 */
const express = require("express");
const cookieParser = require('cookie-parser');


const app = express();

app.use(express.json());
app.use(cookieParser());

// Register foundational routing modules for the core ledger domains
const authRouter = require("./routes/auth.routes");
const accountRouter = require("./routes/account.routes");
const transactionRouter = require("./routes/transaction.routes");

// Mount API routes to their respective base paths

app.get("/", (req, res) => {
    res.send("Ledger Service is up and running");
})

app.use("/api/auth", authRouter);
app.use("/api/accounts", accountRouter);
app.use("/api/transactions", transactionRouter);

module.exports = app;