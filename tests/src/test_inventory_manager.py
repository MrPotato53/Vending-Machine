import pytest

import exceptions as err
from enum_types import InventoryManagerMode
from inventory_manager import InventoryManager


@pytest.fixture
def inventory_manager() -> InventoryManager:
    """Inventory Manager for Testing. Using 3 by 3 size for layout."""
    return InventoryManager(height=3, width=3)


def test_initialization() -> None:
    """Tests creation of a new InventoryManager instance."""
    inv_manager = InventoryManager(3, 3)
    assert inv_manager.get_mode() == InventoryManagerMode.IDLE

    with pytest.raises(err.InvalidDimensionsError):
        InventoryManager(0, 5)

    with pytest.raises(err.InvalidDimensionsError):
        InventoryManager(11, 5)


def test_get_mode(inventory_manager: InventoryManager) -> None:
    """Tests getting the state of the inventory manager."""
    assert inventory_manager.get_mode() == InventoryManagerMode.IDLE


def test_set_mode(inventory_manager: InventoryManager) -> None:
    """Tests setting the mode for invenetory manager and that illegal mode switching rasises exceptions."""
    inventory_manager.set_mode(InventoryManagerMode.RESTOCKING)
    assert inventory_manager.get_mode() == InventoryManagerMode.RESTOCKING

    inventory_manager.set_mode(InventoryManagerMode.IDLE)
    assert inventory_manager.get_mode() == InventoryManagerMode.IDLE

    with pytest.raises(err.InvalidModeError):
        inventory_manager.set_mode(InventoryManagerMode.IDLE)

    inventory_manager.set_mode(InventoryManagerMode.TRANSACTION)
    assert inventory_manager.get_mode() == InventoryManagerMode.TRANSACTION

    with pytest.raises(err.InvalidModeError):
        inventory_manager.set_mode(InventoryManagerMode.RESTOCKING)


def test_get_stock_information(inventory_manager: InventoryManager) -> None:
    """Tests getting stock information as a string output."""
    inventory_manager.add_item("00", "Soda", 10, 1.5)
    stock_info = inventory_manager.get_stock_information()
    assert "00: Soda, Price: 1.5, Left in Stock: 10" in stock_info
