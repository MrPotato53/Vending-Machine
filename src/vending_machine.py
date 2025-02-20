import src.exceptions as err
from src.enums import InventoryManagerMode
from src.inventory_manager import InventoryManager


class VendingMachine:
    """Item management logic for vending machine.

    Attributes
    ----------
    inv_man: InventoryManager
        Instance of InventoryManager class that manages vending machine inventory
    stripe_payment_token: str
        Token used to call Stripe API
    transaction_price: float
        The total price of the current ongoing transaction

    Methods
    -------
    def list_options(self, show_empty_slots = False) -> str
        Returns a string representation of the inventory of the vending machine
    def start_transaction(self) -> None
        Only callable if mode of inv_man is IDLE
        Sets mode of inv_man to TRANSACTION
        Calls Stripe API to get stripe_payment_token for api calls
    def buy_item(self, slot_name) -> str
        Only callable if mode of inv_man is TRANSACTION
        Dispense item selected
        Update stock information and database (might happen in inventory_manager implementation)
        Add price of item to transaction_price
        Returns name of item that was purchased
    def end_transaction(self) -> float
        Only callable if mode of inv_man is TRANSACTION
        Use Stripe API to charge user's payment method with transaction_price
        Clear transaction_price and stripe_payment_token
        Sets mode of inv_man to IDLE
        Returns total purchase price

    """

    def __init__(self, inventory_manager: InventoryManager):
        self.__inv_man = inventory_manager
        self.__stripe_payment_token: str = None
        self.__transaction_price: float = 0


    def list_options(self) -> str:
        return self.__inv_man.get_stock_information()


    def start_transaction(self) -> None:
        # set_mode will check that mode is in correct state(IDLE), throws error otherwise
        self.__inv_man.set_mode(InventoryManagerMode.TRANSACTION)

        # stripe API implementation to log user in and obtain API token
        # self.stripe_payment_token = <API token>


    def buy_item(self, slot_name: str) -> str:
        if(self.__inv_man.get_mode() is not InventoryManagerMode.TRANSACTION):
            raise err.InvalidModeError("buy_item() can only be called when transaction is "\
                             "in progress. Call start_transaction() first")

        purchase_price = self.__inv_man.change_stock(slot_name, -1)
        self.__transaction_price = round(self.__transaction_price + purchase_price, 2)
        return self.__inv_man.get_item(slot_name).get_name()


    def end_transaction(self) -> float:
        # This check is necessary because we want to make sure inv_man is in the correct state but
        # we want to change to IDLE only AFTER all operations (api and variables reset) are done.
        if(self.__inv_man.get_mode() is not InventoryManagerMode.TRANSACTION):
            raise err.InvalidModeError("Transaction is not currently in progress, "\
                                       "start a transaction first")

        # Use stripe API to charge self.transaction_price with self.stripe_payment_token
        out = self.__transaction_price
        self.__transaction_price = 0
        self.__stripe_payment_token = None

        self.__inv_man.set_mode(InventoryManagerMode.IDLE)
        return out
