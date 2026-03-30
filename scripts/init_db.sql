-- Initialize the database
CREATE DATABASE IF NOT EXISTS food_management;
USE food_management;

-- 1. Users Table (Unified for RBAC: Admin, Donor, NGO/Receiver, Volunteer)
CREATE TABLE IF NOT EXISTS Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Donor', 'NGO', 'Volunteer') NOT NULL,
    phone VARCHAR(20),
    city VARCHAR(100),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Food_Donation Table
CREATE TABLE IF NOT EXISTS Food_Donations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    donor_id INT NOT NULL,
    food_type VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    status ENUM('Available', 'Assigned', 'Completed') DEFAULT 'Available',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (donor_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- 3. Food_Request Table
CREATE TABLE IF NOT EXISTS Food_Requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ngo_id INT NOT NULL,
    required_quantity INT NOT NULL,
    request_food_type VARCHAR(100) NOT NULL,
    status ENUM('Pending', 'Assigned', 'Fulfilled') DEFAULT 'Pending',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ngo_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- 4. Donation_Assignment Table
CREATE TABLE IF NOT EXISTS Donation_Assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    donation_id INT NOT NULL,
    request_id INT, -- Can be NULL if assigned manually without a strict request
    status ENUM('Pending', 'In Progress', 'Completed') DEFAULT 'Pending',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (donation_id) REFERENCES Food_Donations(id) ON DELETE CASCADE,
    FOREIGN KEY (request_id) REFERENCES Food_Requests(id) ON DELETE SET NULL
);

-- 5. Pickup_Delivery Table
CREATE TABLE IF NOT EXISTS Pickup_Deliveries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assignment_id INT NOT NULL,
    volunteer_id INT NOT NULL,
    pickup_status ENUM('Pending', 'Picked Up') DEFAULT 'Pending',
    delivery_status ENUM('Pending', 'In Transit', 'Delivered') DEFAULT 'Pending',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assignment_id) REFERENCES Donation_Assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (volunteer_id) REFERENCES Users(id) ON DELETE CASCADE
);
