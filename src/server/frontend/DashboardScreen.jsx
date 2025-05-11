// DashboardScreen.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Text as RNText,
} from 'react-native';
import { Layout, Text, Input, Button, List, ListItem } from '@ui-kitten/components';
import { useFocusEffect } from '@react-navigation/native';
import api from './apiCommunicator';
import VMMap from './VMMap.jsx';

export default function DashboardScreen({ route, navigation }) {
  /* ───────────── state ───────────── */
  const [user, setUser]             = useState(route.params.user);
  const [vendingMachines, setVMs]   = useState([]);
  const [onlineStatus, setStatus]   = useState({});
  const [locations, setLocations]   = useState({});
  const [inventories, setInv]       = useState({});
  const [searchVM, setSearchVM]     = useState('');

  const pollRef   = useRef(null);
  const userRef   = useRef(null);

  const isAdmin      = user.u_role === 'admin';
  const isMaintainer = user.u_role === 'maintainer';

  /* ───────── refresh logged-in user ───────── */
  useEffect(() => {
    userRef.current = setInterval(async () => {
      try {
        const updated = await api.getUser(user.email);
        setUser(cur => {
          if (updated.u_role !== cur.u_role) {
            clearInterval(userRef.current);
            navigation.replace('Dashboard', { user: updated });
          }
          return updated;
        });
      } catch {/* ignore */}
    }, 5000);

    return () => clearInterval(userRef.current);
  }, [user.email, navigation]);

  const handleLogout = () => {
    clearInterval(userRef.current);
    navigation.replace('Login');
  };

  /* ─────────── fetch VMs + status + location + inventory ─────────── */
  const fetchMachines = useCallback(async () => {
    const DEFAULT_ORG   = 1000001;
    const DEFAULT_GROUP = 3000001;
    const groupId       = user.group_id ?? user.groupId;

    if (user.org_id === DEFAULT_ORG && groupId === DEFAULT_GROUP) {
      setVMs([]); setStatus({}); setLocations({}); setInv({});
      return;
    }

    let vms = [];
    if (isAdmin) {
      const { vms: list } = await api.getOrgDisplay(user.org_id);
      vms = list;
    } else if (isMaintainer) {
      vms = await api.getVendingMachinesByGroup(user.org_id, groupId);
    }

    /* parallel per-VM fetch */
    const statusObj = {}, locObj = {}, invObj = {};

    await Promise.all(
      vms.map(async vm => {
        try {
          const [{ isOnline }, locRes, inv] = await Promise.all([
            api.isVMOnline(vm.vm_id),
            api.getVMLocation(vm.vm_id),
            api.getInventory(vm.vm_id),
          ]);
          
          statusObj[vm.vm_id] = isOnline;
          if (locRes?.location) locObj[vm.vm_id] = locRes.location;
          invObj[vm.vm_id] = inv;           // full inventory array
        } catch {
          statusObj[vm.vm_id] = false;
        }
      })
    );
    await Promise.all(
      vms.map(async vm => {
        if (vm.vm_mode == null) {
          try {
            const full = await api.getVendingMachine(vm.vm_id); // <- endpoint that has vm_mode
            vm.vm_mode = full.vm_mode;                          // mutate in-place
          } catch {/* ignore */}
        }
      })
    );

    setVMs(vms);
    setStatus(statusObj);
    setLocations(locObj);
    setInv(invObj);
  }, [user.org_id, user.group_id, user.groupId, isAdmin, isMaintainer]);

  /* ───────── focus-aware polling ───────── */
  useFocusEffect(
    useCallback(() => {
      fetchMachines();
      pollRef.current = setInterval(fetchMachines, 5000);
      return () => clearInterval(pollRef.current);
    }, [fetchMachines])
  );

  /* ───────── helpers ───────── */
  const filtered = vendingMachines.filter(vm =>
    vm.vm_name.toLowerCase().includes(searchVM.toLowerCase())
  );

  const modeLabelFor = m =>
    m === 'i' ? 'Idle' : m === 'r' ? 'Restocking' : m === 't' ? 'Transaction' : 'Unknown';

  const vmIdToName = Object.fromEntries(
    vendingMachines.map(vm => [String(vm.vm_id), vm.vm_name])
  );

  /* ─────────────── render ─────────────── */
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Layout style={styles.container}>
          <Text category="h5">Dashboard</Text>
          <Text>{`Welcome, ${user.email} (${user.u_role})`}</Text>
          <RNText style={styles.instruction}>Select a vending machine to manage inventory.</RNText>

          {/* search + reload */}
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

          {/* map with inventory-aware markers */}
          {Object.keys(locations).length > 0 && (
            <VMMap
              markers={Object.entries(locations).map(([id, loc]) => ({
                vm_id: id,
                lat: loc.lat,
                lng: loc.lng,
                vm_name: vmIdToName[id] || 'Unknown',
                inventory: inventories[id] || [],
              }))}
            />
          )}

          {/* VM list */}
          <List
            data={filtered}
            renderItem={({ item }) => {
              const registered =
                (item.vm_row_count ?? 0) > 0 && (item.vm_column_count ?? 0) > 0;
              const dim = registered
                ? `${item.vm_row_count} × ${item.vm_column_count}`
                : 'Unregistered';
              const mode = item.vm_mode ? modeLabelFor(item.vm_mode) : 'Unknown';

              return (
                <ListItem
                  title={() => (
                    <View style={styles.vmRow}>
                      <View
                        style={[
                          styles.statusDot,
                          onlineStatus[item.vm_id] ? styles.greenDot : styles.redDot,
                        ]}
                      />
                      <Text category="s1">{item.vm_name}</Text>
                    </View>
                  )}
                  description={() => {
                    const loc = locations[item.vm_id];
                    const coords = loc
                      ? `Lat: ${loc.lat.toFixed(4)}, Lng: ${loc.lng.toFixed(4)}`
                      : 'No Location';
                    return (
                      <Text appearance="hint">
                        ID: {item.vm_id} · {dim} · Mode: {onlineStatus[item.vm_id] ? mode : 'Unknown'}
                      </Text>
                    );
                  }}
                  onPress={() => navigation.navigate('Inventory', { user, vm: item })}
                />
              );
            }}
            style={styles.list}
            contentContainerStyle={{ paddingBottom: 120 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
          />
        </Layout>

        {/* bottom bar */}
        <View style={styles.bottomBar}>
          <Button
            style={styles.addButton}
            disabled={!isAdmin}
            appearance={isAdmin ? 'filled' : 'outline'}
            onPress={() => navigation.navigate('AddVendingMachine', { user })}
          >
            Add Vending Machine
          </Button>

          <View style={styles.actionRow}>
            <Button style={styles.button} onPress={() => navigation.navigate('Organization', { user })}>
              Manage Organization
            </Button>
            <Button style={styles.button} onPress={handleLogout}>
              Logout
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ───────── styles ───────── */
const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  keyboardAvoid: { flex: 1, position: 'relative' },
  container: { flex: 1, padding: 24, maxHeight: '91vh' },
  instruction: { marginVertical: 12, fontStyle: 'italic' },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, marginRight: 8 },
  reloadBtn: { width: 80 },
  list: { flex: 1, marginVertical: 8 },
  vmRow: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  greenDot: { backgroundColor: '#4caf50' },
  redDot: { backgroundColor: '#f44336' },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addButton: { marginBottom: 12 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  button: { flex: 1, marginHorizontal: 4 },
});
