from src.client import exceptions as err
from src.client.db_signal import Inventory, Items, VendingMachines
from src.client.enum_types import InventoryManagerMode
from src.client.item import Item


class InventoryManager:
    """Item management logic for vending machine.

    Attributes
    ----------
    hardware_id: str
        Unique identifier for vending machine
    height: int
        Number of rows in vending machine
    width: int
        Number of columns in vending machine
    items: Item[][]
        2d List of all items
    change_log: dict
        Dictionary of changes to items to be saved to database
    mode
        Operating mode of inventory manager, is either IDLE, TRANSACTION, or RESTOCKING

    Methods
    -------
    def load_from_db(self) -> None
        Load items from database
    def save_to_db(self) -> None
        Save items to database
    def get_mode(self) -> Mode
        Returns the operating mode of this inventory manager
    def set_mode(self, new_mode) -> None
        Sets the operating mode of this inventory manager
    def get_stock_information(self, show_empty_slots) -> str
        Return a string of all stock information
    def change_stock(self, slot_name, item_stock) -> float
        Changing the stock of a slot
        Update the stock of existing item in slot. If no item, throw error
        If inputted stock < 0, return the total combined price of items removed
    def add_item(self, slot_name, item_name, item_stock, item_cost) -> None
        Add new item in slot, override potentially preexisting items.
        New stock value = item_stock, because old stock is voided
    def clear_slot(self, slot_name) -> None
        Removes the item from a named slot
    def set_cost(self, slot_name, new_cost) -> None
        Sets a new cost for a given slot
    def get_item(self, slot_name) -> Item
        Returns the item at a slot
    def __get_coordinates_from_slotname(self, slot_name) -> tuple[int, int]
        Given a slot_name in the form of a string, returns the coordinates in items

    """

    MAXHEIGHT = 10
    MAXWIDTH = 10
    SLOTNAMELENGTH = 2

    def __init__(self, height: int, width: int, hardware_id: str) -> None:
        """Initialize an InventoryManager with a 2d list of items and set mode to IDLE."""
        self.hardware_id = hardware_id

        # Set rows and columns of inventory
        if height <= 0 or width <= 0 or height > self.MAXHEIGHT or width > self.MAXWIDTH:
            raise err.InvalidDimensionsError("Width and Height must be 0 < x < 11")

        self.height = height
        self.width = width

        # Create items 2d list and fill it with database values
        self.__items = [[None for i in range(width)] for j in range(height)]

        self.__change_log = {}
        self.__mode = InventoryManagerMode.IDLE

    def load_from_db(self) -> None:
        self.__items = [[None for i in range(self.width)] for j in range(self.height)]
        inventory: list[dict] = Inventory.get_inventory_of_vending_machine(self.hardware_id)

        for item in inventory:
            row, col = self.__get_coordinates_from_slotname(item["slot_name"])
            self.__items[row][col] = Item(item["item_name"], item["cost"], item["stock"])

    def save_to_db(self) -> None:
        req_body = [
        {
            "slot_name": slot_name,
            "item_name": item.get_name() if item else None,
            "price": item.get_cost() if item else None,
            "stock": item.get_stock() if item else None,
        }
        for slot_name, item in self.__change_log.items()]

        Inventory.update_database(self.hardware_id, req_body)
        self.__change_log = {}

    def get_mode(self) -> InventoryManagerMode:
        return self.__mode

    def set_mode(self, new_mode: InventoryManagerMode) -> None:
        self.__mode = VendingMachines.get_vending_machine(self.hardware_id)["mode"]

        if new_mode is InventoryManagerMode.IDLE and self.__mode is InventoryManagerMode.IDLE:
            raise err.InvalidModeError("Cannot change mode from IDLE to IDLE")

        if (
            (new_mode is InventoryManagerMode.TRANSACTION
            or new_mode is InventoryManagerMode.RESTOCKING)
            and self.__mode is not InventoryManagerMode.IDLE
        ):
            raise err.InvalidModeError(
                "Mode must be IDLE before changing to TRANSACTION or RESTOCKING, not"
                + InventoryManagerMode.IDLE.name,
            )

        self.__mode = new_mode
        VendingMachines.set_mode(self.hardware_id, new_mode)

    def get_stock_information(self, show_empty_slots: bool = False) -> str:
        out = ""

        for r in range(len(self.__items)):
            for c in range(len(self.__items[0])):
                item: Item = self.__items[r][c]
                if item is None:
                    if show_empty_slots:
                        out += f"{r}{c}: <EMPTY>\n"
                elif (item.get_stock() != 0) or show_empty_slots:
                    out = (
                        out + f"{r}{c}: "
                        f"{item.get_name()}, "
                        f"Price: {item.get_cost()}, "
                        f"Left in Stock: {item.get_stock()}\n"
                    )

        return out.strip()

    def change_stock(self, slot_name: str, item_stock: int) -> float:
        itemrow, itemcol = self.__get_coordinates_from_slotname(slot_name)

        item: Item = self.__items[itemrow][itemcol]
        if item is None:
            raise err.EmptySlotError("No item at slot " + slot_name)
        item.adjust_stock(item_stock)

        self.__change_log[slot_name] = item

        if item_stock < 0:
            return round(-1 * item_stock * item.get_cost(), 2)
        return 0

    def add_item(self, slot_name: str, item_name: str, item_stock: int, item_cost: float) -> None:
        itemrow, itemcol = self.__get_coordinates_from_slotname(slot_name)
        new_item: Item = Item(item_name, item_cost, item_stock)
        self.__items[itemrow][itemcol] = new_item
        self.__change_log[slot_name] = new_item

    def clear_slot(self, slot_name: str) -> None:
        itemrow, itemcol = self.__get_coordinates_from_slotname(slot_name)
        self.__items[itemrow][itemcol] = None
        self.__change_log[slot_name] = None

    def set_cost(self, slot_name: str, new_cost: float) -> None:
        itemrow, itemcol = self.__get_coordinates_from_slotname(slot_name)

        item: Item = self.__items[itemrow][itemcol]
        if item is None:
            raise err.EmptySlotError("No item at slot " + slot_name)

        item.set_cost(new_cost)
        self.__change_log[slot_name] = item

    def get_item(self, slot_name: str) -> Item:
        itemrow, itemcol = self.__get_coordinates_from_slotname(slot_name)

        item: Item = self.__items[itemrow][itemcol]
        if item is None:
            raise err.EmptySlotError("No item at slot " + slot_name)

        return item

    def __get_coordinates_from_slotname(self, slot_name: str) -> tuple[int, int]:
        if len(slot_name) != self.SLOTNAMELENGTH:
            raise err.InvalidSlotNameError("Slot name must be 2 characters long")
        row: int = ord(slot_name[0]) - ord("0")
        col: int = ord(slot_name[1]) - ord("0")

        if row < 0 or col < 0 or row > len(self.__items) or col > len(self.__items[0]):
            raise err.InvalidSlotNameError("Invalid slot name")

        return row, col
