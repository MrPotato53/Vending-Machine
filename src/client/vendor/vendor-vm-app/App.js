import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import VendorInterface from './components/VendorInterface';

export default function App() {
  const [hardwareId, setHardwareId] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (hardwareId.trim()) {
      setSubmitted(true);
    }
  };

  if (!submitted) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Vending Machine Vendor Interface</Text>
        <TextInput 
          style={styles.input}
          placeholder="Enter Hardware ID"
          value={hardwareId}
          onChangeText={setHardwareId}
        />
        <Button title="Submit" onPress={handleSubmit} disabled={!hardwareId.trim()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vendor Interface for Hardware ID: {hardwareId}</Text>
      <VendorInterface hardwareId={hardwareId} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: 22,
    marginBottom: 20
  },
  input: {
    height: 40,
    width: '80%',
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10
  }
});
