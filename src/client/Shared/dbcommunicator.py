import requests
import json

machines = "http://localhost:8080/vending-machines"

class vendingMachines:  
    def getMachines():
        response = requests.get(machines)
        return response
    
    def rmMachine(char vm_ID):
        #Remove vending machine from service

    def getAllInv(char vm_ID):
        #Get all inventory of give VM

    def updateInv(char vm_ID, list json.items):
        #

    def paymentStage(float amount, char currency, card Number):
    
    # payment_intent = stripe.PaymentIntent.create(
    #        amount=1099,
    #        currency="usd",
    #        payment_method_data={
    #            "type": "card",
    #            "card": {
    #                "token": "tok_visa"
    #            }
    #        },