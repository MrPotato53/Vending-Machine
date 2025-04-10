import asyncio

from customer.Hardware.hardware_constants import (
    CARD_INFO_KEY,
    DELETE_KEY,
    DISPENSE_KEY,
    VALID_SLOT_KEYS,
)
from customer.hardware_manager import HardwareManager
from customer.vending_machine import VendingMachine


class VendingMachineHardware:
    def __init__(self) -> None:
        # atrribute for holding the current user input from keypad
        self.current_input_string = None

    async def keypad_moniter(self):
        await hardware_manager.start()
        try:
            while True:
                key = await hardware_manager.read_keypad_input()
                print(key)
                self.current_input_string += key
                if DISPENSE_KEY is key:
                    self.current_input_string = self.current_input_string[:-1]
                    # check that user input is valid
                    print(self.current_input_string)
                    self.current_input_string = None

                if DELETE_KEY is key:
                    self.current_input_string = self.current_input_string[:-2]

                elif CARD_INFO_KEY is key:
                    pass
                    # need to use transcation for free function
        finally:
            if hardware_manager.keypad:
                await hardware_manager.keypad.close()

    def validate_user_entry(self) -> bool:
        """Validates user selection to make sure that it is one of the valid slots."""
        return self.current_input_string in VALID_SLOT_KEYS


if __name__ == "__main__":
    vending_machine = VendingMachine(rows=1, columns=3, hardware_id="REALVM", name="Physical_VM")

    inv_manager = vending_machine.inv_man
    hardware_manager = HardwareManager(inv_manager)

    vending_machine = VendingMachineHardware()
    asyncio.run(vending_machine.keypad_moniter())
