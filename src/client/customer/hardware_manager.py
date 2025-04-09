from Hardware.hardware_constants import *
from Hardware.keypad import AsyncKeypad
from Hardware.LCD_display import LCDDisplay
from Hardware.stepper_motors import StepperMotor
from inventory_manager import InventoryManager


class HardwareManager:

    def __init__(self, rows: int, cols: int, inv_man: InventoryManager):
        self.motors = [[StepperMotor(STEPS_PER_QUARTER_REV, STEP_DELAY, STEP_SEQUENCE, STEPPER_1_PINS),
                   StepperMotor(STEPS_PER_QUARTER_REV, STEP_DELAY, STEP_SEQUENCE, STEPPER_2_PINS),
                   StepperMotor(STEPS_PER_QUARTER_REV, STEP_DELAY, STEP_SEQUENCE, STEPPER_3_PINS)]]

        self.keypad = AsyncKeypad(KEYPAD_LAYOUT, KEYPAD_ROW_PINS, KEYPAD_COL_PINS)
        self.lcd = LCDDisplay(
        I2C_ADDR,
        LCD_WIDTH,
        LCD_LINE_1,
        LCD_LINE_2,
        LCD_CHR,
        LCD_CMD,
        LCD_BACKLIGHT,
        LCD_ENABLE,
        LCD_E_PULSE,
        LCD_E_DELAY,
        )

        self.inv_man = inv_man

    async def dispense_item(self, slot_name: str):
        row, col = 