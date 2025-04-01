USE VendingMachineDB;

-- TODO: pare down requirements & make Gantt table
--       integrate Python vending machine restock
--       implement users
--           login
--       implement orgs ✅
--       implement GUI ✅
--       implement groups
--       assign Sahanj a page (need Figma to get him to implement stuff)
--       health check for VM ✅
--       if Stripe cannot be done, VM shuts down
--       distance req: org item subset, group subset
--       ATM all users should be able to make a new item
--       Stripe connect distribution of payments (talk to Diego about Stripe tags)
--       time stamps on item, profit, logs (transactions, restock)
--       FCAS architecture

-- ORGS TABLE
CREATE TABLE IF NOT EXISTS orgs (
    org_id INT AUTO_INCREMENT PRIMARY KEY,
    org_name CHAR(20),
    stripeID CHAR(255) -- Future-proofed Stripe ID field
);
ALTER TABLE orgs AUTO_INCREMENT = 1000001;

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    u_id INT AUTO_INCREMENT PRIMARY KEY,
    u_name CHAR(20) NOT NULL UNIQUE,
    email VARCHAR(50) NOT NULL UNIQUE, -- Extended email field for real-world use
    u_role CHAR(12) DEFAULT 'maintainer',
    org_id INT DEFAULT 0,
    group_id INT DEFAULT 0,
    password CHAR(60) NOT NULL,
    FOREIGN KEY (org_id) REFERENCES orgs(org_id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES groups(groupID) ON DELETE SET DEFAULT
);
ALTER TABLE users AUTO_INCREMENT = 2000001;

-- GROUPS TABLE
CREATE TABLE IF NOT EXISTS groups (
    groupID INT AUTO_INCREMENT PRIMARY KEY,
    group_name VARCHAR(20) NOT NULL UNIQUE,
    org_id INT NOT NULL,
    FOREIGN KEY (org_id) REFERENCES orgs(org_id) ON DELETE CASCADE
);
ALTER TABLE groups AUTO_INCREMENT = 3000001;

-- VENDING MACHINES TABLE
CREATE TABLE IF NOT EXISTS vending_machines (
    vm_id VARCHAR(10) PRIMARY KEY,
    vm_name VARCHAR(100),
    vm_row_count INT UNSIGNED NOT NULL,
    vm_column_count INT UNSIGNED NOT NULL,
    vm_mode CHAR(1) NOT NULL, -- 'i' = idle, 'r' = restocking, 't' = transaction
    orgID INT NOT NULL,
    groupID INT,
    FOREIGN KEY (orgID) REFERENCES orgs(org_id) ON DELETE CASCADE,
    FOREIGN KEY (groupID) REFERENCES groups(groupID) ON DELETE SET NULL
);

-- ITEMS TABLE
CREATE TABLE IF NOT EXISTS items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL UNIQUE
);
ALTER TABLE items AUTO_INCREMENT = 4000001;

-- INVENTORY JOIN TABLE
CREATE TABLE IF NOT EXISTS inventory_join_table (
    IJT_vm_id VARCHAR(10) NOT NULL,
    IJT_slot_name VARCHAR(5) NOT NULL,
    IJT_item_id INT NOT NULL,
    IJT_price DECIMAL(10, 2) UNSIGNED NOT NULL,
    IJT_stock INT UNSIGNED NOT NULL,
    PRIMARY KEY (IJT_vm_id, IJT_slot_name),
    FOREIGN KEY (IJT_vm_id) REFERENCES vending_machines(vm_id) ON DELETE CASCADE,
    FOREIGN KEY (IJT_item_id) REFERENCES items(item_id) ON DELETE CASCADE
);
