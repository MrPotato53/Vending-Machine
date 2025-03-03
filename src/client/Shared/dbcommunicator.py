import requests
import json

machines = "http://localhost:8080/vending-machines"

class vendingMachines:  
    def getMachines():
        response = requests.get(machines)
        text = response.json()
        print("hello my name is ", text[0].get('vm_name'), "and I am vending machine number ", text[0].get("vm_id"))
    
    #def rmMachine(self)->str:
        #Remove vending machine from service
    
def main():
    vendingMachines.getMachines();

    #def getAllInv(self)->str:
        #Get all inventory of give VM

    #def updateInv(self,  json.items)->str:
        #

    #def paymentStage(amount:float,currency:str, Number:float):
    
    # payment_intent = stripe.PaymentIntent.create(
    #        amount=1099,
    #        currency="usd",
    #        payment_method_data={
    #            "type": "card",
    #            "card": {
    #                "token": "tok_visa"
    #            }
    #       
main()