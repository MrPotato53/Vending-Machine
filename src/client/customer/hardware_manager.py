from customer.Hardware.hardware_constants import *
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

        self.current_input_string = None

    async def read_keypad_input(self) -> str:
        self.current_input_string = None
        try:
            while True:
                key = await self.keypad.get_key()
                print(key)
                self.current_input_string += key
                # key that means try to dispense
                # if DISPENSE_KEY is key:
                #     del self.current_input_string[-1]
                #     self.keypad.close()
                #     return self.current_input_string
                # if DELETE_KEY is key:
                #     self.current_input_string = self.current_input_string[:-2]
                # # Case of inputting
                # elif CARD_INFO_KEY is key:
                #     return CARD_INFO_KEY
        finally:
            self.keypad.close()

    # async def dispense_item(self, slot_name: str):
    #     row, col =
