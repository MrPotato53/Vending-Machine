import asyncio

from gpiozero import Button
from hardware_constants import (
    STEP_DELAY,
    STEP_SEQUENCE,
    STEPPER_1_PINS,
    STEPS_PER_QUARTER_REV,
)
from stepper_motors import StepperMotor

stepper_motor = StepperMotor(STEPS_PER_QUARTER_REV, STEP_DELAY, STEP_SEQUENCE, STEPPER_1_PINS)


button = Button(23, pull_up=True, bounce_time=0.05)


async def monitor_button() -> None:
    while button.is_pressed and not stepper_motor.moving:
        t = asyncio.create_task(stepper_motor.rotate_motor(4))
        await asyncio.sleep(0.2)
    await asyncio.sleep(0.02)


async def print_test_with_while():
    while True:
        print("Running something else")
        await asyncio.sleep(1)


async def main():
    await asyncio.gather(
        monitor_button(),
    )


asyncio.run(main())
