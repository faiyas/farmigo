CREATE DATABASE IF NOT EXISTS farmigo DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE farmigo;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','farmer','customer') NOT NULL DEFAULT 'customer',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crops (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  farmer_id INT NOT NULL,
  crop_name VARCHAR(120) NOT NULL,
  price DOUBLE NOT NULL,
  quantity INT NOT NULL,
  available TINYINT(1) DEFAULT 1,
  CONSTRAINT fk_inventory_farmer FOREIGN KEY (farmer_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  total_amount DOUBLE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  inventory_id INT NOT NULL,
  quantity INT NOT NULL,
  price DOUBLE NOT NULL,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_inventory FOREIGN KEY (inventory_id) REFERENCES inventory (id) ON DELETE CASCADE
);

type InventoryItem = {
  id: number;
  crop: { id: number; name: string };
  price: number;
  quantity: number;
  available: boolean;
  farmer?: { id: number; name: string }; // Add this line
};


