#TODO wrapper file to streamline calls and perform multi request actions
#   abstraction of calls
#   This would also provide a means to do fuzzy complete with items
#   A dev interface for data manipulation on user side. 

'''vendingMachines.get_vending_machine(id: str) (Used inside inventory_manager.py) (return null if vending machine DNE)
VendingMachines.create_vending_machine(id: str, rowCount: int, columnCount: int) -> None (vm name will be Null and mode will be i)    (Used inside inventory_manager.py)
VendingMachines.set_mode(newMode: char)             (Used inside inventory_manager.py)
VendingMachines.rename(newName: str)                  (Used by vendor side only)
VendingMachines.deleteVendingMachine(id: str)      (Used by vendor side only)
Items.getAllItems() -> str[]
Inventory.get_inventory_of_vending_machine(id: str) -> dict[] (basically list of objects with fields “slot_name”, “item_name”, “price”, “stock”)
Intentory.update_database(it: str, inventory: list of objects with fields “slot_name”, “item_name”, “price”, “stock”)
Stripe.get_payment_token(card_number, exp_month, exp_year, cvc)
EXAMPLE OF THIS:
import stripe
stripe.api_key = “your_stripe_publishable_key” # Use your public key
def create_payment_token(card_number, exp_month, exp_year, cvc):
  try:
    token = stripe.Token.create(
      card={
        “number”: card_number,
        “exp_month”: exp_month,
        “exp_year”: exp_year,
        “cvc”: cvc,
      }
    )
    return token.id # Send this to the backend
  except stripe.error.StripeError as e:
    return str(e)
Stripe.charge(paymentToken, amount) '''