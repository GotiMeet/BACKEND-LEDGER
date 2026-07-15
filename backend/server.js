/**
 * @fileoverview Application entry point and server lifecycle manager.
 * 
 * BUSINESS PURPOSE:
 * Responsible for bootstrapping the application environment, initializing external dependencies 
 * (like the database), and binding the configured Express app to a network port.
 * 
 * SEPARATION OF CONCERNS (WHY):
 * `server.js` serves purely as the execution host. It imports the fully configured Express 
 * application from `app.js` and handles the side effects required to bring the system online. 
 * This cleanly isolates infrastructure lifecycle management from core application logic.
 * 
 * @module server
 */
// Initialize environment variables first to ensure all subsequent modules have access to configuration secrets
require("dotenv").config();

const app = require("./src/app");
const connectToDB = require("./src/config/db");

connectToDB();

app.listen(3000, () => {
    console.log("Server is running on port 3000");
})