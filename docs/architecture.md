# System Architecture

## Issues with what's here so far and questions about design decisions: 

- Where prices come from. Presumably, **VendingMachine** should retrieve price data from **InventoryManager**. So then **VendingMachine** will have to get pricing info from **InventoryManager** and then somehow send that to **IPaymentProcessor**

- Overall, need to flush out more details of how the **IDatabaseCommunicator** works.

- How to handle cases when products are out? List them as quantity 0, or just don't list at all. Delete from database whenever quantity reaches 0??

- Even if we don't have a complete vendor-side application, we still need a way to restock. Even if it is a lot simpler, still something to say "add 5 candy bars" or something

## Design Decision Making Process

First off, we will need a vending machine class: **VendingMachine**. This class's responsibility will be to manage the interaction of different objects and will host a simple interface for using the vending machine (think "buy product" or "list options").

The vending machine will need to hold items, and this inventory information will be stored in the database.

To use the database to store inventory information, it probably makes sense for there to be a separate class whose responsibility is communicating with the database: **IDatabaseCommunicator**. In this case, it probably makes sense to define this class's interface in an ABC so a mock object **MockDatabaseCommunicator** can be created for testing purposes. A **RealDatabaseCommunicator** can then actually affect the database.

It is proposed that there is a facade class, **InventoryManager**, that sits on top of **IDatabaseCommunicator** to further abstract away some information. For example, the **IDatabaseCommunicator** might have a method query_stock_information(string itemName) that performs the database query, and **InventoryManager** may have a method get_stock_information(string itemName) that then calls the query_stock_information(string itemName) method. This could be needless complexity, though, so it may not be necessary. 

Our MVP will just use a CLI to manage the vending machine, and there won't be any fancy vendor-side application. A class **CustomerCli** can hold an instance of **VendingMachine** and handle interactions via the command line. It will do input validation as well.

For now, there can be a simple **VendorCli** that holds a reference to the same **InventoryManager** object that **VendingMachine** holds a reference to. The **VendorCli** can implement simple methods for restocking the vending machine.

As mentioned in #14, a **IPaymentProcessor** ABC should define the behaviors needed to process a payment. Then, there can be two implementations: one called **StripePaymentProcessor** that uses the Stripe API to actually process payments, and another called **MockPaymentProcessor** that can be used for testing or simply when we don't want to be using the API (pre-release).

## Class Design Diagram

```mermaid
classDiagram
    class VendingMachine {
        +InventoryManager inventoryManager
        +IPaymentProcessor paymentProcessor
        +buy_product(string itemName)
        +list_options()
    }

    class InventoryManager {
        +IDatabaseCommunicator databaseCommunicator
        +get_stock_information(string itemName) : int
        +update_stock(string itemName, int quantity)
    }

    class IDatabaseCommunicator {
        <<abstract>>
        +query_stock_information(string itemName) : int
        +update_inventory(string itemName, int quantity)
    }

    class MockDatabaseCommunicator {
        +query_stock_information(string itemName) : int
        +update_inventory(string itemName, int quantity)
    }

    class RealDatabaseCommunicator {
        +query_stock_information(string itemName) : int
        +update_inventory(string itemName, int quantity)
    }

    class CustomerCli {
        +VendingMachine vendingMachine
        +handle_input()
    }

    class VendorCli {
        +InventoryManager inventoryManager
        +restock(string itemName, int quantity)
    }

    class IPaymentProcessor {
        <<abstract>>
        +process_payment() bool
    }

    class StripePaymentProcessor {
        +process_payment() bool
    }

    class MockPaymentProcessor {
        +process_payment() bool
    }

    VendingMachine "has-a" --> InventoryManager
    VendorCli --> "has-a" InventoryManager
    InventoryManager --> "has-a" IDatabaseCommunicator
    IDatabaseCommunicator <|-- "is-a" MockDatabaseCommunicator
    IDatabaseCommunicator <|-- "is-a" RealDatabaseCommunicator
    VendingMachine --> "has-a" IPaymentProcessor
    IPaymentProcessor <|-- "is-a" StripePaymentProcessor
    IPaymentProcessor <|-- "is-a" MockPaymentProcessor
    CustomerCli --> "has-a" VendingMachine
```
