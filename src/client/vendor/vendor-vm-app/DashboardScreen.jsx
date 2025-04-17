import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Layout, Text, Input, Button, List, ListItem } from '@ui-kitten/components';
import apiCommunicator from './apiCommunicator';

export default function DashboardScreen({ route, navigation }) {
  const { user } = route.params;
  const [vendingMachines, setVendingMachines] = useState([]);
  const [selectedVM, setSelectedVM] = useState(null);
  const [vmInventory, setVmInventory] = useState([]);
  const [searchVM, setSearchVM] = useState('');
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  // ... other state

  useEffect(() => { fetchMachines(); }, []);
  const fetchMachines = async () => { /* ... */ };
  const fetchVMInventory = async (vmId) => { /* ... */ };
  const handleSelectVM = (vm) => { setSelectedVM(vm); fetchVMInventory(vm.vm_id); setShowAddItemForm(false); };

  const filteredVMs = vendingMachines.filter(vm => vm.vm_name.toLowerCase().includes(searchVM.toLowerCase()));

  const renderMachineItem = ({ item }) => (
    <ListItem
      title={item.vm_name}
      onPress={() => handleSelectVM(item)}
    />
  );

  return (
    <Layout style={styles.container}>
      <Text category='h5'>Dashboard</Text>
      <Text>{`Welcome, ${user.email} (${user.role})`}</Text>
      <Button appearance='ghost' style={styles.button} onPress={() => navigation.navigate('Organization', { user })}>
        Manage Organization
      </Button>

      <Input
        placeholder='Search Vending Machines'
        value={searchVM}
        onChangeText={setSearchVM}
        style={styles.input}
      />
      <List
        data={filteredVMs}
        renderItem={renderMachineItem}
        style={styles.list}
      />
      <Button
        style={styles.button}
        onPress={() => navigation.navigate('AddVendingMachine', { user })}
        disabled={user.role !== 'admin'}
      >
        Add Vending Machine
      </Button>

      {selectedVM && (
        <>  
          <Text category='h6' style={styles.section}>Inventory for {selectedVM.vm_name}</Text>
          <ScrollView style={styles.inventoryList}>
            {vmInventory.map(item => (
              <ListItem
                key={item.slot}
                title={`${item.itemName} (Slot: ${item.slot}) - Stock: ${item.stock}`}
              />
            ))}
          </ScrollView>
          <Button
            style={styles.button}
            onPress={() => setShowAddItemForm(!showAddItemForm)}
          >
            {showAddItemForm ? 'Cancel' : 'Add Item'}
          </Button>
          {/* Inline Add Item form omitted for brevity; wrap Inputs and Button inside Layout */}
        </>
      )}
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  button: { marginVertical: 8 },
  input: { marginVertical: 8 },
  list: { maxHeight: 200 },
  inventoryList: { maxHeight: 200, marginVertical: 8 },
  section: { marginTop: 16 },
});
