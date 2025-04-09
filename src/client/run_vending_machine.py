import asyncio

from customer.hardware_manager import HardwareManager
from customer.vending_machine import VendingMachine

vending_machine = VendingMachine(rows=1, columns=3, hardware_id="REALVM", name="Physical_VM")

inv_manager = vending_machine.inv_man
hardware_manager = HardwareManager(inv_manager)


async def main():
    await hardware_manager.start()
    try:
        while True:
            key = await hardware_manager.read_keypad_input()
            print(key)
            # await asyncio.sleep(0.05)
    finally:
        if hardware_manager.keypad:
            await hardware_manager.keypad.close()


if __name__ == "__main__":
    asyncio.run(main())
