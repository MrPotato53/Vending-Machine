CREATE TABLE IF NOT EXISTS vending_machines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vending_machine_name VARCHAR(100),
    row_count INT UNSIGNED NOT NULL,
    column_count INT UNSIGNED NOT NULL,
    -- vendor_id INT
);

CREATE TABLE IF NOT EXISTS items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS inventory_join_table (
    vending_machine_id INT NOT NULL,
    slot_name VARCHAR(5) NOT NULL,
    item_id INT NOT NULL,
    price DECIMAL(10, 2) UNSIGNED NOT NULL,
    stock INT UNSIGNED NOT NULL,
    PRIMARY KEY (vending_machine_id, slot_name),
    FOREIGN KEY (vending_machine_id) REFERENCES vending_machines(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);