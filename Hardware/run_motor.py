import asyncio

from Hardware.hardware_constants import (
    STEP_DELAY,
    STEP_SEQUENCE,
    STEPPER_1_PINS,
    STEPS_PER_QUARTER_REV,
)
from Hardware.stepper_motors import StepperMotor

stepper_motor = StepperMotor(STEPS_PER_QUARTER_REV, STEP_DELAY, STEP_SEQUENCE, STEPPER_1_PINS)

asyncio.run(stepper_motor.rotate_motor(4))
