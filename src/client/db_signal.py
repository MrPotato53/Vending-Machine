from __future__ import annotations  # noqa: INP001

import db_communicator


class VendingMachines:
    """Class exposed to inventory_manager and higher for vending machine database access.

    Methods
    -------
    vending_machine_exists(id:str)
        Checks whether vending machine exists in database
    get_vending_machine(hardware_id: str)
        Returns vending machine in json format specified by ID
    create_vending_machine(
            hardware_id: str, rowCount: int, columnCount: int, name:str = None, mode: str = "i")
        Create a new database entry for a vending machine
    set_mode(hardware_id:str, new_mode: str)
        Set the operating mode of vending machine in database
    rename(hardware_id:str, new_name: str)
        Set the name of the vending machine in database
    delete_vending_machine(hardware_id:str)
        Delete vending machine from database along with all corresponding inventory information

    """

    @staticmethod
    def vending_machine_exists(hardware_id:str) -> bool:
        return VendingMachines.get_vending_machine(hardware_id) is not None

    @staticmethod
    def get_vending_machine(hardware_id:str) -> (dict | None):
        return db_communicator.VMs.get_single_machine(hardware_id)

    @staticmethod
    def create_vending_machine(
        hardware_id:str, row_count:int, column_count:int, name:str | None = None, mode:str = "i",
        ) -> (dict | None):
        if(VendingMachines.vending_machine_exists(hardware_id)):
            return None
        return db_communicator.VMs.post_machine(hardware_id,name, row_count, column_count, mode)

    @staticmethod
    def set_mode(hardware_id:str, new_mode:str) -> (dict | None):
       if(VendingMachines.vending_machine_exists(hardware_id)):
            return db_communicator.VMs.alter_mode(hardware_id, new_mode)
       return None

    @staticmethod
    def rename(hardware_id:str, new_name:str) -> (dict | None):
         if(VendingMachines.vending_machine_exists(hardware_id)):
            return db_communicator.VMs.alter_name(hardware_id, new_name)
         return None

    @staticmethod
    def delete_vending_machine(hardware_id:str) -> (dict | None):
        res = None
        if(VendingMachines.vending_machine_exists(hardware_id)):
            res = db_communicator.VMs.delete_machine(hardware_id)

        if(VendingMachines.vending_machine_exists(hardware_id)):
            return {"error": "Failed to delete vending machine"}
        return res


class Items:
    """Class for retrieving all stockable items.

    Methods
    -------
    get_all_items()
        Show list of all stockable items in the database

    """

    @staticmethod
    def get_all_items() -> list[str]:
        return db_communicator.AllItems.get_items()

class Inventory:
    """Class for getting and modifying the inventories of vending machines.

    Methods
    -------
    get_inventory_of_vending_machine(hardware_id: str)
        Get all items associated with a vending machine
    update_database(hardware_id: str, inventory: list[dict[str, str]])
        Upload local changes stored in change_log to database

    """

    @staticmethod
    def get_inventory_of_vending_machine(hardware_id: str) -> (list[dict] | None):
        if(VendingMachines.vending_machine_exists(hardware_id)):
            return db_communicator.VMItems.get_items(hardware_id)
        return None

    @staticmethod
    def update_database(hardware_id: str, inventory: list[dict[str, str]]) -> (dict | None):
        if(VendingMachines.vending_machine_exists(hardware_id)):
            return db_communicator.VMItems.update_vm_inv(hardware_id, inventory)
        return None


class Stripe:
    """Class for processing payments.

    Methods
    -------
    get_payment_token(card_number:str, exp_month:str, exp_year:int, cvc:int)
        Get a secure payment token associated with a card for payment
    charge(token: str, amount: float)
        Use the payment token to charge an amount to a customer's payment method

    """

    @staticmethod
    def get_payment_token(card_number:str, exp_month:str, exp_year:int, cvc:int) -> str:
        return db_communicator.Stripe.create_payment_token(card_number, exp_month, exp_year, cvc)

    @staticmethod
    def charge(token: str, amount: float) -> (dict | None):
        return db_communicator.Stripe.charge_card(amount, token)

    @staticmethod
    def make_payment(
        card_number:str, exp_month:str, exp_year:int, cvc:int, amount:float,
        ) -> (dict | None):
        return Stripe.charge(
            Stripe.get_payment_token(card_number, exp_month, exp_year, cvc), amount)
