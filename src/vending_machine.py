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
    def list_options() -> str
        Returns a string representation of the inventory of the vending machine
    def start_transaction() -> None
        Sets "transaction_in_progress" to true
        Calls Stripe API to get stripe_payment_token for api calls
    def buy_item() -> None
        Only callable if transaction_in_progress is True
        Dispense item selected
        Update stock information and database (might happen in inventory_manager implementation)
        Add price of item to transaction_price
    def end_transaction() -> None
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
            raise 
        self.transaction_in_progress