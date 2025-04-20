import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
  TouchableOpacity,
  View,
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
import api from './apiCommunicator';

export default function DashboardScreen({ route, navigation }) {
  const { user } = route.params;

  const [vendingMachines, setVendingMachines] = useState([]);
  const [onlineStatus, setOnlineStatus] = useState({});
  const [selectedVM, setSelectedVM] = useState(null);
  const [vmInventory, setVmInventory] = useState([]);
  const [searchVM, setSearchVM] = useState('');
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [stockAdditions, setStockAdditions] = useState({});
  const [newItem, setNewItem] = useState({ slot: '', itemName: '', price: '', stock: '' });
  const [slotError, setSlotError] = useState('');

  const isAdmin = user.u_role === 'admin';
  const isMaintainer = user.u_role === 'maintainer';
  const canModifyItems = isAdmin || isMaintainer;

  // Fetch machines
  const fetchMachines = useCallback(async () => {
    try {
      let vms = [];
      if (isAdmin) {
        const { vms: orgVms } = await api.getOrgDisplay(user.org_id);
        vms = orgVms;
      } else {
        vms = await api.getVendingMachinesByGroup(
          user.org_id,
          user.group_id || user.groupId
        );
      }
      setVendingMachines(vms);
    } catch (err) {
      console.error('Failed to fetch machines', err);
    }
  }, [isAdmin, user.org_id, user.group_id, user.groupId]);

  // Poll online status
  const pollOnlineStatus = useCallback(() => {
    vendingMachines.forEach(async vm => {
      try {
        const { isOnline } = await api.isVMOnline(vm.vm_id);
        setOnlineStatus(prev => ({ ...prev, [vm.vm_id]: isOnline }));
      } catch {
        setOnlineStatus(prev => ({ ...prev, [vm.vm_id]: false }));
      }
    });
  }, [vendingMachines]);

  // Fetch inventory for a VM
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
      console.error('Failed to fetch inventory', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchMachines();
  }, [fetchMachines]);

  // Poll every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMachines();
      pollOnlineStatus();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchMachines, pollOnlineStatus]);

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
    const newStock = item.stock + qty;
    try {
      await api.updateItemInSlot(selectedVM.vm_id, item.slot, {
        item_name: item.itemName,
        price: item.price,
        stock: newStock,
      });
      setVmInventory(prev =>
        prev.map(r => (r.slot === item.slot ? { ...r, stock: newStock } : r))
      );
      setStockAdditions(prev => ({ ...prev, [item.slot]: '' }));
      await api.notifyRestock(selectedVM.vm_id);
    } catch (err) {
      console.error('Failed to add stock', err);
    }
  };

  const handleDeleteItem = async item => {
    Keyboard.dismiss();
    try {
      await api.deleteItemFromSlot(selectedVM.vm_id, item.slot);
      setVmInventory(prev => prev.filter(r => r.slot !== item.slot));
    } catch (err) {
      console.error('Failed to delete item', err);
    }
  };

  const handleNewItemChange = (field, value) => {
    const val = field === 'slot' ? value.toUpperCase() : value;
    setNewItem(prev => ({ ...prev, [field]: val }));
    if (field === 'slot') validateSlot(val);
  };

  const validateSlot = slotInput => {
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
      setSlotError(
        `Out of range. Max columns: ${selectedVM.vm_column_count}, rows: ${selectedVM.vm_row_count}`
      );
    }
  };

  const isSlotValid = () => slotError === '' && newItem.slot.trim() !== '';

  const submitNewItem = async () => {
    const { slot, itemName, price, stock } = newItem;
    const normalizedSlot = slot.trim().toUpperCase();
    const p = parseFloat(price);
    const s = parseInt(stock, 10);
    if (!normalizedSlot || !itemName || isNaN(p) || isNaN(s) || !isSlotValid()) return;
    try {
      await api.addItemToSlot(selectedVM.vm_id, normalizedSlot, { item_name: itemName, price: p, stock: s });
      setVmInventory(prev => [...prev, { slot: normalizedSlot, itemName, price: p, stock: s }]);
      setNewItem({ slot: '', itemName: '', price: '', stock: '' });
      setShowAddItemForm(false);
      await api.notifyRestock(selectedVM.vm_id);
    } catch (err) {
      console.error('Failed to add new item', err);
    }
  };

  const filteredVMs = vendingMachines.filter(vm => vm.vm_name.toLowerCase().includes(searchVM.toLowerCase()));
  const vmIsRegistered = Boolean(selectedVM?.vm_row_count && selectedVM?.vm_column_count);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Layout style={styles.container}>
        <Text category="h5">Dashboard</Text>
        <Text>{`Welcome, ${user.email} (${user.u_role})`}</Text>
        <RNText style={styles.instruction}>
          {selectedVM
            ? `Managing: ${selectedVM.vm_name}`
            : 'Select a vending machine to view or edit its inventory'}
        </RNText>

        <Button
          appearance="ghost"
          style={styles.button}
          onPress={() => navigation.navigate('Organization', { user })}
        >Manage Organization</Button>

        <Input
          placeholder="Search Vending Machines"
          value={searchVM}
          onChangeText={setSearchVM}
          style={styles.input}
        />

        <List
          data={filteredVMs}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <ListItem
              title={() => (
                <View style={styles.vmRow}>
                  <View
                    style={[
                      styles.statusDot,
                      onlineStatus[item.vm_id] ? styles.greenDot : styles.redDot
                    ]}
                  />
                  <Text>{item.vm_name}</Text>
                </View>
              )}
              description={() => (
                <Text
                  style={
                    item.vm_row_count && item.vm_column_count
                      ? styles.registered
                      : styles.unregistered
                  }
                >
                  {item.vm_row_count && item.vm_column_count ? 'Registered' : 'Unregistered'}
                </Text>
              )}
              onPress={() => handleSelectVM(item)}
            />
          )}
          style={styles.list}
        />

        <Button
          style={styles.button}
          onPress={() => navigation.navigate('AddVendingMachine', { user })}
          disabled={!isAdmin}
        >Add Vending Machine</Button>

        {isAdmin && selectedVM && (
          <TouchableOpacity style={styles.vmDelBtn} onPress={handleDeleteVM}>
            <RNText style={styles.vmDelTxt}>Delete Vending Machine</RNText>
          </TouchableOpacity>
        )}

        {selectedVM && (
          <>
            <Text category="h6" style={styles.section}>
              Inventory for {selectedVM.vm_name}
            </Text>

            {!vmIsRegistered && (
              <RNText style={styles.unregisteredWarning}>
                This machine is not physically registered. Please register rows and columns to enable restocking.
              </RNText>
            )}

            <ScrollView style={styles.inventoryList} keyboardShouldPersistTaps="handled">
              {vmInventory.map(item => (
                <ListItem
                  key={item.slot}
                  title={`${item.itemName} (Slot: ${item.slot}) • Stock: ${item.stock}`}
                  accessoryRight={() =>
                    canModifyItems && (
                      <Layout style={styles.stockRow}>
                        <Input
                          size="small"
                          style={styles.qtyInput}
                          keyboardType="numeric"
                          placeholder="Qty"
                          value={stockAdditions[item.slot] || ''}
                          onChangeText={val => setStockAdditions(prev => ({ ...prev, [item.slot]: val }))}
                          disabled={!vmIsRegistered}
                        />
                        <Button
                          size="tiny"
                          onPress={() => handleAddStock(item, stockAdditions[item.slot])}
                          disabled={!vmIsRegistered}
                        >Add</Button>
                        {isAdmin && (
                          <TouchableOpacity onPress={() => handleDeleteItem(item)} style={styles.delBtn}>
                            <RNText style={styles.delTxt}>Del</RNText>
                          </TouchableOpacity>
                        )}
                      </Layout>
                    )
                  }
                />
              ))}
            </ScrollView>

            <Button
              style={styles.button}
              disabled={!vmIsRegistered || !canModifyItems}
              onPress={() => setShowAddItemForm(prev => !prev)}
            >{showAddItemForm ? 'Cancel' : 'Add Item'}</Button>

            {showAddItemForm && (
              <Layout style={styles.form}>
                <Input
                  label="Slot"
                  placeholder="e.g., A1"
                  value={newItem.slot}
                  onChangeText={val => handleNewItemChange('slot', val)}
                  style={styles.input}
                />
                {slotError !== '' && <RNText style={styles.errorText}>{slotError}</RNText>}
                <Input
                  label="Item Name"
                  placeholder="e.g., Coke"
                  value={newItem.itemName}
                  onChangeText={val => handleNewItemChange('itemName', val)}
                  style={styles.input}
                />
                <Input
                  label="Price ($)"
                  placeholder="1.25"
                  keyboardType="decimal-pad"
                  value={newItem.price}
                  onChangeText={val => handleNewItemChange('price', val)}
                  style={styles.input}
                />
                <Input
                  label="Initial Stock"
                  placeholder="10"
                  keyboardType="numeric"
                  value={newItem.stock}
                  onChangeText={val => handleNewItemChange('stock', val)}
                  style={styles.input}
                />
                <Button
                  style={styles.button}
                  onPress={submitNewItem}
                  disabled={!isSlotValid()}
                >Submit Item</Button>
              </Layout>
            )}
          </>
        )}

        <Button appearance="ghost" onPress={() => navigation.goBack()} style={styles.button}>Back</Button>
      </Layout>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  button: { marginVertical: 8 },
  input: { marginVertical: 8 },
  list: { maxHeight: 250, marginVertical: 8 },
  vmRow: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  greenDot: { backgroundColor: '#4caf50' },
  redDot: { backgroundColor: '#f44336' },
  registered: { color: '#2e7d32' },
  unregistered: { color: '#999' },
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
  form: { marginTop: 16 },
  errorText: { color: '#e02424', marginBottom: 8, marginLeft: 4 }
});
