import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, Button, ScrollView, StyleSheet, Alert 
} from 'react-native';
import apiCommunicator from './apiCommunicator';

export default function VMDetailScreen({ route, navigation }) {
  const { vm, user } = route.params;
  const [vmDetail, setVMDetail] = useState(vm);
  const [inventory, setInventory] = useState([]);
  const [quantity, setQuantity] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    fetchVMDetail();
  }, []);

  const fetchVMDetail = async () => {
    try {
      const detail = await apiCommunicator.getSingleMachine(vm.vm_id);
      const inv = await apiCommunicator.getVMItems(vm.vm_id);
      setVMDetail(detail);
      setInventory(inv || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleRestock = async (item) => {
    if (!quantity) return;
    try {
      const amount = parseInt(quantity, 10);
      const updatedInventory = inventory.map(invItem => {
        if (invItem.slot === item.slot) {
          return { ...invItem, stock: invItem.stock + amount };
        }
        return invItem;
      });
      await apiCommunicator.updateVMInv(vm.vm_id, updatedInventory);
      Alert.alert("Success", `Restocked ${amount} of ${item.itemName}`);
      setQuantity('');
      fetchVMDetail();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>{vmDetail.vm_name}</Text>
      <Text>Mode: {vmDetail.vm_mode}</Text>
      <Text style={styles.sectionHeader}>Current Inventory</Text>
      {inventory.map(item => (
        <View key={item.slot} style={styles.inventoryItem}>
          <Text>
            {item.itemName} (Slot: {item.slot}) - Stock: {item.stock}
          </Text>
          <TextInput 
            style={styles.inputSmall}
            placeholder="Quantity"
            keyboardType="numeric"
            value={selectedSlot === item.slot ? quantity : ''}
            onChangeText={(text) => {
              setSelectedSlot(item.slot);
              setQuantity(text);
            }}
          />
          <Button title="Restock" onPress={() => handleRestock(item)} />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center'
  },
  header: {
    fontSize: 26,
    marginBottom: 10
  },
  sectionHeader: {
    fontSize: 20,
    marginBottom: 5,
  },
  inputSmall: {
    height: 30,
    borderColor: 'gray',
    borderWidth: 1,
    width: 80,
    marginBottom: 5,
    paddingHorizontal: 5
  },
  inventoryItem: {
    width: '100%',
    marginVertical: 5,
    padding: 5,
    borderWidth: 1,
    borderColor: 'gray'
  }
});
