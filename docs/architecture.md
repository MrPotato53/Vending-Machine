# System Architecture

## Design Decision Making Process

First off, we will need a vending machine class: **VendingMachine**. This class's responsibility will be to manage the interaction of different objects and will host a simple interface for using the vending machine (think "buy product" or "list options").

The vending machine will need to hold items, so we create an **Item** class as well. This could be defined in an abstract base class (ABC) if we want different derived types of objects, but that could also be needless complexity. The items will be managed by some object like **InventoryManager**.

To use the database to store inventory information, it probably makes sense for there to be a separate class whose responsibility is communicating with the database: **DatabaseCommunicator**. In this case, it probably makes sense to define this class's interface in an ABC so a mock object can be created for testing purposes.

Our MVP will just use a CLI to manage the vending machine, and there won't be any vendor-side application or interface yet. A class **CustomerCli** can hold an instance of **VendingMachine** and handle interactions via the command line. It will do input validation as well. 

As mentioned in #14, a **PaymentProcessor** ABC should define the behaviors needed to process a payment. Then, there can be two implementations: one called **StripePaymentProcessor** that uses the Stripe API to actually process payments, and another called **MockPaymentProcessor** that can be used for testing or simply when we don't want to be using the API (pre-release).

## Class Design Diagram