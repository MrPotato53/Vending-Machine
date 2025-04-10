from customer.Hardware.hardware_constants import (
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
from customer.Hardware.keypad import AsyncKeypad
from customer.Hardware.LCD_display import LCDDisplay
from customer.Hardware.stepper_motors import StepperMotor
from inventory_manager import InventoryManager


class HardwareManager:
    def __init__(self, inv_man: InventoryManager) -> None:
        self.motors = [
            [
                StepperMotor(STEPS_PER_QUARTER_REV, STEP_DELAY, STEP_SEQUENCE, STEPPER_1_PINS),
                StepperMotor(STEPS_PER_QUARTER_REV, STEP_DELAY, STEP_SEQUENCE, STEPPER_2_PINS),
                StepperMotor(STEPS_PER_QUARTER_REV, STEP_DELAY, STEP_SEQUENCE, STEPPER_3_PINS),
            ],
        ]

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

        self.current_input_string = None

    async def start(self) -> None:
        self.keypad = AsyncKeypad(KEYPAD_LAYOUT, KEYPAD_ROW_PINS, KEYPAD_COL_PINS)
        await self.keypad.start()

    async def read_keypad_input(self) -> str:
        """Reads keyboard input and returns when a special case input has been detected.

        Retrun:
            str: str of user input.
        """
        # self.current_input_string = ""
        while True:
            return await self.keypad.get_key()
