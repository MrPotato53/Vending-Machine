import requests
import json
host = "http://cs506x19.cs.wisc.edu:8080" #cs CLI machine hosting the DB
localHost = "http://localhost:8080" #For local testing
machines = "/vending-machines" #API route for the related class
headers = {'Content-Type':'application/json'} #header for api post

#This class should only be used in the inventory manager file allowing complete filtered request
#to be made to the server side mySQL on the docker.

#Class for all api calls pertaining to vending machine IDs and set up
#Does not contain inventory api calls
class vendingMachines:  

    #Pull all VMs
    def getMachines():
        response = requests.get(host+machines)
        text = response.json()
        if(response.status_code !=200):
            return (response.status_code)
        return text
    #Pull specific VM based on the UNIQUEID on the Vending_machines table
    def getSingleMachine(id:str):
        response = requests.get(host+machines+"/"+id)
        if(response.status_code !=200):
            print("vending machine",id," not found.")
            return
        text = response.json()
        return text
    #Insert new machine into the Vending_machines table 
    #example machine json format [vm_id:id, vm_name"name, vm_row_count:cnt, vm_column_count:cnt, vm_mode:mode]
    #Directly relates to columns in mySQL server
    def postMachine(newInfo:str):
        response = requests.post(host+machines, data=newInfo,headers=headers)
        text = response.json()
        if(response.status_code !=200):
            return (response.status_code)
        return text
    #Remove a specific machine based on it's UNIQUEID on the VM table
    def rmMachine(id:str):
        response = requests.delete(host+machines+"/"+id, headers=headers)
        text = response.json()
        if(response.status_code != 200):
            return (response.status_code)
        return text

    #Future api calls to be made. Not currently on the server end

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


    
#Main provides example calls and output for each function. Providing the current
#machines on the DB to inform the user. 
#If you are having issues understanding the response utilize this. 
def main():
    print('Present vending machines:')
    text = vendingMachines.getMachines()

    for i in range(len(text)):
        print(text[i].get('vm_name'), text[i].get('vm_id'))

    #Example of post method, requires example data for a theoretical post
    #The provided example machine is deleted after the example
    postIf = str(input("Are we testing the post method?")).upper()
    if(postIf == "YES"):      
        print('New vending machine. Requires id, name, rown count, column count, mode')
        id = int(input("Provide new ID:"))
        name = str(input("Provide a new name:"))
        row_count = int(input("Provide a row count:"))
        column_count = int(input("Provide a column count:"))
        machine1 = json.dumps({'vm_id':id, 'vm_name':name, 'vm_row_count':row_count, 'vm_column_count':column_count, 'vm_mode':"i"})
        print(vendingMachines.postMachine(machine1))
        vendingMachines.rmMachine(machine1.get("vm_id"))

    #Remove post text machine
    singleGetIf = str(input("\n Would you like to retrieve by ID?")).upper()
    #Example of single call method
    if(singleGetIf == "YES"):
        queryID = str(input("Which ID would you like to query? "))
        print(vendingMachines.getSingleMachine(queryID))
    #Example of delete method
    #WARNING will delete the given machine
    deleteIf = str(input("Do you want to test the delete method?, This will remove the given ID")).upper()
    if(deleteIf=='YES'):
        removeID = str(input("Which machine would you like to delete?"))
        print(vendingMachines.rmMachine(removeID))

