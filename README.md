# Specification Document

## 9 Lives

### CI/CD Status
![Pipeline Status](https://git.doit.wisc.edu/cdis/cs/courses/cs506/sp2025/team/T_19/Project_19/badges/main/pipeline.svg)
![Test Coverage](https://git.doit.wisc.edu/cdis/cs/courses/cs506/sp2025/team/T_19/Project_19/badges/main/coverage.svg)

### Project Abstract
This software will, at first, offer a simple command line interface allowing users to simulate the process of purchasing items from the vending machine. We plan to first develop in Python to enable rapid development. If speed becomes an issue, we may refactor the system in C++. From there, we've have multiple ideas tossed around regarding further steps. We think it would be cool to integrate a Raspberry Pi to make a physical vending machine that can actually dispense product.  

The database could hold information of how stocked a vending machine is. It could also contain this information for multiple vending machines. Maybe vendors' information could be kept in a database, and they could login to "restock" the vending machines or collect payment. Speaking of payments, maybe we use the Stripe API to collect payments? Or payments could automatically be routed.  

Additional ideas included making a simple interface for customers to use in the Raspberry Pi. We would probably want the Pi to be running the latest code from main, so Docker would be configured to automatically do so. We can have an automated test suite that any merge requests must pass before being merged -- this could be a hard constraint similar to the "someone else from the team must approve this" already in place.  

Another interface could be provided for vendors to see sales info, stock levels, and to actually add inventory to the machines. This could be a mobile app, a web app, or a desktop app. This would also interface with the database.  

To that end, if we go this route the database would be the connection point between the vending machines and the vendors.  

As is made obvious, the ideas are endless. This document will be updated continuously as decisions are made about the overall system architecture and how far we want to reach. If we have more time, or less time, than expected, these system-wide architectural decisions will be reflected here.  

### Customer
The customer for this software will be customers who would like to purchase an item from the vending machine as well as the vendors who'd like to sell their products in the vending machine. We expect to create two interaces: one for customers to purchase items, and one for vendors to view sales information and restock.

### Specification

#### Technology Stack

```mermaid
flowchart RL
subgraph Front End
    A(Python: CLI)
end
	
subgraph Back End
    B(JS Server: Serves HTTP requests, runs on the team's VM)
end
	
subgraph Database
    C[(MySQL)]
end

A <-->|HTTP requests| B
B <-->|Directly with database| C
```

#### Database

```mermaid
---
title: Vending Machine Database ERD
---
erDiagram
    VENDING_MACHINE {
        INT vm_id PK "Auto-increment (1000001+)"
        VARCHAR(100) vm_name
        INT vm_row_count "Unsigned, Not NULL"
        INT vm_column_count "Unsigned, Not NULL"
        INT vm_vendor_id "Future Implementation"
    }

    ITEMS {
        INT item_id PK "Auto-increment (2000001+)"
        VARCHAR(255) item_name "Not NULL, Unique"
    }

    INVENTORY_JOIN_TABLE {
        INT IJT_vm_id PK, FK "References VENDING_MACHINE(vm_id) Not NULL"
        VARCHAR(5) IJT_slot_name PK "Not NULL"
        INT IJT_item_id FK "References ITEMS(item_id), Not NULL"
        DECIMAL(102) IJT_price "Unsigned, Not NULL"
        INT IJT_stock "Unsigned, Not NULL"
    }

    %% Relationships
    VENDING_MACHINE ||--o{ INVENTORY_JOIN_TABLE : contains
    ITEMS ||--o{ INVENTORY_JOIN_TABLE : stocked_in

```

#### [Class Diagram](docs/architecture.md)

Please follow the link above.

#### Flowchart

```mermaid
---
title: Vending Machine Program Flowchart
---
graph TD;
    Start([Start]) --> Select_Mode{Select Mode};
    
    Select_Mode -->|Vendor| Vendor_Mode;
    Vendor_Mode --> Display_All[/Display All Slots/];
    Display_All --> Vendor_Choice{Select Option};

    Vendor_Choice --> |Adjust Stock|adjust_stock[/Enter "slot quantity"/];
    adjust_stock --> Display_All;

    Vendor_Choice --> |Add Item|add_item[/Enter "slot item price quantity"/];
    add_item --> Display_All;

    Vendor_Choice --> |Clear Slot|clear_slot[/Enter "slot"/];
    clear_slot --> Display_All;

    Vendor_Choice --> |Set Cost|set_cost[/Enter "slot new_price"/];
    set_cost --> Display_All;

    Vendor_Choice --> |Exit Vendor|Select_Mode;

    
    Select_Mode -->|Customer| Customer_Mode;
    Customer_Mode --> Display_Available[/Display Available Products/];
    Display_Available --> Customer_Choice{Select Option};

    Customer_Choice --> Process_Payment[/Process Payment/];
    Process_Payment --> |Success|Dispense_Item[/Dispense Item/];
    Dispense_Item --> Dispense_Item;
    Dispense_Item --> |Finish Transaction|Display_Available
    Process_Payment --> |Failed| Payment_Failed[/Payment Failed, Try Again/];
    Payment_Failed --> Display_Available
    
    Customer_Choice --> |Exit Customer|Select_Mode;

    Select_Mode --> |Exit| End([End]);
```

### Standards & Conventions

<!--This is a link to a seperate coding conventions document / style guide-->
[Style Guide & Conventions](STYLE.md)
