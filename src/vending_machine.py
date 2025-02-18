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

    Methods
    -------
    def list_options(self) -> str
        Returns a string representation of the inventory of the vending machine
    def start_transaction(self) -> None
        Sets "transaction_in_progress" to true
        Calls Stripe API to get stripe_payment_token for api calls
    def buy_item(self, slot_name) -> None
        Only callable if transaction_in_progress is True
        Dispense item selected
        Update stock information and database (might happen in inventory_manager implementation)
        Add price of item to transaction_price
    def end_transaction(self) -> None
        Use Stripe API to charge user's payment method with transaction_price
        Clear transaction_price and stripe_payment_token
        Set transaction_in_progress to False

    """

    def __init__(self, rows: int, cols: int):
        self.inv_man = inventory_manager.InventoryManager(rows, cols)
        self.stripe_payment_token: str = None
        self.transaction_in_progress: bool = False
        self.transaction_price: float = 0


    def list_options(self) -> str:
        return self.inv_man.get_stock_information()


    def start_transaction(self) -> None:
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
