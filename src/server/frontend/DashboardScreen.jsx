// DashboardScreen.js
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
import { MapView, Marker } from 'react-native-web-maps';
import api from './apiCommunicator';

export default function DashboardScreen({ route, navigation }) {
  const [user, setUser]           = useState(route.params.user);
  const [vendingMachines, setVMs] = useState([]);
  const [onlineStatus, setStat]   = useState({});
  const [searchVM, setSearchVM]   = useState('');
  const [region, setRegion]       = useState(null);
  const [markers, setMarkers]     = useState([]);

  const intervalRef = useRef(null);
  const userIntervalRef = useRef(null);

  const isAdmin      = user.u_role === 'admin';
  const isMaintainer = user.u_role === 'maintainer';

  useEffect(() => {
    userIntervalRef.current = setInterval(async () => {
      try {
        const updated = await api.getUser(user.email);
        setUser(currentUser => {
          if (updated.u_role !== currentUser.u_role) {
            clearInterval(userIntervalRef.current);
            navigation.replace('Dashboard', { user: updated });
          }
          return updated;
        });
      } catch {/* ignore */}
    }, 5000);
    return () => clearInterval(userIntervalRef.current);
  }, [user.email, navigation]);

  const handleLogout = () => {
    clearInterval(userIntervalRef.current);
    navigation.replace('Login');
  };

  const fetchMachines = useCallback(async () => {
    const DEFAULT_ORG   = 1000001;
    const DEFAULT_GROUP = 3000001;
    const groupId       = user.group_id ?? user.groupId;

    if (user.org_id === DEFAULT_ORG && groupId === DEFAULT_GROUP) {
      setVMs([]);
      setStat({});
      setMarkers([]);
      return;
    }

    let vms = [];
    if (isAdmin) {
      const display = await api.getOrgDisplay(user.org_id);
      vms = display.vms;
    } else if (isMaintainer) {
      vms = await api.getVendingMachinesByGroup(user.org_id, groupId);
    }
    setVMs(vms);

    const status = {};
    const locations = [];
    await Promise.all(
      vms.map(async vm => {
        try {
          const [statusResp, locResp] = await Promise.all([
            api.isVMOnline(vm.vm_id),
            api.getVMLocation(vm.vm_id)
          ]);

          status[vm.vm_id] = statusResp.isOnline;

          if (locResp?.location) {
            locations.push({
              vm_id: vm.vm_id,
              vm_name: vm.vm_name,
              lat: locResp.location.lat,
              lng: locResp.location.lng
            });
          }
        } catch {
          status[vm.vm_id] = false;
        }
      })
    );
    setStat(status);
    setMarkers(locations);

    if (locations.length > 0) {
      const lats = locations.map(l => l.lat);
      const lngs = locations.map(l => l.lng);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);

      setRegion({
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: Math.max(0.01, (maxLat - minLat) * 1.5),
        longitudeDelta: Math.max(0.01, (maxLng - minLng) * 1.5),
      });
    }
  }, [user.org_id, user.group_id, user.groupId, isAdmin, isMaintainer]);

  useFocusEffect(
    useCallback(() => {
      fetchMachines();
      intervalRef.current = setInterval(fetchMachines, 5000);
      return () => clearInterval(intervalRef.current);
    }, [fetchMachines]),
  );

  const filtered = vendingMachines.filter(vm =>
    vm.vm_name.toLowerCase().includes(searchVM.toLowerCase()),
  );

  const modeLabelFor = (mode) =>
    mode === 'i' ? 'Idle'
    : mode === 'r' ? 'Restocking'
    : mode === 't' ? 'Transaction'
    : 'Unknown';

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Layout style={styles.container}>
          <Text category="h5">Dashboard</Text>
          <Text>{`Welcome, ${user.email} (${user.u_role})`}</Text>
          <RNText style={styles.instruction}>
            Select a vending machine to manage inventory.
          </RNText>

          {region && (
            <MapView
              style={styles.map}
              region={region}
            >
              {markers.map(marker => (
                <Marker
                  key={marker.vm_id}
                  coordinate={{ latitude: marker.lat, longitude: marker.lng }}
                  title={marker.vm_name}
                  description={`ID: ${marker.vm_id}`}
                />
              ))}
            </MapView>
          )}

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
            renderItem={({ item }) => {
              const registered =
                (item.vm_row_count ?? 0) > 0 && (item.vm_column_count ?? 0) > 0;
              const dimText = registered
                ? `${item.vm_row_count} × ${item.vm_column_count}`
                : 'Unregistered';
              const modeText = item.vm_mode ? modeLabelFor(item.vm_mode) : 'Unknown';

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
                  description={() => (
                    <Text appearance="hint">
                      ID: {item.vm_id} · {dimText} · Mode: {onlineStatus[item.vm_id] ? modeText : 'Unknown'}
                    </Text>
                  )}
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
            <Button
              style={styles.button}
              onPress={() => navigation.navigate('Organization', { user })}
            >
              Manage Organization
            </Button>
            <Button
              style={styles.button}
              onPress={handleLogout}
            >
              Logout
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  keyboardAvoid: { flex: 1, position: 'relative' },
  container: { flex: 1, padding: 24 , maxHeight: '91vh' },
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
    left: 0, right: 0, bottom: 0,
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
  map: { height: 250, width: '100%', marginVertical: 10 },
});
