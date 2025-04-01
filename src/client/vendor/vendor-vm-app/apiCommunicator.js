// Updated to use the localhost docker container as defined in the docker-compose file.
// The backend container is exposed on host port 8080 (mapped from container port 5000).
// In production, you can override the API host by setting the environment variable REACT_APP_API_HOST.
const HOST = process.env.REACT_APP_API_HOST || "http://localhost:8080";

const MACHINES = "vending-machines";
const INVENTORY = "inventory";
const ITEMS = "items";
const HEADERS = { "Content-Type": "application/json" };

function stringBuilder(...args) {
  return args.join("/");
}

// Get all vending machines.
async function getMachines() {
  const apiRoute = stringBuilder(HOST, MACHINES);
  try {
    const response = await fetch(apiRoute);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

// Get a single vending machine by hardware_id.
async function getSingleMachine(hardwareId) {
  const apiRoute = stringBuilder(HOST, MACHINES, hardwareId);
  try {
    const response = await fetch(apiRoute);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    throw new Error("Error: " + error.message);
  }
}

// Post (create) a new vending machine.
async function postMachine(hardwareId, name, row, column, vm_mode) {
  const newInfo = {
    vm_id: hardwareId,
    vm_name: name,
    vm_row_count: row,
    vm_column_count: column,
    vm_mode: vm_mode,
  };
  const apiRoute = stringBuilder(HOST, MACHINES);
  try {
    const response = await fetch(apiRoute, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify(newInfo),
    });
    if (!response.ok)
      throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    throw new Error("Error: " + error.message);
  }
}

// Delete a vending machine.
async function deleteMachine(hardwareId) {
  const apiRoute = stringBuilder(HOST, MACHINES, hardwareId);
  try {
    const response = await fetch(apiRoute, { method: "DELETE" });
    if (!response.ok)
      throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    throw new Error("Error: " + error.message);
  }
}

// Change the mode of a vending machine.
async function alterMode(hardwareId, mode) {
  const apiRoute = stringBuilder(HOST, MACHINES, hardwareId, "mode");
  const payload = { vm_mode: mode };
  try {
    const response = await fetch(apiRoute, {
      method: "PATCH",
      headers: HEADERS,
      body: JSON.stringify(payload),
    });
    if (!response.ok)
      throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    throw new Error("Error: " + error.message);
  }
}

// Rename a vending machine.
async function alterName(hardwareId, name) {
  const apiRoute = stringBuilder(HOST, MACHINES, hardwareId, "name");
  const payload = { vm_name: name };
  try {
    const response = await fetch(apiRoute, {
      method: "PATCH",
      headers: HEADERS,
      body: JSON.stringify(payload),
    });
    if (!response.ok)
      throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    throw new Error("Error: " + error.message);
  }
}

// Get all items available for stocking.
async function getItems() {
  const apiRoute = stringBuilder(HOST, ITEMS);
  try {
    const response = await fetch(apiRoute);
    if (!response.ok)
      throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    throw new Error("Error: " + error.message);
  }
}

// Get all items in a specific vending machine.
async function getVMItems(hardwareId) {
  const apiRoute = stringBuilder(HOST, MACHINES, hardwareId, INVENTORY);
  try {
    const response = await fetch(apiRoute);
    if (!response.ok)
      throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    throw new Error("Error: " + error.message);
  }
}

// Update the inventory of a specific vending machine.
async function updateVMInv(hardwareId, updatedInventory) {
  const apiRoute = stringBuilder(HOST, MACHINES, hardwareId, INVENTORY);
  try {
    const response = await fetch(apiRoute, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify(updatedInventory),
    });
    if (!response.ok)
      throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    throw new Error("Error: " + error.message);
  }
}

// Create a payment token for a card.
// For now, return a placeholder token as in the Python version.
async function createPaymentToken(card_number, exp_month, exp_year, cvc) {
  return "placeholdertoken";
}

// Charge a card using a payment token.
async function chargeCard(amount, payment_token = "") {
  const apiRoute = stringBuilder(HOST, "stripes", "pay");
  const payload = { amount: amount, token: payment_token };
  try {
    const response = await fetch(apiRoute, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify(payload),
    });
    if (!response.ok)
      throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    throw new Error("Error: " + error.message);
  }
}

export default {
  getMachines,
  getSingleMachine,
  postMachine,
  deleteMachine,
  alterMode,
  alterName,
  getItems,
  getVMItems,
  updateVMInv,
  createPaymentToken,
  chargeCard,
};
