import sys  # noqa: INP001
import textwrap

import exceptions as err
from customer.vending_machine import VendingMachine
from enum_types import InventoryManagerMode
from inventory_manager import InventoryManager

vending_machine: VendingMachine = None
inventory_manager: InventoryManager = None

def main():
    global vending_machine
    global inventory_manager
    row = int(input("Please input the number of rows to be in the vending machine (1 digit): "))
    col = int(input("Please input the number of columns to be in the vending machine (1 digit): "))
    try:
        inventory_manager = InventoryManager(row, col, "UNIQUEID")
        vending_machine = VendingMachine(inventory_manager, "UNIQUEID")
    except err.InvalidDimensionsError as e:
        print("Error: ", e)
        sys.exit(1)


    while(True):
        mode = input('Are you a Customer or Vendor? Type "C" or "V" to select, or Q for exit: ')
        if(mode == "C"):
            customer_mode()
        elif(mode == "V"):
            vendor_mode()
        elif(mode == "Q"):
            sys.exit(0)
        else:
            print("Invalid Option")


def customer_mode():
    global vending_machine

    while(True):
        print("Vending Machine Inventory: ")
        print(vending_machine.list_options())
        user_input = input(textwrap.dedent("""
                    Please select one of the following options
                    1. Enter Payment Information
                    2. Exit Customer CLI
                """))

        if(user_input == "1"):
            perform_transaction()
        elif(user_input == "2"):
            return
        else:
            print("Invalid input, please type 1 or 2")


def perform_transaction():
    global vending_machine
    try:
        vending_machine.start_transaction()
        # All the stripe API payment stuff should happen inside here ^^
    except err.InvalidModeError as e:
        print("Error: " + str(e))
        return

    print("Payment Information Entered...")

    while(True):
        selection = input("Please type the slot name of the item you would like to purchase, " \
                          "or Q to finish transaction: ")
        if(selection == "Q"):
            print(f"Payment method was charged {vending_machine.end_transaction()!s}")
            return

        try:
            dispensed_item = vending_machine.buy_item(selection)
            print("Dispensing Item: " + dispensed_item)
            print("Vending Machine Inventory: ")
            print(vending_machine.list_options())
        except err.EmptySlotError as e:
            print("Error: ", e)
        except err.InvalidSlotNameError as e:
            print("Error: ", e)


def vendor_mode():
    global inventory_manager
    try:
        inventory_manager.set_mode(InventoryManagerMode.RESTOCKING)
    except err.InvalidModeError as e:
        print("Error: " + e)
        return

    while(True):
        print("Vending Machine Inventory: ")
        print(inventory_manager.get_stock_information(show_empty_slots=True))
        user_input = input(textwrap.dedent("""
                    Please select one of the following options
                    1. Update stock of a slot
                    2. Add or override an item
                    3. Set the cost of an item in a slot
                    4. Clear a slot
                    5. Exit Vendor CLI
                """))

        if(user_input == "1"):
            update_stock()
        elif(user_input == "2"):
            add_item()
        elif(user_input == "3"):
            set_cost()
        elif(user_input == "4"):
            clear_slot()
        elif(user_input == "5"):
            inventory_manager.set_mode(InventoryManagerMode.IDLE)
            return
        else:
            print("Invalid input, please enter an option 1 - 5: ")


def update_stock():
    global inventory_manager

    try:
        slot = input("Please enter the slot you'd like to update: ")
        amount = int(input("Please enter the amount you'd like to change the stock by: "))
        inventory_manager.change_stock(slot, amount)
        print("Updated slot " + slot + " by " + str(amount))
    except err.EmptySlotError as e:
        print("Error: ", e)
        return
    except err.InvalidSlotNameError as e:
        print("Error: ", e)
        return
    except err.NegativeStockError as e:
        print("Error: ", e)
        return

def add_item():

    try:
        slot = input("Please enter the slot you'd like to update: ")
        name = input("Please enter the name of the item you'd like to add: ")
        cost = float(input("Please enter the price of the item you'd like to add (dollars): "))
        amount = int(input("Please enter the amount you'd like to change the stock by: "))
        inventory_manager.add_item(slot, name, amount, cost)
        print(f"Added {amount!s} of {name} of price {cost!s} to slot {slot}")
    except err.EmptySlotError as e:
        print("Error: ", e)
        return
    except err.InvalidSlotNameError as e:
        print("Error: ", e)
        return
    except err.NegativeStockError as e:
        print("Error: ", e)
        return
    except err.NegativeCostError as e:
        print("Error: ", e)
        return


def set_cost():
    global inventory_manager

    try:
        slot = input("Please enter the slot you'd like to update: ")
        cost = float(input("Please enter the new price of this slot: "))
        inventory_manager.set_cost(slot, cost)
        print(f"Set the cost of slot {slot} to {cost!s}")
    except err.InvalidSlotNameError as e:
        print("Error: ", e)
        return
    except err.NegativeCostError as e:
        print("Error: ", e)
        return


def clear_slot():
    global inventory_manager

    try:
        slot = input("Please enter the slot you'd like to clear: ")
        inventory_manager.clear_slot(slot)
        print(f"Cleared slot {slot}")
    except err.InvalidSlotNameError as e:
        print("Error: ", e)
        return


if __name__ == "__main__":
    main()
