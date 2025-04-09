import asyncio

from hardware_manager import HardwareManager
from vending_machine import VendingMachine

vending_machine = VendingMachine(rows=1, columns=3, hardware_id="REALVM", name="Physical_VM")

inv_manager = vending_machine.__inv_man
hardware_manager = HardwareManager(inv_manager)


if __name__ == "__main__":
    key = asyncio.run(hardware_manager.read_keypad_input())
    print(key)
