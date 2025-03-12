from typing import Optional, List, Dict
import db_communicator

class VendingMachines:
    @staticmethod
    def checkExistence(id:str) -> bool:
        if(VendingMachines.get_vending_machine(id)!=None):
            return True
        return False
    
    @staticmethod
    def get_vending_machine(id: str) -> Optional[dict]:  
        if(VendingMachines.checkExistence(id)):
            return db_communicator.vms.get_single_machine(id)
        return None

    @staticmethod
    def create_vending_machine(id: str, rowCount: int, columnCount: int, name:str) -> str:
        if(VendingMachines.checkExistence(id)):
            return None
        return db_communicator.vms.post_machine(id,name, rowCount, columnCount)  

    def set_mode(id:str, newMode: str) -> None:
       if(VendingMachines.checkExistence(id)):
            return db_communicator.vms.alter_mode(id, newMode)
    
    def rename(id:str, newName: str) -> None:
         if(VendingMachines.checkExistence(id)):
            return db_communicator.vms.alter_name(id, newName)

    @staticmethod
    def delete_vending_machine(id: str) -> None:
        if(VendingMachines.checkExistence(id)):
            db_communicator.vms.delete_machine(id)  
        
        if(VendingMachines.checkExistence(id)):
            return "Failed"


class Items:
    @staticmethod
    def get_all_items() -> List[str]:
        return db_communicator.allItems.get_items()

class Inventory:
    @staticmethod
    def get_inventory_of_vending_machine(id: str) -> List[Dict[str, str]]:
        if(VendingMachines.checkExistence(id)):
            return db_communicator.vmItems.get_items(id)

    @staticmethod
    def update_database(id: str, inventory: List[Dict[str, str]]) -> None:
        if(VendingMachines.checkExistence(id)):
            return db_communicator.vmItems.update_vm_inv(id, inventory)  
    
    
class Stripe:
    @staticmethod
    def get_payment_token(card_number:str, exp_month:str, exp_year:int, cvc:int) -> str:
        
        return db_communicator.stripe.create_payment_token(card_number, exp_month, exp_year, cvc)  

    @staticmethod
    def charge(token: str, amount: float) -> None:
        return db_communicator.stripe.charge(token, amount)
    
    @staticmethod
    def makePayment(card_number:str, exp_month:str, exp_year:int, cvc:int, amount:float):
        return Stripe.charge(Stripe.get_payment_token(card_number, exp_month, exp_year, cvc), amount)