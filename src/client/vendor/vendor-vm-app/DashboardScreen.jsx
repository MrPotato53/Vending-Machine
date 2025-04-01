import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, Button, ScrollView, StyleSheet, TouchableOpacity, Alert 
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import apiCommunicator from './apiCommunicator';

export default function DashboardScreen({ route, navigation }) {
  const { user } = route.params;
  const [vendingMachines, setVendingMachines] = useState([]);
  const [selectedVM, setSelectedVM] = useState(null);
  const [vmInventory, setVmInventory] = useState([]);
  const [searchVM, setSearchVM] = useState('');
  
  // State for inline "Add Item" form
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemSlot, setNewItemSlot] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  
  // State for inline "Add Vending Machine" form (left column)
  const [showAddVMForm, setShowAddVMForm] = useState(false);
  const [newVmId, setNewVmId] = useState('');
  const [newVmOrg, setNewVmOrg] = useState('');
  const [newRowCount, setNewRowCount] = useState('');
  const [newColumnCount, setNewColumnCount] = useState('');

  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    try {
      const vmData = await apiCommunicator.getMachines();
      setVendingMachines(vmData || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchVMInventory = async (vmId) => {
    try {
      const inventory = await apiCommunicator.getVMItems(vmId);
      setVmInventory(inventory || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSelectVM = (vm) => {
    setSelectedVM(vm);
    fetchVMInventory(vm.vm_id);
    // Hide any open submenu forms when switching machines
    setShowAddItemForm(false);
  };

  // Handler for adding an item via the inline form
  const handleAddItem = async () => {
    if (!newItemName || !newItemPrice || !newItemSlot || !newItemQuantity) {
      Alert.alert("Error", "Please fill in all fields for the item.");
      return;
    }
    const newItem = {
      slot: newItemSlot,
      itemName: newItemName,
      cost: parseFloat(newItemPrice),
      stock: parseInt(newItemQuantity, 10)
    };
    const updatedInventory = [...vmInventory, newItem];
    try {
      await apiCommunicator.updateVMInv(selectedVM.vm_id, updatedInventory);
      Alert.alert("Success", "Item added successfully.");
      fetchVMInventory(selectedVM.vm_id);
      // Clear fields and hide form
      setNewItemName('');
      setNewItemPrice('');
      setNewItemSlot('');
      setNewItemQuantity('');
      setShowAddItemForm(false);
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  // Handler for adding a vending machine via inline form
  const handleAddVendingMachine = async () => {
    if (!newVmId || !newVmOrg || !newRowCount || !newColumnCount) {
      Alert.alert("Error", "Please fill in all fields for the vending machine.");
      return;
    }
    try {
      await apiCommunicator.postMachine(
        newVmId,
        `${newVmOrg} - ${newVmId}`,
        parseInt(newRowCount, 10),
        parseInt(newColumnCount, 10),
        "i" // default mode: idle
      );
      Alert.alert("Success", "Vending Machine added successfully.");
      fetchMachines();
      // Clear form fields and hide form
      setNewVmId('');
      setNewVmOrg('');
      setNewRowCount('');
      setNewColumnCount('');
      setShowAddVMForm(false);
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const filteredVMs = vendingMachines.filter(vm =>
    vm.vm_name.toLowerCase().includes(searchVM.toLowerCase())
  );

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <Text style={styles.header}>Dashboard</Text>
      <Text>Welcome, {user.email} ({user.role})</Text>
      <View style={styles.buttonRow}>
        <Button title="Organization" onPress={() => navigation.navigate('Organization', { user })} />
      </View>
      <View style={styles.rowContainer}>
        {/* Left column: Vending Machine List and Add VM Form */}
        <View style={styles.column}>
          <Text style={styles.sectionHeader}>Vending Machines</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Search Vending Machines" 
            value={searchVM} 
            onChangeText={setSearchVM} 
          />
          {filteredVMs.map(vm => (
            <TouchableOpacity 
              key={vm.vm_id} 
              style={styles.listItemContainer}
              onPress={() => handleSelectVM(vm)}
            >
              <Text style={styles.listItem}>{vm.vm_name}</Text>
            </TouchableOpacity>
          ))}
          {/* Add Vending Machine Button (disabled if user is maintainer) */}
          <Button 
            title="Add Vending Machine" 
            onPress={() => setShowAddVMForm(!showAddVMForm)} 
            disabled={user.role !== 'admin'}
            color={user.role !== 'admin' ? '#ccc' : undefined}
          />
          {showAddVMForm && (
            <View style={styles.addVMForm}>
              <TextInput 
                style={styles.inputSmall}
                placeholder="VM ID"
                value={newVmId}
                onChangeText={setNewVmId}
              />
              <TextInput 
                style={styles.inputSmall}
                placeholder="Organization"
                value={newVmOrg}
                onChangeText={setNewVmOrg}
              />
              <TextInput 
                style={styles.inputSmall}
                placeholder="Row Count"
                keyboardType="numeric"
                value={newRowCount}
                onChangeText={setNewRowCount}
              />
              <TextInput 
                style={styles.inputSmall}
                placeholder="Column Count"
                keyboardType="numeric"
                value={newColumnCount}
                onChangeText={setNewColumnCount}
              />
              <Button title="Submit" onPress={handleAddVendingMachine} />
            </View>
          )}
        </View>
        {/* Right column: Selected VM's Inventory and Add Item Form */}
        <View style={styles.column}>
          <Text style={styles.sectionHeader}>Inventory</Text>
          {selectedVM ? (
            <>
              {vmInventory.length > 0 ? (
                vmInventory.map(item => (
                  <View key={item.slot} style={styles.listItemContainer}>
                    <Text style={styles.listItem}>
                      {item.itemName} (Slot: {item.slot}) - Stock: {item.stock}
                    </Text>
                  </View>
                ))
              ) : (
                <Text>No items in this vending machine.</Text>
              )}
              <Button 
                title={showAddItemForm ? "Cancel Add Item" : "Add Item"} 
                onPress={() => setShowAddItemForm(!showAddItemForm)} 
              />
              {showAddItemForm && (
                <View style={styles.addItemForm}>
                  <Text style={styles.formLabel}>Select Item:</Text>
                  <Picker
                    selectedValue={newItemName}
                    style={styles.picker}
                    onValueChange={(itemValue, itemIndex) => setNewItemName(itemValue)}
                  >
                    <Picker.Item label="Select an item" value="" />
                    <Picker.Item label="Coke" value="Coke" />
                    <Picker.Item label="Pepsi" value="Pepsi" />
                    <Picker.Item label="Water" value="Water" />
                  </Picker>
                  <TextInput 
                    style={styles.inputSmall}
                    placeholder="Price"
                    keyboardType="numeric"
                    value={newItemPrice}
                    onChangeText={setNewItemPrice}
                  />
                  <TextInput 
                    style={styles.inputSmall}
                    placeholder="Slot Name"
                    value={newItemSlot}
                    onChangeText={setNewItemSlot}
                  />
                  <TextInput 
                    style={styles.inputSmall}
                    placeholder="Quantity"
                    keyboardType="numeric"
                    value={newItemQuantity}
                    onChangeText={setNewItemQuantity}
                  />
                  <Button title="Submit" onPress={handleAddItem} />
                </View>
              )}
            </>
          ) : (
            <Text>Select a vending machine to view its inventory.</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 20,
    alignItems: 'center'
  },
  header: {
    fontSize: 26,
    marginBottom: 10
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 10,
  },
  rowContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between'
  },
  column: {
    flex: 1,
    marginHorizontal: 5,
  },
  sectionHeader: {
    fontSize: 20,
    marginBottom: 5,
  },
  input: {
    height: 35,
    borderColor: 'gray',
    borderWidth: 1,
    width: '100%',
    marginBottom: 10,
    paddingHorizontal: 8,
    fontSize: 14
  },
  listItemContainer: {
    width: '100%',
    borderBottomColor: 'gray',
    borderBottomWidth: 1,
    paddingVertical: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  listItem: {
    fontSize: 16,
  },
  addVMForm: {
    marginTop: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#f9f9f9'
  },
  addItemForm: {
    marginTop: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#f9f9f9'
  },
  inputSmall: {
    height: 35,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 10,
    fontSize: 14,
  },
  formLabel: {
    fontSize: 16,
    marginBottom: 5
  },
  picker: {
    height: 35,
    width: '100%',
    marginBottom: 10,
  }
});
