import asyncio

from customer.Hardware.hardware_constants import CARD_INFO_KEY, DELETE_KEY, DISPENSE_KEY
from customer.hardware_manager import HardwareManager
from customer.vending_machine import VendingMachine


class VendingMachineHardware:
    def __init__(self) -> None:
        self.current_input_string = None

    async def keypad_moniter(self):
        await hardware_manager.start()
        try:
            while True:
                key = await hardware_manager.read_keypad_input()
                print(key)
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


if __name__ == "__main__":
    vending_machine = VendingMachine(rows=1, columns=3, hardware_id="REALVM", name="Physical_VM")

    inv_manager = vending_machine.inv_man
    hardware_manager = HardwareManager(inv_manager)

    vending_machine = VendingMachineHardware()
    asyncio.run(vending_machine.keypad_moniter())
