import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
  TouchableOpacity,
  Text as RNText,
} from 'react-native';
import {
  Layout,
  Text,
  Input,
  Button,
  List,
  ListItem,
} from '@ui-kitten/components';
import { useFocusEffect } from '@react-navigation/native';
import api from './apiCommunicator';

export default function DashboardScreen({ route, navigation }) {
  const { user } = route.params;
  const [vendingMachines, setVendingMachines] = useState([]);
  const [selectedVM, setSelectedVM] = useState(null);
  const [vmInventory, setVmInventory] = useState([]);
  const [searchVM, setSearchVM] = useState('');
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [stockAdditions, setStockAdditions] = useState({});
  const [newItem, setNewItem] = useState({ slot: '', itemName: '', price: '', stock: '' });
  const [slotError, setSlotError] = useState('');

  const isAdmin = user.u_role === 'admin' || user.role === 'admin';

  const fetchMachines = useCallback(async () => {
    try {
      const vms = isAdmin
        ? await api.getAllVendingMachines()
        : await api.getVendingMachinesByGroup(user.org_id, user.group_id || user.groupId);
      setVendingMachines(vms);
    } catch (err) {
      console.error(err);
    }
  }, [isAdmin, user]);

  const fetchVMInventory = useCallback(async vmId => {
    try {
      const inv = await api.getInventory(vmId);
      setVmInventory(
        inv.map(i => ({
          slot: i.slot_name,
          itemName: i.item_name,
          price: Number(i.price),
          stock: Number(i.stock),
        }))
      );
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { fetchMachines(); }, [fetchMachines]);
  useFocusEffect(useCallback(() => { fetchMachines(); }, [fetchMachines]));
  const refreshInventory = async () => selectedVM && fetchVMInventory(selectedVM.vm_id);

  const handleSelectVM = vm => {
    setSelectedVM(vm);
    fetchVMInventory(vm.vm_id);
    setShowAddItemForm(false);
    setStockAdditions({});
    setSlotError('');
  };

  const handleDeleteVM = async () => {
    Keyboard.dismiss();
    if (!selectedVM) return;
    try {
      await api.deleteVendingMachine(selectedVM.vm_id);
      setSelectedVM(null);
      await fetchMachines();
    } catch (err) {
      console.error('Failed to delete vending machine', err);
    }
  };

  const handleAddStock = async (item, qtyStr) => {
    const qty = parseInt(qtyStr, 10);
    if (!qty || qty <= 0) return;
    const newStock = Number(item.stock) + qty;
    try {
      await api.updateItemInSlot(selectedVM.vm_id, item.slot, {
        item_name: item.itemName,
        price: item.price,
        stock: newStock,
      });
      setVmInventory(prev => prev.map(r => r.slot === item.slot ? { ...r, stock: newStock } : r));
      setStockAdditions(p => ({ ...p, [item.slot]: '' }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteItem = async item => {
    Keyboard.dismiss();
    try {
      await api.deleteItemFromSlot(selectedVM.vm_id, item.slot);
      setVmInventory(prev => prev.filter(r => r.slot !== item.slot));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNewItemChange = (field, value) => {
    setNewItem(prev => ({ ...prev, [field]: value }));
    if (field === 'slot') validateSlot(value);
  };

  const validateSlot = (slotInput) => {
    const slot = slotInput.toUpperCase();
    setSlotError('');
    if (!selectedVM?.vm_row_count || !selectedVM?.vm_column_count) return;
    const match = slot.match(/^([A-Z])(\d+)$/);
    if (!match) {
      setSlotError('Slot format must be like A1');
      return;
    }
    const col = match[1].charCodeAt(0) - 65;
    const row = parseInt(match[2], 10) - 1;
    if (col >= selectedVM.vm_column_count || row >= selectedVM.vm_row_count) {
      setSlotError(`Out of range. Max columns: ${selectedVM.vm_column_count}, rows: ${selectedVM.vm_row_count}`);
    }
  };

  const isSlotValid = () => slotError === '' && newItem.slot.trim() !== '';

  const submitNewItem = async () => {
    const { slot, itemName, price, stock } = newItem;
    const p = parseFloat(price), s = parseInt(stock, 10);
    if (!slot || !itemName || !p || !s || isNaN(p) || isNaN(s) || !isSlotValid()) return;
    try {
      await api.addItemToSlot(selectedVM.vm_id, slot, { item_name: itemName, price: p, stock: s });
      await refreshInventory();
      setNewItem({ slot: '', itemName: '', price: '', stock: '' });
      setShowAddItemForm(false);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredVMs = vendingMachines.filter(vm => vm.vm_name.toLowerCase().includes(searchVM.toLowerCase()));
  const vmIsRegistered = selectedVM?.vm_row_count && selectedVM?.vm_column_count;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Layout style={styles.container}>
        <Text category="h5">Dashboard</Text>
        <Text>{`Welcome, ${user.email} (${user.u_role || user.role})`}</Text>
        <RNText style={styles.instruction}>{selectedVM ? `Managing: ${selectedVM.vm_name}` : 'Select a vending machine below to view or edit its inventory'}</RNText>

        <Button appearance="ghost" style={styles.button} onPress={() => navigation.navigate('Organization', { user })}>Manage Organization</Button>
        <Input placeholder="Search Vending Machines" value={searchVM} onChangeText={setSearchVM} style={styles.input} />

        <List data={filteredVMs} keyboardShouldPersistTaps="handled" renderItem={({ item }) => (
          <ListItem
            title={item.vm_name}
            description={item.vm_row_count && item.vm_column_count ? 'Registered' : 'Unregistered'}
            descriptionStyle={item.vm_row_count && item.vm_column_count ? styles.registered : styles.unregistered}
            onPress={() => handleSelectVM(item)}
          />
        )} style={styles.list} />

        <Button style={styles.button} onPress={() => navigation.navigate('AddVendingMachine', { user })} disabled={!isAdmin}>Add Vending Machine</Button>

        {isAdmin && selectedVM && (
          <TouchableOpacity style={styles.vmDelBtn} onPress={handleDeleteVM}><RNText style={styles.vmDelTxt}>Delete Vending Machine</RNText></TouchableOpacity>
        )}

        {selectedVM && (
          <>
            <Text category="h6" style={styles.section}>Inventory for {selectedVM.vm_name}</Text>

            {!vmIsRegistered && <RNText style={styles.unregisteredWarning}>This machine is not physically registered. Please register rows and columns to enable restocking.</RNText>}

            <ScrollView style={styles.inventoryList} keyboardShouldPersistTaps="handled">
              {vmInventory.map(item => (
                <ListItem
                  key={item.slot}
                  title={`${item.itemName} (Slot: ${item.slot}) • Stock: ${item.stock}`}
                  accessoryRight={() => isAdmin && (
                    <Layout style={styles.stockRow}>
                      <Input size="small" style={styles.qtyInput} keyboardType="numeric" placeholder="Qty" value={stockAdditions[item.slot] || ''} onChangeText={val => setStockAdditions(p => ({ ...p, [item.slot]: val }))} disabled={!vmIsRegistered} />
                      <Button size="tiny" onPress={() => handleAddStock(item, stockAdditions[item.slot])} disabled={!vmIsRegistered}>Add</Button>
                      <TouchableOpacity onPress={() => handleDeleteItem(item)} style={styles.delBtn}><RNText style={styles.delTxt}>Del</RNText></TouchableOpacity>
                    </Layout>
                  )}
                />
              ))}
            </ScrollView>

            <Button style={styles.button} disabled={!vmIsRegistered || (!isAdmin && user.group_id !== selectedVM.group_id)} onPress={() => setShowAddItemForm(!showAddItemForm)}>
              {showAddItemForm ? 'Cancel' : 'Add Item'}
            </Button>

            {showAddItemForm && (
              <Layout style={styles.form}>
                <Input label="Slot" placeholder="e.g., A1" value={newItem.slot} onChangeText={val => handleNewItemChange('slot', val)} style={styles.input} />
                {slotError !== '' && <RNText style={styles.errorText}>{slotError}</RNText>}
                <Input label="Item Name" placeholder="e.g., Coke" value={newItem.itemName} onChangeText={val => handleNewItemChange('itemName', val)} style={styles.input} />
                <Input label="Price ($)" placeholder="1.25" keyboardType="decimal-pad" value={newItem.price} onChangeText={val => handleNewItemChange('price', val)} style={styles.input} />
                <Input label="Initial Stock" placeholder="10" keyboardType="numeric" value={newItem.stock} onChangeText={val => handleNewItemChange('stock', val)} style={styles.input} />
                <Button style={styles.button} onPress={submitNewItem} disabled={!isSlotValid()}>Submit Item</Button>
              </Layout>
            )}
          </>
        )}
      </Layout>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  button: { marginVertical: 8 },
  input: { marginVertical: 8 },
  list: { maxHeight: 200 },
  inventoryList: { maxHeight: 200, marginVertical: 8 },
  section: { marginTop: 16 },
  instruction: { marginVertical: 8, fontStyle: 'italic' },
  stockRow: { flexDirection: 'row', alignItems: 'center' },
  qtyInput: { width: 60, marginRight: 4 },
  delBtn: { marginLeft: 4, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: '#e02424', borderRadius: 4 },
  delTxt: { color: '#fff', fontSize: 12 },
  vmDelBtn: { marginVertical: 8, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#e02424', borderRadius: 6 },
  vmDelTxt: { color: '#fff', fontWeight: '600' },
  unregisteredWarning: { color: '#999', fontStyle: 'italic', marginBottom: 8 },
  registered: { color: '#2e7d32' },
  unregistered: { color: '#999' },
  form: { marginTop: 16 },
  errorText: { color: '#e02424', marginBottom: 8, marginLeft: 4 },
});
