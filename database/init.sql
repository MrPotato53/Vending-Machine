USE VendingMachineDB;

CREATE TABLE IF NOT EXISTS vending_machines (
    vm__id INT AUTO_INCREMENT PRIMARY KEY,
    vm_name VARCHAR(100),
    row_count INT UNSIGNED NOT NULL,
    column_count INT UNSIGNED NOT NULL,
    PRIMARY KEY(vending_machine_id)
    -- vendor_id INT
);
alter table vending_machines auto_increment = 1000001;

CREATE TABLE IF NOT EXISTS items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL UNIQUE,
    PRIMARY KEY(item_id)
);
alter table items auto_increment = 2000001;

CREATE TABLE IF NOT EXISTS inventory_join_table (
    vending_machine_id INT NOT NULL,
    slot_name VARCHAR(5) NOT NULL,
    item_id INT NOT NULL,
    price DECIMAL(10, 2) UNSIGNED NOT NULL,
    stock INT UNSIGNED NOT NULL,
    PRIMARY KEY (vending_machine_id, slot_name),
    FOREIGN KEY (vending_machine_id) REFERENCES vending_machines(vm_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE CASCADE
);