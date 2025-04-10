import asyncio

from customer.Hardware.hardware_constants import (
    CARD_INFO_KEY,
    DELETE_KEY,
    DISPENSE_KEY,
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
    VALID_SLOT_KEYS,
)
from customer.Hardware.stepper_motors import StepperMotor
from customer.vending_machine import VendingMachine
from dispense_manager import DispenserManager
from display_manager import DisplayManager
from input_manager import InputManager


class VendingMachineHardware:
    def __init__(
        self,
        input_mgr: InputManager,
        display_mgr: DisplayManager,
        dispenser_mgr: DispenserManager,
    ) -> None:
        self.input = input_mgr
        self.display = display_mgr
        self.dispenser = dispenser_mgr
        self.current_input_string = ""

    async def run(self):
        await self.input.start()
        try:
            while True:
                key = await self.input.get_key()
                print(f"Key: {key}")
                if key == DISPENSE_KEY:
                    slot = self.current_input_string
                    self.display.show_text(f"Trying: {slot}", line=LCD_LINE_2)

                    if slot in VALID_SLOT_KEYS:
                        row, col = self.slot_to_coords(slot)
                        self.display.show_text("Dispensing", line=LCD_LINE_2)
                        await self.dispenser.dispense(row, col)

                    else:
                        self.display.show_text("Invalid slot", line=LCD_LINE_2)

                    self.current_input_string = ""

                elif key == DELETE_KEY:
                    self.current_input_string = self.current_input_string[:-1]

                elif key == CARD_INFO_KEY:
                    self.display.show_text("Card mode", LCD_LINE_2)

                else:
                    self.current_input_string += key
                    self.display.show_text(self.current_input_string)

        finally:
            await self.input.close()

    def slot_to_coords(self, slot: str) -> tuple[int, int]:
        # only 1 run for now can update to be int(slot[0])
        row = 0
        col = int(slot[1])
        return (row, col)


if __name__ == "__main__":
    vending_machine = VendingMachine(rows=1, columns=3, hardware_id="REALVM", name="Physical_VM")
    inv_manager = vending_machine.inv_man

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

    vm_hw = VendingMachineHardware(input_mgr, display_mgr, dispenser_mgr)
    asyncio.run(vm_hw.run())
