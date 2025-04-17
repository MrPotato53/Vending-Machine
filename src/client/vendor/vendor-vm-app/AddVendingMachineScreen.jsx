import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Layout, Input, Button, Text } from '@ui-kitten/components';
import apiCommunicator from './apiCommunicator';

export default function AddVendingMachineScreen({ route, navigation }) {
  const { user } = route.params;
  const [vmId, setVmId] = useState('');
  const [organization, setOrganization] = useState('');
  const [rowCount, setRowCount] = useState('');
  const [columnCount, setColumnCount] = useState('');

  const handleSubmit = async () => {
    // ... validation & API call
  };

  return (
    <Layout style={styles.container}>
      <Text category='h5' style={styles.header}>Add Vending Machine</Text>
      <Input style={styles.input} placeholder='Vending Machine ID' value={vmId} onChangeText={setVmId} />
      <Input style={styles.input} placeholder='Organization' value={organization} onChangeText={setOrganization} />
      <Input style={styles.input} placeholder='Row Count' keyboardType='numeric' value={rowCount} onChangeText={setRowCount} />
      <Input style={styles.input} placeholder='Column Count' keyboardType='numeric' value={columnCount} onChangeText={setColumnCount} />
      <Button style={styles.button} onPress={handleSubmit}>Add Machine</Button>
      <Button appearance='ghost' style={styles.button} onPress={() => navigation.goBack()}>Cancel</Button>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  header: { marginBottom: 20 },
  input: { marginBottom: 15 },
  button: { marginVertical: 5 },
});
