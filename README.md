# AquaFix

AquaFix is a comprehensive borewell-service platform connecting customers with verified borewell machine owners, built during the internship at Talking Crooks IT Pvt. Ltd. The platform enables Machine Owners to digitize their operations, manage bookings, track job progress, and receive payments directly without broker commissions. It also gives customers an easy interface to discover nearby verified machine owners, compare pricing and ratings, and book services.

## Features

* **Machine Owner Dashboard**: Owners can manage booking requests, ongoing jobs, completed work, and view daily earnings.
* **Customer App**: Customers can search nearby machine owners, compare prices and ratings, book services, and track job progress.
* **Payment & Invoice**: Customers can view billing summaries, mark payments complete, and generate invoices.
* **Role-based Access**: Three distinct portals for Customers, Machine Owners, and Admins, all driven by a Node.js + Express backend.

## Tech Stack

* **Frontend**: React Native (Expo SDK 54), React Navigation, Axios
* **Backend**: Node.js, Express.js
* **Database**: MongoDB, Mongoose ODM

## Prerequisites

Before you begin, ensure you have the following installed:

* Node.js (v18+)
* MongoDB Server (running locally on default port 27017, or a MongoDB Atlas connection string)
* Expo Go app on your phone (or an Android/iOS emulator)

## Installation & Setup

### 1. Database Setup

* Ensure MongoDB is running locally, or have your MongoDB Atlas connection string ready.
* Collections (`users`, `machineOwners`, `bookings`, `payments`, `reviews`) are automatically created by Mongoose when the backend starts.

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Install the dependencies:

```bash
npm install
```

Create a `.env` file in the backend directory:

```env
MONGODB_URI=mongodb://localhost:27017/aquafix
JWT_SECRET=your_jwt_secret_here
PORT=5000
```

Run the backend server:

```bash
node server.js
```

The backend API will start on `http://localhost:5000`.

### 3. Frontend Setup

Open a new terminal window and navigate to the frontend directory:

```bash
cd frontend
```

Install the dependencies:

```bash
npm install
```

Update the backend API URL to your computer's local IP address (needed when testing on a physical device via Expo Go).

Start the Expo development server:

```bash
npx expo start
```

Scan the QR code with the Expo Go app, or press `a` / `i` to launch on an emulator.

## Developer

Developed by Shrey Gupta
Built during internship at Talking Crooks IT Pvt. Ltd.
