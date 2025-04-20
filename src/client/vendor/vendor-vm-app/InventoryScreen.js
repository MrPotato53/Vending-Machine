import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Layout, Text, Input, Button } from '@ui-kitten/components';
import api from './apiCommunicator';

export default function InventoryScreen({ route, navigation }) {
  const { user, vm } = route.params;
  const [vmInventory, setVmInventory] = useState([]);
  const [onlineStatus, setOnlineStatus] = useState(false);
  const [isRestockMode, setIsRestockMode] = useState(false);
  const [editedItems, setEditedItems] = useState({});
  const [newItems, setNewItems] = useState({});
  const [deleteSlots, setDeleteSlots] = useState({});

  const vmIsRegistered = Boolean(vm.vm_row_count && vm.vm_column_count);

  const fetchInventory = useCallback(async () => {
    try {
      const inv = await api.getInventory(vm.vm_id);
      setVmInventory(
        inv.map(i => ({
          slot: i.slot_name,
          itemName: i.item_name,
          price: Number(i.price),
          stock: Number(i.stock),
        }))
      );
      const { isOnline } = await api.isVMOnline(vm.vm_id);
      setOnlineStatus(isOnline);
    } catch {}
  }, [vm.vm_id]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const confirmDeleteVm = () => {
    Alert.alert(
      'Delete Vending Machine',
      `Are you sure you want to delete "${vm.vm_name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: deleteVm },
      ]
    );
  };

  const deleteVm = async () => {
    try {
      await api.deleteVendingMachine(vm.vm_id);
      navigation.navigate('Dashboard', { user });
    } catch (e) {
      Alert.alert('Error', `Could not delete: ${e.message}`);
    }
  };

  const startRestock = async () => {
    if (!vmIsRegistered) return;
    await api.updateVendingMachineMode(vm.vm_id, 'r');
    setIsRestockMode(true);

    const items = {};
    const newSlots = {};
    const deletes = {};
    vmInventory.forEach(i => {
      items[i.slot] = {
        itemName: i.itemName,
        price: i.price.toString(),
        stock: i.stock.toString()
      };
      deletes[i.slot] = false;
    });

    for (let r = 0; r < (vm.vm_row_count || 0); r++) {
      for (let c = 0; c < (vm.vm_column_count || 0); c++) {
        const slot = `${String.fromCharCode(65 + c)}${r + 1}`;
        if (!items[slot]) newSlots[slot] = { itemName: '', price: '', stock: '' };
      }
    }
    setEditedItems(items);
    setNewItems(newSlots);
    setDeleteSlots(deletes);
  };

  const cancelRestock = async () => {
    await api.updateVendingMachineMode(vm.vm_id, 'i');
    setIsRestockMode(false);
    setEditedItems({});
    setNewItems({});
    setDeleteSlots({});
  };

  const submitRestock = async () => {
    const updates = vmInventory.map(item => ({
      slot_name: item.slot,
      item_name: deleteSlots[item.slot] ? null : editedItems[item.slot].itemName,
      price: deleteSlots[item.slot] ? 0 : parseFloat(editedItems[item.slot].price),
      stock: deleteSlots[item.slot] ? 0 : parseInt(editedItems[item.slot].stock, 10),
    }));

    const additions = Object.entries(newItems)
      .filter(([_, d]) => d.itemName)
      .map(([slot, d]) => ({
        slot_name: slot,
        item_name: d.itemName,
        price: parseFloat(d.price),
        stock: parseInt(d.stock, 10),
      }));

    try {
      await api.batchUpdateInventory(vm.vm_id, [...updates, ...additions]);
      await api.updateVendingMachineMode(vm.vm_id, 'i');
      setIsRestockMode(false);
      fetchInventory();
    } catch (e) {
      Alert.alert('Error', `Could not save changes: ${e.message}`);
    }
  };

  const handleItemChange = (slot, field, v) => {
    setEditedItems(prev => ({
      ...prev,
      [slot]: {
        ...prev[slot],
        [field]: field === 'price'
          ? v.replace(/[^0-9.]/g, '')
          : field === 'stock'
          ? v.replace(/[^0-9]/g, '')
          : v,
      },
    }));
  };

  const handleNewItemChange = (slot, field, v) => {
    setNewItems(p => ({
      ...p,
      [slot]: {
        ...p[slot],
        [field]: field === 'price'
          ? v.replace(/[^0-9.]/g, '')
          : field === 'stock'
          ? v.replace(/[^0-9]/g, '')
          : v,
      },
    }));
  };

  const toggleDeleteSlot = (slot) => {
    setDeleteSlots(p => ({ ...p, [slot]: !p[slot] }));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <Layout style={styles.container}>
          <View style={styles.headerRow}>
            <Text category="h5">Inventory: {vm.vm_name}</Text>
            <View style={styles.actionsRow}>
              <Button status="danger" size="tiny" onPress={confirmDeleteVm}>
                Delete VM
              </Button>
              <Button appearance="ghost" size="tiny" onPress={() => navigation.goBack()}>
                Back
              </Button>
            </View>
          </View>

          <View style={styles.statusRow}>
            <View style={[styles.statusDot, onlineStatus ? styles.greenDot : styles.redDot]} />
            <Text category="p2">{onlineStatus ? 'Online' : 'Offline'}</Text>
            <Text style={vmIsRegistered ? styles.registeredTag : styles.unregisteredTag}>
              {vmIsRegistered ? 'Registered' : 'Unregistered'}
            </Text>
          </View>

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.gridContainer}>
              {Array.from({ length: vm.vm_row_count || 0 }).map((_, r) => (
                <View style={styles.row} key={r}>
                  {Array.from({ length: vm.vm_column_count || 0 }).map((_, c) => {
                    const slot = `${String.fromCharCode(65 + c)}${r + 1}`;
                    const item = vmInventory.find(i => i.slot === slot);
                    const stock = item ? item.stock : null;

                    let borderColor = '#aaa';
                    if (stock === 0) borderColor = 'red';
                    else if (stock !== null && stock < 5) borderColor = 'yellow';

                    return (
                      <View key={slot} style={[styles.cell, { borderColor }]}>                    
                        <Text category="c2" style={styles.slotLabel}>{slot}</Text>

                        {item && !isRestockMode && (
                          <>
                            <Text category="c1" style={styles.cellText} numberOfLines={1}>{item.itemName}</Text>
                            <Text category="s2" style={styles.stockText}>{stock}</Text>
                          </>
                        )}

                        {item && isRestockMode && !deleteSlots[slot] && (
                          <>
                            <Input
                              style={styles.nameInput}
                              value={editedItems[slot]?.itemName}
                              onChangeText={v => handleItemChange(slot, 'itemName', v)}
                              maxLength={10}
                            />
                            <View style={styles.newRow}>
                              <Input
                                style={styles.priceInput}
                                placeholder="$"
                                keyboardType="numeric"
                                value={editedItems[slot]?.price}
                                onChangeText={v => handleItemChange(slot, 'price', v)}
                              />
                              <Input
                                style={styles.stockInput}
                                placeholder="#"
                                keyboardType="numeric"
                                value={editedItems[slot]?.stock}
                                onChangeText={v => handleItemChange(slot, 'stock', v)}
                              />
                            </View>
                            <Button 
                              size="tiny"
                              status="basic"
                              style={{ marginTop: 6 }}
                              onPress={() => toggleDeleteSlot(slot)}
                            >
                              Del
                            </Button>
                          </>
                        )}

                        {item && isRestockMode && deleteSlots[slot] && (
                          <>
                            <Text category="c1" style={[styles.cellText, styles.deleted]} numberOfLines={1}>{item.itemName}</Text>
                            <Button size="tiny" status="danger" onPress={() => toggleDeleteSlot(slot)}>
                              Undo
                            </Button>
                          </>
                        )}

                        {isRestockMode && !item && (
                          <>
                            <Input
                              style={styles.nameInput}
                              placeholder="Name"
                              value={newItems[slot]?.itemName}
                              onChangeText={v => handleNewItemChange(slot, 'itemName', v)}
                              maxLength={10}
                            />
                            <View style={styles.newRow}>
                              <Input
                                style={styles.priceInput}
                                placeholder="$"
                                keyboardType="numeric"
                                value={newItems[slot]?.price}
                                onChangeText={v => handleNewItemChange(slot, 'price', v)}
                              />
                              <Input
                                style={styles.stockInput}
                                placeholder="#"
                                keyboardType="numeric"
                                value={newItems[slot]?.stock}
                                onChangeText={v => handleNewItemChange(slot, 'stock', v)}
                              />
                            </View>
                          </>
                        )}
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
          
          <View style={styles.buttonRow}>
            {!isRestockMode ? (
              <Button style={styles.button} disabled={!vmIsRegistered} onPress={startRestock}>
                Edit Stocks
              </Button>
            ) : (
              <>
                <Button style={styles.button} onPress={cancelRestock}>Cancel</Button>
                <Button style={styles.button} onPress={submitRestock}>Submit Changes</Button>
              </>
            )}
          </View>
        </Layout>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  container: { 
    flex: 1,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionsRow: { flexDirection: 'row', alignItems: 'center' },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  greenDot: { backgroundColor: '#4caf50' },
  redDot: { backgroundColor: '#f44336' },
  registeredTag: { color: '#2e7d32', marginLeft: 12 },
  unregisteredTag: { color: '#d32f2f', marginLeft: 12 },
  gridContainer: { 
    alignItems: 'center', 
    width: '100%',
  },
  row: { flexDirection: 'row' },
  cell: {
    width: 80,
    height: 120,
    borderWidth: 2,
    margin: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    position: 'relative',
  },
  slotLabel: {
    position: 'absolute',
    top: 2,
    right: 4,
    fontSize: 10,
    color: '#444',
  },
  cellText: { fontSize: 12, textAlign: 'center', color: '#000', marginTop: 16 },
  stockText: { fontSize: 10, marginTop: 4, color: '#000' },
  deleted: { 
    textDecorationLine: 'line-through',
    color: '#888'
  },
  nameInput: {
    width: 60,
    marginTop: 4,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 4,
    fontSize: 10,
  },
  priceInput: {
    width: 30,
    height: 24,
    marginHorizontal: 2,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 4,
    fontSize: 10,
  },
  stockInput: {
    width: 30,
    height: 24,
    marginHorizontal: 2,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 4,
    fontSize: 10,
  },
  newRow: { flexDirection: 'row', marginTop: 2 },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    paddingBottom: 8,
    width: '100%',
  },
  button: { 
    flex: 1, 
    marginHorizontal: 4,
  },
});