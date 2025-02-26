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


def test_change_stock(inventory_manager: InventoryManager) -> None:
    """Tests changing stock and that illegal updates raise an error."""
    inventory_manager.add_item("00", "Soda", 10, 1.5)
    cost = inventory_manager.change_stock("00", -2)
    assert cost == 3.0

    with pytest.raises(err.EmptySlotError):
        inventory_manager.change_stock("01", 5)


def test_add_item(inventory_manager: InventoryManager) -> None:
    """Tests that adding an item to the inventory works."""
    inventory_manager.add_item("00", "Soda", 10, 1.5)
    item = inventory_manager.get_item("00")
    assert item.get_name() == "Soda"
    assert item.get_cost() == 1.5
    assert item.get_stock() == 10


def test_clear_slot(inventory_manager: InventoryManager) -> None:
    """Test clearing slot and that removing empty slot throws an error."""
    inventory_manager.add_item("00", "Soda", 10, 1.5)
    inventory_manager.clear_slot("00")
    with pytest.raises(err.EmptySlotError):
        inventory_manager.get_item("00")


def test_set_cost(inventory_manager: InventoryManager) -> None:
    """Test updating the cost to a slot and that setting a cost for an empty slot is an error."""
    inventory_manager.add_item("00", "Soda", 10, 1.5)
    inventory_manager.set_cost("00", 2.0)
    item = inventory_manager.get_item("00")
    assert item.get_cost() == 2.0

    with pytest.raises(err.EmptySlotError):
        inventory_manager.set_cost("01", 2.0)


def test_get_item(inventory_manager: InventoryManager) -> None:
    """Test getting item from valid and empty slot."""
    inventory_manager.add_item("00", "Soda", 10, 1.5)
    item = inventory_manager.get_item("00")
    assert item.get_name() == "Soda"

    with pytest.raises(err.EmptySlotError):
        inventory_manager.get_item("01")


# Private Tests
def test_get_coordinates_from_slotname(inventory_manager: InventoryManager) -> None:
    """Test private function for getting coordinates for an item for valid and invalid cases."""
    assert inventory_manager._InventoryManager__get_coordinates_from_slotname("00") == (0, 0)

    with pytest.raises(err.InvalidSlotNameError):
        inventory_manager._InventoryManager__get_coordinates_from_slotname("A1")

    with pytest.raises(err.InvalidSlotNameError):
        inventory_manager._InventoryManager__get_coordinates_from_slotname("000")
