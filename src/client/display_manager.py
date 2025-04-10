from customer.Hardware.LCD_display import LCDDisplay


class DisplayManager:
    def __init__(self, lcd_config: dict) -> None:
        self.lcd = LCDDisplay(**lcd_config)

    async def show_text(self, text: str, line: int) -> None:
        await self.lcd.clear_line(line)
        await self.lcd.write(text, line=line)
