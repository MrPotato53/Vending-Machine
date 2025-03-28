USE VendingMachineDB;
--TODO pare down requirments & make gant table
--    integrate python vending machine restock
--    message queue for auto restock per vm
--    implement users
--        login
--    implement orgs
--    implement GUI
--    implement groups
--    assign sahanj a page
--    need figma to get him to implement stuff
--    health check for VM
--    if stripe cannot be done vm shuts down
--    distance req: org item subset, group subet
--    atm the all users should be able to make a new item
--    strip connect distrubution of payments
--         talk to diego about stripe tags
--    time stamps on item, profit, logs (transactions, resock)

--fcas architecture
CREATE TABLE IF NOT EXISTS orgs (
    org_id INT AUTO_INCREMENT PRIMARY KEY UNIQUE,
    org_name CHAR(20),
   -- org_owner CHAR(20), Search users for role of admin/owner
    stripeID CHAR(30) -- Change to 255 to future-proof Stripe ID changes
);

--security ring for sub grouping users and machines 

--Need a backend for an org application
--Security rings: 
CREATE TABLE IF NOT EXISTS users (
    u_id INT AUTO_INCREMENT PRIMARY KEY UNIQUE,
    u_name CHAR(20) NOT NULL UNIQUE,
    email VARCHAR(20) NOT NULL UNIQUE,
    u_role CHAR(12) DEFAULT 'maintainer', 
    org_id INT DEFAULT 0, 
    group_id INT DEFAULT 0,
    password CHAR(60) NOT NULL, -- Fixed typo from 'pasword' to 'password'
    FOREIGN KEY (org_id) REFERENCES orgs(org_id) ON DELETE CASCADE
);
ALTER TABLE USERS AUTO_INCREMENT = 2000001;

CREATE TABLE IF NOT EXISTS vending_machines (
    vm_id VARCHAR(10) PRIMARY KEY UNIQUE,
    vm_name VARCHAR(100),
    vm_row_count INT UNSIGNED NOT NULL,
    vm_column_count INT UNSIGNED NOT NULL,
    vm_mode CHAR(1) NOT NULL, -- "i" for idle, "r" for restocking, "t" for transaction
    orgID INT NOT NULL DEFAULT 0, 
    maintainer INT NOT NULL DEFAULT 0, 
    FOREIGN KEY (orgID) REFERENCES orgs(org_id) ON DELETE CASCADE,
    FOREIGN KEY (maintainer) REFERENCES users(u_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL UNIQUE
);
ALTER TABLE items AUTO_INCREMENT = 3000001;

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
