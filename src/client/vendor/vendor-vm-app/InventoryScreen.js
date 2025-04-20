// InventoryScreen.js

import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Layout, Text, Input, Button } from '@ui-kitten/components';
import api from './apiCommunicator';

export default function InventoryScreen({ route, navigation }) {
  const { user, vm } = route.params;
  const [vmInventory, setVmInventory] = useState([]);
  const [onlineStatus, setOnlineStatus] = useState(false);
  const [isRestockMode, setIsRestockMode] = useState(false);
  const [editedStocks, setEditedStocks] = useState({});

  const vmIsRegistered = Boolean(vm.vm_row_count && vm.vm_column_count);

  // fetch inventory & online status once on mount
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

  // delete machine
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

  // restock mode controls
  const startRestock = async () => {
    if (!vmIsRegistered) return;
    await api.updateVendingMachineMode(vm.vm_id, 'r');
    setIsRestockMode(true);
    const initial = {};
    vmInventory.forEach(item => {
      initial[item.slot] = item.stock.toString();
    });
    setEditedStocks(initial);
  };

  const cancelRestock = async () => {
    await api.updateVendingMachineMode(vm.vm_id, 'i');
    setIsRestockMode(false);
    setEditedStocks({});
  };

  const submitRestock = async () => {
    const rows = vmInventory.map(item => ({
      slot_name: item.slot,
      item_name: item.itemName,
      price: item.price,
      stock: parseInt(editedStocks[item.slot], 10),
    }));
    await api.batchUpdateInventory(vm.vm_id, rows);
    await api.updateVendingMachineMode(vm.vm_id, 'i');
    setIsRestockMode(false);
    fetchInventory();
  };

  const handleStockChange = (slot, val) => {
    const digitsOnly = val.replace(/[^0-9]/g, '');
    setEditedStocks(prev => ({ ...prev, [slot]: digitsOnly }));
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Layout style={styles.container}>
        <View style={styles.headerRow}>
          <Text category="h5">Inventory: {vm.vm_name}</Text>
          <View style={styles.actionsRow}>
            <Button
              status="danger"
              size="tiny"
              onPress={deleteVm}
            >
              Delete VM
            </Button>
            <Button
              appearance="ghost"
              size="tiny"
              onPress={() => navigation.goBack()}
            >
              Back
            </Button>
          </View>
        </View>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              onlineStatus ? styles.greenDot : styles.redDot,
            ]}
          />
          <Text category="p2">{onlineStatus ? 'Online' : 'Offline'}</Text>
          {vmIsRegistered ? (
            <Text style={styles.registeredTag}>Registered</Text>
          ) : (
            <Text style={styles.unregisteredTag}>Unregistered</Text>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.gridContainer}>
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
                  <View
                    key={slot}
                    style={[styles.cell, { borderColor }]}
                  >
                    <Text category="c1" style={styles.cellText} numberOfLines={1}>
                      {item?.itemName || ''}
                    </Text>
                    {isRestockMode && stock !== null ? (
                      <Input
                        style={styles.qtyInput}
                        keyboardType="numeric"
                        value={editedStocks[slot]}
                        onChangeText={v => handleStockChange(slot, v)}
                      />
                    ) : null}
                    {!isRestockMode && stock !== null ? (
                      <Text category="s2" style={styles.stockText}>
                        {stock}
                      </Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ))}
        </ScrollView>

        <View style={styles.buttonRow}>
          {!isRestockMode ? (
            <Button
              disabled={!vmIsRegistered}
              onPress={startRestock}
              style={styles.button}
            >
              Edit Stocks
            </Button>
          ) : (
            <>
              <Button onPress={cancelRestock} style={styles.button}>
                Cancel
              </Button>
              <Button onPress={submitRestock} style={styles.button}>
                Submit Changes
              </Button>
            </>
          )}
        </View>
      </Layout>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, alignItems: 'center' },
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
  gridContainer: { alignItems: 'center' },
  row: { flexDirection: 'row' },
  cell: {
    width: 70,
    height: 90,
    borderWidth: 2,
    margin: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  cellText: { fontSize: 12, textAlign: 'center', color: '#000' },
  stockText: { fontSize: 10, marginTop: 4, color: '#000' },
  qtyInput: {
    width: 50,
    marginTop: 4,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    width: '100%',
  },
  button: { flex: 1, marginHorizontal: 4 },
  backButton: { marginTop: 16 },
});
