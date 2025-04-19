const session = require("express-session");
const KnexSessionStore = require("connect-session-knex")(session);
const knex = require("knex");


// Configure Knex for session storage
const db = knex({
    client: "mysql2",
    connection: {
        host: "localhost",
        user: "your_db_user",
        password: "your_db_password",
        database: "VendingMachineDB",
    },
});

// Configure session store
const store = new KnexSessionStore({
    knex: db,
    tablename: "sessions", // Table to store sessions
    sidfieldname: "sid", // Session ID field
    createtable: true, // Automatically create the table if it doesn't exist
});

// Configure session middleware
const sessionMiddleware = session({
    secret: "your_secret_key", // Replace with a secure secret key
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 1 day
        httpOnly: true,
        secure: false, // Set to true if using HTTPS
    },
});

module.exports = {
    sessionMiddleware
,
};