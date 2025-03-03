import requests
import json
host = "http://cs506x19.cs.wisc.edu:8080"
localHost = "http://localhost:8080"
machines = "/vending-machines"
singleMachine = "/:id"
headers = {'Content-Type':'application/json'}
#post   
class vendingMachines:  
    def getMachines():
        response = requests.get(host+machines)
        text = response.json()
        #print(text)
        print("hello my name is ", text[0].get('vm_name'), "and I am vending machine number ", text[0].get("vm_id"))
    
    #def rmMachine(self)->str:
        #Remove vending machine from service
    
    #example  [vm_id:id, vm_name"name, vm_row_count:cnt, vm_column_count:cnt, vm_mode:mode]
    def postMachine(id:str):
        response = requests.post(host+machines, data=id,headers=headers)
        test = response.text
        print(test)
def main():
    vendingMachines.getMachines()

    machine1 = json.dumps({'vm_id':"01", 'vm_name':"George", 'vm_row_count':42, 'vm_column_count':42, 'vm_mode':"i"})
    print(machine1)
    vendingMachines.postMachine(machine1)
    vendingMachines.getMachines()

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