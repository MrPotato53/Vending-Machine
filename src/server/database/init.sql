USE VendingMachineDB;

CREATE TABLE IF NOT EXISTS vending_machines (
    vm_id VARCHAR(10) PRIMARY KEY,
    vm_name VARCHAR(100),
    vm_row_count INT UNSIGNED NOT NULL,
    vm_column_count INT UNSIGNED NOT NULL,
    vm_mode CHAR(1) NOT NULL -- "i" for idle, "r" for restocking, "t" for transaction
    -- vm_recently_restocked BIT(1) NOT NULL, -- 0 means not recently restocked, 1 means recently restocked
    -- vendor_id INT

    orgID INT NOT NULL DEFAULT 0, --current implementation only has master users(0)
    maintainer INT NOT NULL DEFAULT 0, --current implementation only has master users(0)

    FOREIGN KEY (orgID) REFERENCES orgs(ID) ON DELETE CASCADE,
    FOREIGN KEY (maintainer) REFERENCES users(ID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL UNIQUE
);
ALTER TABLE items AUTO_INCREMENT = 2000001;

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

CREATE TABLE IF not EXISTS orgs (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    org_name CHAR(20),
    org_owner CHAR(20),
    stripeID char(30) --change to 255 to future proof stripe ID changes

    FOREIGN KEY (org_owner) REFERENCES users(u_name) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS users (
    u_id INT AUTO_INCREMENT PRIMARY KEY,
    u_name char(20) NOT NULL,
    email varchar(20,) NOT NULL,
    
    u_role CHAR(12) DEFAULT 'maintainer', 
    orgID INT DEFAULT 0, 

    pasword CHAR(60) NOT NULL, --could hash the position of the encrypt pwd on a table

    FOREIGN KEY (orgID) REFERENCES orgs(ID) on DELETE CASCADE
);
