import inventory_manager


class VendingMachine:
    """Item management logic for vending machine.

    Attributes
    ----------
    inv_man: inventory_manager.InventoryManager
        Instance of InventoryManager class that manages vending machine inventory
    stripe_payment_token: str
        Token used to call Stripe API
    transaction_in_progress: bool
        Signifies whether a transaction is currently in progress
    transaction_price: float
        The total price of the current ongoing transaction
    restocking_in_progress: bool
        Signifies whether machine is currently being restocked

    Methods
    -------
    def list_options(self, show_empty_slots = False) -> str
        Returns a string representation of the inventory of the vending machine
        Optionally show all slots with 0 stock
    def start_transaction(self) -> None
        Only callable if transaction_in_progress is False
        Sets "transaction_in_progress" to true
        Calls Stripe API to get stripe_payment_token for api calls
    def buy_item(self, slot_name) -> None
        Only callable if transaction_in_progress is True
        Dispense item selected
        Update stock information and database (might happen in inventory_manager implementation)
        Add price of item to transaction_price
    def end_transaction(self) -> None
        Only callable if transaction_in_progress is True
        Use Stripe API to charge user's payment method with transaction_price
        Clear transaction_price and stripe_payment_token
        Set transaction_in_progress to False
    def start_restocking(self) -> None
        Only callable if transaction_in_progress is False
        Only callable if restocking_in_progress is False
        Sets restocking_in_progress to True
        Makes all restocking functions callable (restock slot)
    def adjust_slot_stock(self, slot_name, adjustment_value) -> None
        Only callable if restocking_in_progress is True
        Used to add or remove items to a slot's stock
    def clear_slot(self, slot_name) -> None
        Only callable if restocking_in_progress is True
        Used to remove an item from a slot
    def add_item(self, slot_name, item_name, item_cost, item_stock) -> None
        Only callable if restocking_in_progress is True
        Add an item to an empty slot or override current item
    def set_cost(self, slot_name, new_cost) -> None
        Only callable if restocking_in_progress is True
        Update the cost of an existing item to new_cost
    def end_restocking(self) -> None
        Only callable if restocking_in_progress is True
        Sets restocking_in_progress back to False

    """

    def __init__(self, rows: int, cols: int):
        self.inv_man = inventory_manager.InventoryManager(rows, cols)
        self.stripe_payment_token: str = None
        self.transaction_in_progress: bool = False
        self.restocking_in_progress: bool = False
        self.transaction_price: float = 0


    def list_options(self, show_empty_slots: bool = False) -> str:
        return self.inv_man.get_stock_information(show_empty_slots=show_empty_slots)


    def start_transaction(self) -> None:
        if(self.restocking_in_progress is True):
            raise ValueError("Cannot start transaction while restocking in progress")
        if(self.transaction_in_progress is True):
            raise ValueError("Transaction has already been started")
        self.transaction_in_progress = True

        # stripe API implementation to log user in and obtain API token
        # self.stripe_payment_token = <API token>


    def buy_item(self, slot_name: str) -> None:
        if(not self.transaction_in_progress):
            raise ValueError("buy_item() can only be called when transaction is in progress. "\
                             "Call start_transaction() first")

        purchase_price = self.inv_man.change_stock(slot_name, -1)
        self.transaction_price = round(self.transaction_price + purchase_price, 2)


    def end_transaction(self) -> None:
        if(not self.transaction_in_progress):
            raise ValueError("Transaction is not currently in progress, start a transaction first")

        # Use stripe API to charge self.transaction_price with self.stripe_payment_token
        self.transaction_price = 0
        self.stripe_payment_token = None

        self.transaction_in_progress = False


    def start_restocking(self) -> None:
        if(self.restocking_in_progress is True):
            raise ValueError("Restocking has already been started")
        if(self.transaction_in_progress is True):
            raise ValueError("Cannot start restocking while transaction in progress")

        self.restocking_in_progress = True


    def adjust_slot_stock(self, slot_name: str, adjustment_value: int) -> None:
        if(not self.restocking_in_progress):
            raise ValueError("adjust_slot_stock() can only be called when restocking. "\
                             "Call start_restocking() first")

        self.inv_man.change_stock(slot_name, adjustment_value)


    def clear_slot(self, slot_name: str) -> None:
        if(not self.restocking_in_progress):
            raise ValueError("clear_slot() can only be called when restocking. "\
                             "Call start_restocking() first")

        self.inv_man.clear_slot(slot_name)


    def add_item(self, slot_name: str, item_name: str, item_cost: float, item_stock: int) -> None:
        if(not self.restocking_in_progress):
            raise ValueError("add_item() can only be called when restocking. "\
                             "Call start_restocking() first")

        self.inv_man.add_item(slot_name, item_name, item_stock, item_cost)


    def set_cost(self, slot_name: str, new_cost: float) -> None:
        if(not self.restocking_in_progress):
            raise ValueError("set_cost() can only be called when restocking. "\
                             "Call start_restocking() first")

        self.inv_man.set_cost(slot_name, new_cost)


    def end_restocking(self) -> None:
        if(not self.restocking_in_progress):
            raise ValueError("Restocking is not currently in progress, start restocking first")

        self.restocking_in_progress = False
