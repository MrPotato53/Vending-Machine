import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Button, StyleSheet, Alert } from 'react-native';

export default function OrganizationScreen({ route, navigation }) {
  const { user } = route.params;
  const [mode, setMode] = useState(null); // 'create' or 'join'
  const [orgName, setOrgName] = useState('');

  const handleSubmit = () => {
    if (!orgName) {
      Alert.alert("Error", "Please enter an organization name.");
      return;
    }
    if (mode === 'create') {
      // Simulate organization creation: update user's role to admin.
      const updatedUser = { ...user, organization: orgName, role: 'admin' };
      Alert.alert("Success", `Organization "${orgName}" created. You are now an admin.`);
      navigation.navigate('Dashboard', { user: updatedUser });
    } else if (mode === 'join') {
      // Simulate organization joining: role remains maintainer.
      const updatedUser = { ...user, organization: orgName };
      Alert.alert("Success", `Joined organization "${orgName}". An admin will assign you rights if needed.`);
      navigation.navigate('Dashboard', { user: updatedUser });
    } else {
      Alert.alert("Error", "Please select an option: Create or Join.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Organization</Text>
      
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[styles.option, mode === 'create' && styles.selectedOption]}
          onPress={() => setMode('create')}
        >
          <Text style={styles.optionText}>Create Organization</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.option, mode === 'join' && styles.selectedOption]}
          onPress={() => setMode('join')}
        >
          <Text style={styles.optionText}>Join Organization</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.label}>Organization Name:</Text>
      <TextInput 
        style={styles.input}
        placeholder="Enter organization name"
        value={orgName}
        onChangeText={setOrgName}
      />
      <Button title="Submit" onPress={handleSubmit} />
      <Button title="Back to Dashboard" onPress={() => navigation.goBack()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center'
  },
  header: {
    fontSize: 26,
    marginBottom: 20
  },
  optionsContainer: {
    flexDirection: 'row',
    marginBottom: 20
  },
  option: {
    padding: 10,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  selectedOption: {
    borderColor: '#007AFF',
    backgroundColor: '#E6F0FF'
  },
  optionText: {
    fontSize: 16,
    color: '#333'
  },
  label: {
    fontSize: 16,
    marginBottom: 5
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    width: '100%',
    marginVertical: 10,
    paddingHorizontal: 10
  }
});
