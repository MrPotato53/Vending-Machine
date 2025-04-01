import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import apiCommunicator from './apiCommunicator';

export default function AddVendingMachineScreen({ route, navigation }) {
  const { user } = route.params;
  const [vmId, setVmId] = useState('');
  const [organization, setOrganization] = useState('');
  const [rowCount, setRowCount] = useState('');
  const [columnCount, setColumnCount] = useState('');
  const [vmName, setVmName] = useState('');

  const handleSubmit = async () => {
    if (!vmId || !organization || !rowCount || !columnCount) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    // Use a default name if none is provided.
    const name = vmName || `${organization} - ${vmId}`;
    try {
      // Optionally, you can modify your API to include organization.
      const newVM = await apiCommunicator.postMachine(
        vmId,
        name,
        parseInt(rowCount, 10),
        parseInt(columnCount, 10),
        "i" // Set default mode as 'i' for idle
      );
      Alert.alert("Success", "Vending Machine added successfully");
      navigation.navigate('Dashboard', { user });
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Add Vending Machine</Text>
      <TextInput
        style={styles.input}
        placeholder="Vending Machine ID"
        value={vmId}
        onChangeText={setVmId}
      />
      <TextInput
        style={styles.input}
        placeholder="Organization"
        value={organization}
        onChangeText={setOrganization}
      />
      <TextInput
        style={styles.input}
        placeholder="Row Count"
        keyboardType="numeric"
        value={rowCount}
        onChangeText={setRowCount}
      />
      <TextInput
        style={styles.input}
        placeholder="Column Count"
        keyboardType="numeric"
        value={columnCount}
        onChangeText={setColumnCount}
      />
      <TextInput
        style={styles.input}
        placeholder="Vending Machine Name (optional)"
        value={vmName}
        onChangeText={setVmName}
      />
      <Button title="Add Vending Machine" onPress={handleSubmit} />
      <Button title="Cancel" onPress={() => navigation.goBack()} />
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
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    width: '100%',
    marginBottom: 10,
    paddingHorizontal: 10
  }
});
