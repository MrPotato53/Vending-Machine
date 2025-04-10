from customer.Hardware.keypad import AsyncKeypad


class InputManager:
    """Handles UI input from keypad."""

    def __init__(self, layout: list[list[str]], rows: int, cols: int) -> None:
        self.keypad = AsyncKeypad(layout, rows, cols)

    async def start(self) -> None:
        await self.keypad.start()

    async def get_key(self) -> str:
        return await self.keypad.get_key()

    async def close(self) -> None:
        await self.keypad.close()
