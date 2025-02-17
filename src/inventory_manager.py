import item as item_module


class InventoryManager:
    """Item management logic for vending machine.

    Attributes
    ----------
    items: Item[][]
        2d List of all items

    Methods
    -------
    def get_stock_information(self, show_empty_slots) -> str
        Return a string of all stock information
    def change_stock(self, slot_name, item_stock) -> float
        Changing the stock of a slot
        Update the stock of existing item in slot. If no item, throw error
        If inputted stock < 0, return the price of items removed
        If item_name field is used:
    def add_item(self, slot_name, item_name, item_stock, item_cost) -> None
        Add new item in slot, override potentially preexisting items.
        New stock value = item_stock, because old stock is voided
    def clear_slot(self, slot_name) -> None
        Removes the item from a named slot
    def __get_coordinates_from_slotname(self, slot_name) -> tuple[int, int]
        Given a slot_name in the form of a string, returns the coordinates in items

    """

    MAXHEIGHT = 10
    MAXWIDTH = 10

    def __init__(self, height: int, width: int) -> None:
        """Initialize an InventoryManager with a 2d list of items."""
        if(height <= 0 or width <= 0 or
           height > self.MAXHEIGHT or width > self.MAXWIDTH):
            raise ValueError("Width and Height must be 0 < x < 11")
        self.items = [[None for i in range(width)] for j in range(height)]


    def get_stock_information(self, show_empty_slots: bool = False) -> str:
        out = ""

        for r in range(len(self.items)):
            for c in range(len(self.items[0])):
                item: item_module.Item = self.items[r][c]
                if(item is None):
                    if(show_empty_slots):
                        out += f"{r}{c}: <EMPTY>\n"
                elif((item.get_stock() != 0) or show_empty_slots):
                    out = (out + f"{r}{c}: " \
                        f"{item.get_name()}, " \
                        f"Price: {item.get_cost()}, " \
                        f"Left in Stock: {item.get_stock()}\n"
                    )

        return out.strip()


    def change_stock(self, slot_name: str, item_stock: int) -> float:
        itemrow, itemcol = self.__get_coordinates_from_slotname(slot_name)

        item: item_module.Item = self.items[itemrow][itemcol]
        if(item is None): raise ValueError("No item at slot " + slot_name)
        item.adjust_stock(item_stock)
        if(item_stock < 0):
            return round(-1 * item_stock * item.get_cost(), 2)
        return 0


    def add_item(self, slot_name: str, item_name: str, item_stock: int, item_cost: float) -> None:
        itemrow, itemcol = self.__get_coordinates_from_slotname(slot_name)
        new_item: item_module.Item = item_module.Item(item_name, item_cost, item_stock)
        self.items[itemrow][itemcol] = new_item


    def clear_slot(self, slot_name: str) -> None:
        itemrow, itemcol = self.__get_coordinates_from_slotname(slot_name)
        self.items[itemrow][itemcol] = None


    def __get_coordinates_from_slotname(self, slot_name: str) -> tuple[int, int]:
        if(len(slot_name) != 2): raise ValueError("Slot name must be 2 characters long")
        row: int = ord(slot_name[0]) - ord('0')
        col: int = ord(slot_name[1]) - ord('0')

        if(row < 0 or col < 0 or row > len(self.items) or col > len(self.items[0])):
            raise ValueError("Invalid slot name")

        return row, col
