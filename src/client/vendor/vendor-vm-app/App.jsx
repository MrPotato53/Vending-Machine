import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen';
import DashboardScreen from './DashboardScreen';
import VMDetailScreen from './VMDetailScreen';
import OrganizationScreen from './OrganizationScreen';
import AddVendingMachineScreen from './AddVendingMachineScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen 
          name="VMDetail" 
          component={VMDetailScreen} 
          options={{ title: 'Vending Machine Details' }}
        />
        <Stack.Screen name="Organization" component={OrganizationScreen} />
        <Stack.Screen name="AddVendingMachine" component={AddVendingMachineScreen} options={{ title: 'Register Vending Machine' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
