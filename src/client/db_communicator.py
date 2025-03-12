#TODO: put into env file
import requests
import json
import stripe

host = "http://cs506x19.cs.wisc.edu:8080" #cs CLI machine hosting the DB
localHost = "http://localhost:8080" #For local testing
machines = "/vending-machines" #API route for the related class
inventory = "/inventory"
items = "/items"#API route for items
headers = {'Content-Type':'application/json'} #header for api post



#This class should only be used in the inventory manager file allowing complete filtered request
#to be made to the server side mySQL on the docker.

#Class for all api calls pertaining to vending machine IDs and set up
#Does not contain inventory api calls
class vms:  

    #Pull all VMs
    def get_machines():
        response = requests.get(host+machines)
        if(response.status_code !=200):
            return (response.status_code)
        text = json.loads(response)
        return text
    
    #Pull specific VM based on the UNIQUEID on the Vending_machines table
    def get_single_machine(id:str):
        response = requests.get(host+machines+"/"+id)
        if(response.status_code !=200):
            print("vending machine",id," not found.")
            return
        text = json.loads(response)
        return text
    
    #Insert new machine into the Vending_machines table 
    #example machine json format [vm_id:id, vm_name"name, vm_row_count:cnt, vm_column_count:cnt, vm_mode:mode]
    #Directly relates to columns in mySQL server
    def post_machine(id:str, name:str, row:int, column:int, vm_mode:str):
        newInfo = {
            'vm_id':id,
            'vm_name':name,
            'vm_row_count':row,
            'vm_column_count': column,
            'vm_mode':vm_mode
        }
        response = requests.post(host+machines, data=newInfo,headers=headers)
        if(response.status_code !=200):
            return (response.status_code)     
        text = json.loads(response)
        return text
    
    
    #Remove a specific machine based on it's UNIQUEID on the VM table
    def delete_machine(id:str):
        response = requests.delete(host+machines+"/"+id)
        text = response.json()
        if(response.status_code != 200):
            return (response.status_code)
        return text

    #enum_types of MODE: i, r, t
    def alter_mode(id:str,mode:str):
        response = requests.patch(host+machines+'/'+id+'/mode', data=mode, headers=headers)
        if(response.status_code !=200):
            return(response.status_code)       
        text = json.loads(response)
        return text

    #Update name of a machine by ID
    def alter_name(id:str, name:str):
        response = requests.patch(host+machines+'/'+id+'/name', data=name, headers=headers)
        if(response.status_code != 200):
            return(response.status_code)
        text = json.loads(response)
        return text
    
class allItems:
    #Query all available items for stocking
    def get_items():
        response = requests.get(host+items)
        if(response.status_code != 200):
            return(response.status_code)
        text = json.loads(response)
        return text

#Class for items within specific machines
class vmItems:
    def  get_items(id:str):
        inventory_route = host+machines+'/'+id+inventory
        response = requests.get(inventory_route)
        if(response.status_code != 200):
            return(response.status_code)
        text = json.loads(response)
        return text
    
    def add_to_slot(id:str,slot_name:str):
        inventory_route = host+machines+'/'+id+inventory
        response = requests.get(inventory_route+'/'+slot_name)
        if(response.status_code != 200):
            return(response.status_code)
        text = json.loads(response)
        return text

    #{item_name, price, stock}
    #TODO: takes whole update json as input 
    def update_item_in_slot(id:str, slot_name:str, item:str):
        inventory_route = host+machines+'/'+id+inventory
        response = requests.patch(inventory_route+ '/'+slot_name, data=items, headers=headers)
        if(response.status_code != 200):
            return(response.status_code)
        text = json.loads(response)
        return text

    def delete_item_in_slot(id:str, slot_name:str, item:str):
        inventory_route = host+machines+'/'+id+inventory
        response = requests.delete(inventory_route + '/'+slot_name, data= item, headers=headers)
        if(response.status_code != 200):
            return(response.status_code)
        text = json.loads(response)
        return text

    def update_vm_inv(id:str,inventory:str):
        inventory_route = host+machines+'/'+id+inventory
        response = requests.post(inventory_route, data=inventory, headers=headers)
        if(response.status_code != 200):
            return(response.status_code)
        text = json.loads(response)
        return text
    
   
class stripe:
    def create_payment_token(card_number, exp_month, exp_year, cvc):
        try:
            token = stripe.Token.create(
            card={
                'number': card_number,
                'exp_month': exp_month,
                'exp_year': exp_year,
                'cvc': cvc,
            }
            )
            return token.id # Send this to the backend
        except stripe.error.StripeError as e:
            return str(e)

func_dict = {
        'get_machines': vms.get_machines,
        'get_single_machine': vms.get_single_machine,
        'post_machine': vms.post_machine,
        'delete_machine': vms.delete_machine,
        'alter_mode': vms.alter_mode,
        'alter_name': vms.alter_name,
        'get_items': allItems.get_items,
        'get_vm_items': vmItems.get_items,
        'add_to_slot': vmItems.add_to_slot,
        'update_item_in_slot': vmItems.update_item_in_slot,
        'delete_item_in_slot': vms.delete_machine,
        'update_vm_inv': vmItems.update_vm_inv,
        'create_payment_token': stripe.create_payment_token
}

param_dict = {
    'get_machines': "none",
    'get_single_machine': "id",
    'post_machine': "id:str, name:str, row:int, column:int, vm_mode:str",
    'delete_machine': "id",
    'alter_mode': "id, mode(i, j, t)",
    'alter_name': "id, name",
    'get_items': "none",
    'get_vm_items': "id",
    'add_to_slot': "id, slot_name",
    'update_item_in_slot': "id, slot_name",
    'delete_item_in_slot': "id:str, slot_name:str, item:str",
    'update_vm_inv': "id:str,update:str",
    'create_payment_token': "card_number, exp_month, exp_year, cvc"
}

def switch_case(case, *args):
    
    # Get the function from the dictionary
    func = func_dict.get(case)
    if func:
        return func(*args)
    else:
        raise ValueError(f"Invalid case: {case}")

    
#Main provides example calls and output for each function. Providing the current
#machines on the DB to inform the user. 
#If you are having issues understanding the response utilize this. 
def main():
    cont = 1
    while(cont):
      
        print("This file contains three classes for DB comunication.")
        for i in func_dict:
            print("Function: ", i)
            
        func = input(str("What function and args would you like to test:"))
        print(param_dict.get(func))

        args = input(str("What args would you like to use:"))
        
        switch_case(func, args)
        
        cont = input(int("Would you like to continue testing?(enter 1)"))
        
        
main()