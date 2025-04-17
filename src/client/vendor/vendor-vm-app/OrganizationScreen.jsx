import React, { useState } from 'react';
import { ScrollView, StyleSheet, Dimensions } from 'react-native';
import { Layout, Select, SelectItem, IndexPath, Input, Button, Text } from '@ui-kitten/components';

const { width } = Dimensions.get('window');
const boxWidth = width * 0.25;

export default function OrganizationScreen({ route, navigation }) {
  const { user } = route.params;
  const [currentUser, setCurrentUser] = useState(user);
  const [mode, setMode] = useState(null);
  const [orgName, setOrgName] = useState('');
  const [groups, setGroups] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [members] = useState(['Alice', 'Bob', 'Charlie']);
  const [vms] = useState(['VM1', 'VM2', 'VM3']);
  const [memberAssignments, setMemberAssignments] = useState({});
  const [vmAssignments, setVmAssignments] = useState({});

  const handleSubmit = () => {
    if (!orgName) return;
    if (mode === 'create') setCurrentUser({ ...currentUser, organization: orgName, role: 'admin' });
    else if (mode === 'join') setCurrentUser({ ...currentUser, organization: orgName });
    setOrgName(''); setMode(null);
  };

  const handleCreateGroup = () => {
    if (groupName && !groups.includes(groupName)) { setGroups([...groups, groupName]); setGroupName(''); }
  };

  const assignMemberToGroup = (member, index) => {
    const group = groups[index.row];
    setMemberAssignments({ ...memberAssignments, [member]: group });
  };

  const assignVmToGroup = (vm, index) => {
    const group = groups[index.row];
    setVmAssignments({ ...vmAssignments, [vm]: group });
  };

  const leaveOrg = () => setCurrentUser({ ...currentUser, organization: null, role: 'maintainer' });

  return (
    <Layout style={styles.container}>
      <Text category='h4' style={styles.header}>Organization Management</Text>

      {!currentUser.organization ? (
        <Layout style={styles.section}>
          <Layout style={styles.toggleContainer}>
            <Button style={[styles.toggleButton, { width: boxWidth }]} appearance={mode==='create'?'filled':'outline'} onPress={() => setMode('create')}>Create</Button>
            <Button style={[styles.toggleButton, { width: boxWidth }]} appearance={mode==='join'?'filled':'outline'} onPress={() => setMode('join')}>Join</Button>
          </Layout>
          <Input style={[styles.input, { width: boxWidth }]} placeholder='Organization Name' value={orgName} onChangeText={setOrgName} />
          <Button style={[styles.button, { width: boxWidth }]} onPress={handleSubmit}>Submit</Button>
        </Layout>
      ) : (
        <ScrollView contentContainerStyle={styles.section}>
          <Text category='s1' style={styles.subHeader}>Org: {currentUser.organization}</Text>

          <Layout style={styles.row}>
            <Layout style={styles.column}>
              <Text category='s2'>Members</Text>
              {members.map(member => (
                <Layout key={member} style={styles.rowItem}>
                  <Text style={styles.rowText}>{member}</Text>
                  <Select
                    selectedIndex={memberAssignments[member] ? new IndexPath(groups.indexOf(memberAssignments[member])) : null}
                    value={memberAssignments[member] || 'Select Group'}
                    onSelect={index => assignMemberToGroup(member, index)}
                    style={{ width: boxWidth }}>
                    {groups.map((g, i) => <SelectItem key={i} title={g} />)}
                  </Select>
                </Layout>
              ))}
            </Layout>

            <Layout style={styles.column}>
              <Text category='s2'>Vending Machines</Text>
              {vms.map(vm => (
                <Layout key={vm} style={styles.rowItem}>
                  <Text style={styles.rowText}>{vm}</Text>
                  <Select
                    selectedIndex={vmAssignments[vm] ? new IndexPath(groups.indexOf(vmAssignments[vm])) : null}
                    value={vmAssignments[vm] || 'Select Group'}
                    onSelect={index => assignVmToGroup(vm, index)}
                    style={{ width: boxWidth }}>
                    {groups.map((g, i) => <SelectItem key={i} title={g} />)}
                  </Select>
                </Layout>
              ))}
            </Layout>
          </Layout>

          <Input style={[styles.input, { width: boxWidth }]} placeholder='New Group Name' value={groupName} onChangeText={setGroupName} />
          <Button style={[styles.button, { width: boxWidth }]} onPress={handleCreateGroup}>Create Group</Button>
          <Button status='danger' style={[styles.dangerButton, { width: boxWidth }]} onPress={leaveOrg}>Leave Org</Button>
        </ScrollView>
      )}

      <Button appearance='ghost' style={[styles.button, { width: boxWidth }]} onPress={() => navigation.goBack()}>Back</Button>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', alignItems:'center', padding:20 },
  header: { marginBottom:20 },
  section: { alignItems:'center' },
  toggleContainer: { flexDirection:'row', justifyContent:'space-between', marginBottom:15 },
  toggleButton: { marginHorizontal:5 },
  input: { marginVertical:10 },
  button: { marginVertical:5 },
  dangerButton: { marginVertical:5 },
  row: { flexDirection:'row', justifyContent:'space-between', width:'100%' },
  column: { flex:1, alignItems:'center' },
  rowItem: { flexDirection:'row', alignItems:'center', marginVertical:5 },
  rowText: { marginRight:10 },
  subHeader: { marginVertical:10 }
});
