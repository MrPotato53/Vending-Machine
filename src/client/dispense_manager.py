from customer.Hardware.stepper_motors import StepperMotor


class DispenserManager:
    def __init__(self, motor_grid: list[list[StepperMotor]]) -> None:
        self.motors = motor_grid

    async def dispense(self, row: int, col: int) -> None:
        motor = self.motors[row][col]
        print(motor.pins)
        await motor.rotate_motor(4)
