USE VendingMachineDB;

CREATE TABLE IF NOT EXISTS vending_machines (
    vm_id INT AUTO_INCREMENT PRIMARY KEY,
    vm_name VARCHAR(100),
    vm_row_count INT UNSIGNED NOT NULL,
    vm_column_count INT UNSIGNED NOT NULL
    -- vendor_id INT
);
ALTER TABLE vending_machines AUTO_INCREMENT = 1000001;

CREATE TABLE IF NOT EXISTS items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL UNIQUE
);
ALTER TABLE items AUTO_INCREMENT = 2000001;

CREATE TABLE IF NOT EXISTS inventory_join_table (
    IJT_vm_id INT NOT NULL,
    IJT_slot_name VARCHAR(5) NOT NULL,
    IJT_item_id INT NOT NULL,
    IJT_price DECIMAL(10, 2) UNSIGNED NOT NULL,
    IJT_stock INT UNSIGNED NOT NULL,
    PRIMARY KEY (IJT_vm_id, IJT_slot_name),
    FOREIGN KEY (IJT_vm_id) REFERENCES vending_machines(vm_id) ON DELETE CASCADE,
    FOREIGN KEY (IJT_item_id) REFERENCES items(item_id) ON DELETE CASCADE
);