import asyncio
import json
import sys

import exceptions as err
from customer.Hardware.hardware_constants import (
    CARD_INFO_KEY,
    DELETE_KEY,
    DISPENSE_KEY,
    END_TRANSACTION_KEY,
    I2C_ADDR,
    KEYPAD_COL_PINS,
    KEYPAD_LAYOUT,
    KEYPAD_ROW_PINS,
    LCD_BACKLIGHT,
    LCD_CHR,
    LCD_CMD,
    LCD_E_DELAY,
    LCD_E_PULSE,
    LCD_ENABLE,
    LCD_LINE_1,
    LCD_LINE_2,
    LCD_WIDTH,
    STEP_DELAY,
    STEP_SEQUENCE,
    STEPPER_1_PINS,
    STEPPER_2_PINS,
    STEPPER_3_PINS,
    STEPS_PER_QUARTER_REV,
)
from customer.Hardware.stepper_motors import StepperMotor
from customer.vending_machine import VendingMachine
from dispense_manager import DispenserManager
from display_manager import DisplayManager
from input_manager import InputManager


class VendingMachineRunner:
    def __init__(
        self,
        input_mgr: InputManager,
        display_mgr: DisplayManager,
        dispenser_mgr: DispenserManager,
        config_file: str,
    ) -> None:
        self.input = input_mgr
        self.display = display_mgr
        self.dispenser = dispenser_mgr
        self.input_string = ""
        self.vending_machine: VendingMachine = None

        with open(config_file) as file:  # noqa: PTH123
            data = json.load(file)
            row = data["rows"]
            col = data["columns"]
            hardware_id = data["hardware_id"]

            try:
                self.vending_machine = VendingMachine(row, col, hardware_id)
            except err.InvalidDimensionsError as e:
                print("Error: ", e)
                sys.exit(1)
            except err.QueryFailureError as e:
                print("Error: ", e)
                sys.exit(1)

    async def run(self):
        await self.input.start()
        await self.display.start()
        try:
            await self.run_default_state()
        finally:
            await self.input.close()

    async def run_default_state(self):
        # Endlessly run default state and execute based on inputs accordingly
        while True:
            input_string = await self.get_and_display_input(
                f"CHOOSE SLOT OR {CARD_INFO_KEY}",
                "",
                {CARD_INFO_KEY},
            )
            print("input: ", input_string)
            if input_string is CARD_INFO_KEY:
                # Card info key is pressed, transaction start
                await self.perform_transaction()
            else:
                try:
                    # Free item is chosen, dispense
                    await self.dispense_free_item(input_string)
                except err.NotFreeItemError:
                    # Normal item is chosen, show price (can't dispense unless transaction start)
                    await self.display.show_text(
                        str(self.vending_machine.get_price(input_string)),
                        LCD_LINE_1,
                    )
                    await asyncio.sleep(2)

    async def dispense_free_item(self, selection: str):
        try:
            # Dispense item in software
            dispensed_item = self.vending_machine.buy_free_item(selection)

            # If successfully dispensed in software, dispense in hardware
            await self.display.show_text("Dispensing Item: " + selection, LCD_LINE_1)
            row, col = self.vending_machine.inv_man.get_coordinates_from_slotname(selection)
            await self.dispenser.dispense(row, col)
            print("Dispensing Item: " + dispensed_item)
        except err.NegativeStockError:
            print("Item at this slot is out of stock, please try another.")
            await self.display.show_text("OUT OF STOCK", LCD_LINE_1)
            await asyncio.sleep(1)
        except err.EmptySlotError as e:
            await self.display.show_text("OUT OF STOCK", LCD_LINE_1)
            print("Error: ", e)
            await asyncio.sleep(1)
        except err.InvalidSlotNameError as e:
            await self.display.show_text("INVALID SLOT", LCD_LINE_1)
            print("Error: ", e)
            await asyncio.sleep(1)

    async def perform_transaction(self):
        await self.display.show_text("ENTERING PAYMENT", LCD_LINE_1)

        try:
            self.vending_machine.start_transaction()
            # All the stripe API payment stuff should happen inside here ^^
        except err.InvalidModeError as e:
            print("Error: " + str(e))
            return

        print("Payment Information Entered...")

        # Endlessly ask user to input slot to dispense, or end transaction
        while True:
            selection = await self.get_and_display_input(
                "ENTER SLOT OR " + END_TRANSACTION_KEY,
                "",
                {END_TRANSACTION_KEY},
            )

            # End transaction
            if selection is END_TRANSACTION_KEY:
                try:
                    charged_value = str(self.vending_machine.end_transaction())
                    await self.display.show_text(f"CHARGED {charged_value}", LCD_LINE_1)
                    print(f"Payment method was charged {charged_value}")
                except err.QueryFailureError as e:
                    print("Error: ", e)
                return

            try:
                # Dispense item in software
                dispensed_item = self.vending_machine.buy_item(selection)

                # Dispense item in hardware
                await self.display.show_text("Dispensing Item: " + dispensed_item, LCD_LINE_1)
                row, col = self.vending_machine.inv_man.get_coordinates_from_slotname(selection)
                await self.dispenser.dispense(row, col)
                print("Dispensing Item: " + dispensed_item)
            except err.NegativeStockError:
                print("Item at this slot is out of stock, please try another.")
                await self.display.show_text("OUT OF STOCK", LCD_LINE_1)
                await asyncio.sleep(1)
            except err.EmptySlotError as e:
                print("Error: ", e)
                await self.display.show_text("OUT OF STOCK", LCD_LINE_1)
                await asyncio.sleep(1)
            except err.InvalidSlotNameError as e:
                print("Error: ", e)
                await self.display.show_text("INVALID SLOT", LCD_LINE_1)
                await asyncio.sleep(1)

    async def get_and_display_input(self, line1: str, line2: str, return_keys: list[str]) -> str:
        await self.display.show_text(line1, LCD_LINE_1)
        await self.display.show_text(line2, LCD_LINE_2)
        input_string = ""

        while True:
            key = await self.input.get_key()
            print(f"Key: {key}")
            if key == DISPENSE_KEY:
                print(input_string)
                return input_string

            if key in return_keys:
                return key

            if key == DELETE_KEY:
                input_string = input_string[:-1]

            else:
                input_string += key

            await self.display.show_text(input_string, LCD_LINE_2)


if __name__ == "__main__":
    input_mgr = InputManager(KEYPAD_LAYOUT, KEYPAD_ROW_PINS, KEYPAD_COL_PINS)
    display_mgr = DisplayManager(
        {
            "i2c_addr": I2C_ADDR,
            "width": LCD_WIDTH,
            "line_1": LCD_LINE_1,
            "line_2": LCD_LINE_2,
            "lcd_chr": LCD_CHR,
            "lcd_cmd": LCD_CMD,
            "backlight": LCD_BACKLIGHT,
            "enable_flag": LCD_ENABLE,
            "e_pulse": LCD_E_PULSE,
            "e_delay": LCD_E_DELAY,
        },
    )

    dispenser_mgr = DispenserManager(
        [
            [
                StepperMotor(STEPS_PER_QUARTER_REV, STEP_DELAY, STEP_SEQUENCE, STEPPER_1_PINS),
                StepperMotor(STEPS_PER_QUARTER_REV, STEP_DELAY, STEP_SEQUENCE, STEPPER_2_PINS),
                StepperMotor(STEPS_PER_QUARTER_REV, STEP_DELAY, STEP_SEQUENCE, STEPPER_3_PINS),
            ],
        ],
    )

    config_file = "customer/configuration.json"

    vm_hw = VendingMachineRunner(input_mgr, display_mgr, dispenser_mgr, config_file)
    asyncio.run(vm_hw.run())
