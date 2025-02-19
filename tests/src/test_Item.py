import pytest  # noqa: N999

from src.Item import Item


# Fixture to create a sample Item instance
@pytest.fixture
def sample_item() -> Item:  # noqa: D103
    return Item("Soda", 1.50, 10)


# Test the constructor and attribute validation
def test_item_initialization() -> None:  # noqa: D103
    item = Item("Chips", 2.00, 5)
    assert item.get_name() == "Chips"
    assert item.get_cost() == 2.00  # noqa: PLR2004
    assert item.get_stock() == 5  # noqa: PLR2004

    with pytest.raises(ValueError, match="Cost of item must be > 0"):
        Item("Candy", 0, 5)

    with pytest.raises(ValueError, match="Value of must be >= 0"):
        Item("Gum", 1.00, -1)


# Test get_name method
def test_get_name(sample_item) -> None:  # noqa: ANN001
    assert sample_item.get_name() == "Soda"


# Test get_cost method
def test_get_cost(sample_item) -> None:  # noqa: ANN001
    assert sample_item.get_cost() == 1.50  # noqa: PLR2004


# Test get_stock method
def test_get_stock(sample_item) -> None:  # noqa: ANN001
    assert sample_item.get_stock() == 10  # noqa: PLR2004


# Test set_cost method
def test_set_cost(sample_item) -> None:  # noqa: ANN001
    sample_item.set_cost(2.00)
    assert sample_item.get_cost() == 2.00  # noqa: PLR2004

    with pytest.raises(ValueError, match="Cost of item must be > 0"):
        sample_item.set_cost(0)


# Test adjust_stock method
def test_adjust_stock(sample_item) -> None:  # noqa: ANN001, D103
    sample_item.adjust_stock(5)
    assert sample_item.get_stock() == 15  # noqa: PLR2004

    sample_item.adjust_stock(-5)
    assert sample_item.get_stock() == 10  # noqa: PLR2004

    with pytest.raises(ValueError, match="Value of stock cannot go below 0"):
        sample_item.adjust_stock(-11)


# Test adjust_stock with correct functionality
def test_adjust_stock_functionality(sample_item) -> None:  # noqa: ANN001, D103
    initial_stock = sample_item.get_stock()
    sample_item.adjust_stock(3)
    assert sample_item.get_stock() == initial_stock + 3

    sample_item.adjust_stock(-2)
    assert sample_item.get_stock() == initial_stock + 1

    with pytest.raises(ValueError, match="Value of stock cannot go below 0"):
        sample_item.adjust_stock(-(initial_stock + 2))
