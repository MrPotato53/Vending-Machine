// DashboardScreen.js

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  Text as RNText,
} from 'react-native';
import { Layout, Text, Input, Button, List, ListItem } from '@ui-kitten/components';
import api from './apiCommunicator';

export default function DashboardScreen({ route, navigation }) {
  const [user, setUser] = useState(route.params.user);
  const [vendingMachines, setVendingMachines] = useState([]);
  const [onlineStatus, setOnlineStatus] = useState({});
  const [searchVM, setSearchVM] = useState('');

  const isAdmin = user.u_role === 'admin';
  const isMaintainer = user.u_role === 'maintainer';

  // Refresh user periodically
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const updated = await api.getUser(user.email);
        setUser(updated);
      } catch {}
    }, 5000);
    return () => clearInterval(id);
  }, [user.email]);

  // Load machines
  const fetchMachines = useCallback(async () => {
    let vms = [];
    if (isAdmin) {
      const display = await api.getOrgDisplay(user.org_id);
      vms = display.vms;
    } else if (isMaintainer) {
      const groupId = user.group_id || user.groupId;
      vms = await api.getVendingMachinesByGroup(user.org_id, groupId);
    }
    setVendingMachines(vms);

    const statusObj = {};
    await Promise.all(
      vms.map(async vm => {
        try {
          const { isOnline } = await api.isVMOnline(vm.vm_id);
          statusObj[vm.vm_id] = isOnline;
        } catch {
          statusObj[vm.vm_id] = false;
        }
      })
    );
    setOnlineStatus(statusObj);
  }, [user.org_id, isAdmin, isMaintainer, user.group_id, user.groupId]);

  // Initial load & polling
  useEffect(() => {
    fetchMachines();
    const id = setInterval(fetchMachines, 5000);
    return () => clearInterval(id);
  }, [fetchMachines]);

  // Filter by VM name
  const filtered = vendingMachines.filter(vm =>
    vm.vm_name.toLowerCase().includes(searchVM.toLowerCase())
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Layout style={styles.container}>
        <Text category="h5">Dashboard</Text>
        <Text>{`Welcome, ${user.email} (${user.u_role})`}</Text>
        <RNText style={styles.instruction}>
          Select a vending machine to manage inventory.
        </RNText>

        <View style={styles.topRow}>
          <Input
            placeholder="Search VMs"
            value={searchVM}
            onChangeText={setSearchVM}
            style={styles.input}
          />
          <Button size="tiny" onPress={fetchMachines} style={styles.reloadBtn}>
            Reload
          </Button>
        </View>

        <List
          data={filtered}
          renderItem={({ item }) => (
            <ListItem
              title={() => (
                <View style={styles.vmRow}>
                  <View
                    style={[
                      styles.statusDot,
                      onlineStatus[item.vm_id] ? styles.greenDot : styles.redDot,
                    ]}
                  />
                  <Text>{item.vm_name}</Text>
                </View>
              )}
              onPress={() => navigation.navigate('Inventory', { user, vm: item })}
            />
          )}
          style={styles.list}
        />

        {/* Add VM button at bottom of list */}
        <Button
          style={styles.addButton}
          onPress={() => navigation.navigate('AddVendingMachine', { user })}
        >
          Add Vending Machine
        </Button>

        <View style={styles.actionRow}>
          {/* Everyone can manage org */}
          <Button
            style={styles.button}
            onPress={() => navigation.navigate('Organization', { user })}
          >
            Manage Organization
          </Button>
          <Button
            style={styles.button}
            onPress={() => navigation.replace('Login')}
          >
            Logout
          </Button>
        </View>
      </Layout>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  instruction: { marginVertical: 12, fontStyle: 'italic' },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, marginRight: 8 },
  reloadBtn: { width: 80 },
  list: { marginVertical: 8 },
  vmRow: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  greenDot: { backgroundColor: '#4caf50' },
  redDot: { backgroundColor: '#f44336' },
  addButton: { marginVertical: 12 },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: { flex: 1, marginHorizontal: 4 },
});