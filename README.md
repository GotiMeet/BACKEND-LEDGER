# BACKEND-LEDGER
Node.js • Express.js • MongoDB Atlas • JWT Authentication • Double-Entry Ledger • Atomic Transactions

Most backend projects demonstrate CRUD at various levels of polish. BACKEND-LEDGER exists to address a harder problem: how do you build a financial system where data integrity is a hard guarantee rather than a best effort?

The project implements an append-only ledger, atomic multi-document transactions, and idempotent transfer processing. Balances are never stored as mutable fields; they are always derived from an immutable record of events. Every design decision prioritizes consistency and auditability over implementation simplicity.

## Project Status

Version 1 of the backend is complete and deployed.

Future development will focus on frontend integration, refresh token authentication, infrastructure improvements, and additional production-ready features.

## Highlights

**Authentication**

- User Registration and Login
- JWT-based session management
- Logout with token blacklisting

**Accounts**

- Account provisioning per user
- Multiple account support
- Real-time balance calculation from ledger

**Transactions**

- Secure peer-to-peer fund transfers
- Idempotent transaction processing
- Atomic double-entry ledger writes via MongoDB transactions
- Immutable ledger with enforced append-only policy

**Notifications**

- Welcome email on registration
- Transaction confirmation emails
- Refund notification emails

## Tech Stack

| Layer          | Technology                   |
| -------------- | ---------------------------- |
| Runtime        | Node.js                      |
| Framework      | Express.js                   |
| Database       | MongoDB Atlas                |
| ODM            | Mongoose                     |
| Authentication | JSON Web Tokens (JWT)        |
| Email          | Nodemailer with Gmail OAuth2 |

## Architecture

The application follows a modular monolith architecture, separating routing, business logic, data access, and external integrations into independent layers. This separation keeps responsibilities well-defined, improves maintainability, and allows each layer to evolve independently.

```text
                 Client
                    │
                    ▼
            Express Routes
                    │
                    ▼
              Controllers
               │         │
               │         └──────────────► Email Service
               │
               ▼
         Mongoose Models
               │
               ▼
          MongoDB Atlas
```

### Request Lifecycle

```
Client Request
      │
      ▼
Express Route
      │
      ▼
Controller
      │
      ├── Business Validation
      ├── Authorization
      ├── Database Transaction
      └── Email Notification (when applicable)
      │
      ▼
Mongoose Models
      │
      ▼
MongoDB Atlas
```

## Folder Structure

```text
BACKEND-LEDGER/
└── backend/
    ├── server.js
    └── src/
        ├── app.js
        ├── config/
        │   └── db.js
        ├── controllers/
        │   ├── auth.controller.js
        │   ├── account.controller.js
        │   └── transaction.controller.js
        ├── middleware/
        │   └── auth.middleware.js
        ├── models/
        │   ├── user.model.js
        │   ├── account.model.js
        │   ├── blackList.model.js
        │   ├── ledger.model.js
        │   └── transaction.model.js
        ├── routes/
        │   ├── auth.routes.js
        │   ├── account.routes.js
        │   └── transaction.routes.js
        └── services/
            └── email.service.js
```

- `server.js`: Entry point. Loads environment variables, initializes the database, and binds the app to a port.
- `src/app.js`: Configures the Express instance, registers middleware, and mounts route modules. Deliberately decoupled from infrastructure so it can be imported in tests without side effects.
- `src/config/`: Database connection initialization.
- `src/controllers/`: Business logic layer, orchestrating between models and services.
- `src/middleware/`: Authentication guards. `authMiddleware` protects standard routes; `authSystemUserMiddleware` restricts admin-only endpoints.
- `src/models/`: Mongoose schemas with strict validation. The ledger model enforces immutability via pre-save and pre-update hooks.
- `src/routes/`: Maps HTTP endpoints to controllers.
- `src/services/`: External integrations. Currently contains the Nodemailer email service.

## Authentication Flow

Authentication is managed via JSON Web Tokens (JWT). When a user registers or logs in, the server generates a signed token. This token must be included in the Authorization header or cookies of subsequent requests.

User passwords are hashed with bcrypt before being stored in the database. Raw passwords are never persisted.

To handle logout securely without waiting for token expiration, the application uses a token blacklisting mechanism. When a logout request is received, the active token is stored in a dedicated MongoDB collection of invalidated tokens. The authentication middleware checks this blacklist on every protected route, guaranteeing that discarded tokens cannot be reused.

## Account Management

Accounts are provisioned and linked to specific users. The system allows users to maintain multiple active accounts. An account's state is strictly validated to ensure it is active before any financial operations are permitted.

Account balances are not stored as a static field. Instead, they are dynamically derived in real-time by querying the immutable ledger, guaranteeing that the reported balance is always an accurate reflection of historical financial facts.

## Transaction Flow

The transaction flow is designed to ensure strict financial consistency. When a fund transfer is requested, the system:

1. Validates the idempotency key to prevent duplicate processing from network retries.
2. Checks that both the sender and receiver accounts are active.
3. Dynamically calculates the sender's balance from the ledger to prevent overdrafts.
4. Initiates a MongoDB session to execute the transfer atomically.
5. Records the intent in the transactions collection.
6. Writes a DEBIT entry to the ledger for the sender.
7. Writes a CREDIT entry to the ledger for the receiver.
8. Commits the transaction and dispatches confirmation emails asynchronously.

## Immutable Ledger System

The ledger is the central source of truth for the application.

- **Append-Only Ledger**: The ledger strictly accepts only new records. Mongoose middleware explicitly blocks all `update` and `delete` operations.
- **Double-Entry Bookkeeping**: Every transaction results in at least two ledger entries (a debit and a credit) that balance each other perfectly.
- **Why records are never modified**: Ledger entries represent historical facts. Modifying them would destroy financial consistency and auditability. If an error occurs, a compensating transaction (such as a refund) must be appended instead of altering past records.
- **Auditability**: Because records cannot be tampered with, auditors can reconstruct the exact financial state of any account at any point in time.
- **Balance Reconstruction**: Balances are calculated dynamically using a MongoDB aggregation pipeline that subtracts total debits from total credits.

## Security Features

- **Password Hashing**: User passwords are hashed with bcrypt before storage. The password field is excluded from all query results by default and explicitly selected only when authentication requires it.
- **JWT Blacklisting**: Ensures instantaneous session revocation upon logout, without waiting for token expiration.
- **Idempotency**: All endpoints that alter financial state require an idempotency key, preventing duplicate charges from network retries or accidental duplicate requests.
- **Atomic Transactions**: Operations spanning multiple collections use MongoDB ACID transactions to ensure partial failures never produce inconsistent state.
- **Data Validation**: Strict Mongoose schema validation prevents malformed or malicious data from reaching the database layer.

## API Endpoints

### General

| Method | Endpoint | Access | Description                                          |
| ------ | -------- | ------ | ---------------------------------------------------- |
| GET    | `/`      | Public | Returns a simple response confirming the service is running. |

### Authentication

| Method | Endpoint             | Access  | Description                                              |
| ------ | -------------------- | ------- | -------------------------------------------------------- |
| POST   | `/api/auth/register` | Public  | Registers a new user and returns a session token.        |
| POST   | `/api/auth/login`    | Public  | Verifies credentials and issues a new session token.     |
| POST   | `/api/auth/logout`   | Private | Invalidates the active token and terminates the session. |

### Accounts

| Method | Endpoint                           | Access  | Description                                                    |
| ------ | ---------------------------------- | ------- | -------------------------------------------------------------- |
| POST   | `/api/accounts/`                   | Private | Provisions a new financial account for the authenticated user. |
| GET    | `/api/accounts/`                   | Private | Retrieves all accounts owned by the authenticated user.        |
| GET    | `/api/accounts/balance/:accountId` | Private | Calculates the real-time balance for a specific account.       |

### Transactions

| Method | Endpoint                                 | Access  | Description                                            |
| ------ | ---------------------------------------- | ------- | ------------------------------------------------------ |
| POST   | `/api/transactions`                      | Private | Initiates a secure fund transfer between two accounts. |
| POST   | `/api/transactions/system/initial-funds` | Admin   | Provisions initial funds from the system account.      |

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB cluster (local or Atlas)

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/gotimeet/BACKEND-LEDGER.git
cd BACKEND-LEDGER/backend
npm install
```

### Environment Variables

Create a `.env` file inside the `backend/` directory. All variables listed below are required by the current implementation.

```text
# MongoDB Atlas connection string
MONGO_URI=

# Secret key used to sign and verify JWT tokens
JWT_SECRET=

# Gmail address used as the sender
EMAIL_USER=

# Google OAuth2 credentials for Nodemailer
CLIENT_ID=
CLIENT_SECRET=
REFRESH_TOKEN=
```

### Running Locally

```bash
cd BACKEND-LEDGER/backend
npm run dev
```

The server will initialize the database connection and listen for requests on port 3000.

## Deployment

The application is deployed on Render with MongoDB Atlas as the database cluster.

MongoDB Atlas is used in production specifically because it provisions a replica set by default. MongoDB atomic transactions require a replica set to function; a standalone MongoDB instance does not support them.

When deploying:

- Set all environment variables via the Render dashboard. Do not commit `.env` to version control.
- Atlas handles replica set management, backups, and connection pooling automatically.
- The Express application is stateless and can be scaled horizontally on Render without architectural changes.

## Future Improvements

- Refresh token authentication
- Redis-based token blacklist
- Rate limiting
- Docker
- CI/CD
- Frontend application
- Monitoring and logging
- OpenAPI / Swagger documentation
