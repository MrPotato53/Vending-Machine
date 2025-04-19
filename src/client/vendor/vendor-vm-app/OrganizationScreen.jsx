import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { Layout, Select, SelectItem, IndexPath, Button, Text, Input } from '@ui-kitten/components';
import { api } from './apiCommunicator';

const boxWidth = Dimensions.get('window').width * 0.8;

export default function OrganizationScreen({ route, navigation }) {
  const [user, setUser] = useState(route.params.user);
  const [data, setData] = useState({ users: [], groups: [], vms: [] });
  const [mode, setMode] = useState('i'); // i=join, c=create
  const [orgName, setOrgName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [memberAssignments, setMemberAssignments] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user.org_id && user.org_id !== 1000001) loadDisplay();
  }, [user.org_id]);

  const loadDisplay = async () => {
    setLoading(true);
    setError('');
    try {
      const disp = await api.getOrgDisplay(user.org_id);
      setData(disp);
      // initialize member assignments to current data
      const initial = {};
      disp.users.forEach(u => { initial[u.email] = u.group_id; });
      setMemberAssignments(initial);
    } catch (e) {
      setError(e.message.includes('404') ? 'Organization not found' : e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignMember = async (email, index) => {
    const group = data.groups[index.row];
    if (!group) return;
    try {
      await api.assignUserToGroup(email, group.group_id, user.email);
      setMemberAssignments(prev => ({ ...prev, [email]: group.group_id }));
      Alert.alert('Success', `${email} added to ${group.group_name}`);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const handleCreateOrJoin = async () => {
    if (!orgName.trim()) { setError('Enter an org name'); return; }
    setError('');
    try {
      if (mode === 'c') {
        const { admin_user } = await api.createOrganization(orgName, user.email);
        setUser(admin_user);
      } else {
        const { org_id } = await api.getOrgByName(orgName);
        await api.updateUser(user.email, { org_id });
        setUser(prev => ({ ...prev, org_id }));
      }
      setOrgName(''); setMode('i');
    } catch (e) {
      setError(e.message);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) { Alert.alert('Error', 'Enter a group name'); return; }
    try {
      await api.createGroup(user.org_id, groupName, user.email);
      setGroupName(''); loadDisplay();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const handleLeaveOrg = async () => {
    try {
      await api.leaveOrganization(user.org_id, user.email);
      setUser(prev => ({ ...prev, org_id: 1000001, u_role: 'maintainer' }));
      setData({ users: [], groups: [], vms: [] });
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  if (loading) {
    return (<Layout style={styles.loader}><ActivityIndicator/></Layout>);
  }

  const invalidOrg = !user.org_id || user.org_id === 1000001 || error;
  if (invalidOrg) {
    return (
      <Layout style={styles.container}>
        {error ? <Text status='danger'>{error}</Text> : <Text>You are not in an organization.</Text>}
        <Layout style={styles.toggle}>
          <Button onPress={() => setMode('c')} appearance={mode === 'c' ? 'filled' : 'outline'}>Create</Button>
          <Button onPress={() => setMode('i')} appearance={mode === 'i' ? 'filled' : 'outline'}>Join</Button>
        </Layout>
        <Input placeholder='Organization Name' value={orgName} onChangeText={setOrgName} style={styles.input}/>
        <Button onPress={handleCreateOrJoin} style={styles.button}>{mode==='c'?'Create Org':'Join Org'}</Button>
        <Button appearance='ghost' onPress={() => navigation.goBack()} style={styles.button}>Cancel</Button>
      </Layout>
    );
  }

  const groupNames = data.groups.map(g => g.group_name);

  return (
    <Layout style={styles.container}>
      <Text category='h4'>Organization #{user.org_id}</Text>
      <ScrollView contentContainerStyle={styles.section}>
        <Text category='s2'>Members</Text>
        {data.users.map(u => {
          const gid = memberAssignments[u.email];
          const grp = data.groups.find(g => g.group_id === gid);
          const idx = grp ? groupNames.indexOf(grp.group_name) : -1;
          const selectedIndex = idx >= 0 ? new IndexPath(idx) : null;
          const value = grp ? grp.group_name : 'Select Group';
          return (
            <Layout key={u.u_id} style={styles.row}>
              <Text style={styles.text}>{u.u_name}</Text>
              <Select
                selectedIndex={selectedIndex}
                value={value}
                onSelect={index => handleAssignMember(u.email, index)}
                style={{ width: boxWidth }}
              >
                {groupNames.map((n, i) => <SelectItem key={i} title={n}/>)}
              </Select>
            </Layout>
          );
        })}

        <Text category='s2' style={{ marginTop:20 }}>Vending Machines</Text>
        {data.vms.map(vm => (
          <Layout key={vm.vm_id} style={styles.row}>
            <Text style={styles.text}>{vm.vm_name}</Text>
            {/* VM grouping UI can be added here similarly */}
          </Layout>
        ))}

        <Text category='s2' style={{ marginTop:20 }}>Create New Group</Text>
        <Input placeholder='Group Name' value={groupName} onChangeText={setGroupName} style={[styles.input,{width:boxWidth}]}/>
        <Button onPress={handleCreateGroup} style={styles.button}>Create Group</Button>

        <Button status='danger' onPress={handleLeaveOrg} style={styles.button}>Leave Organization</Button>
      </ScrollView>

      <Button appearance='ghost' onPress={() => navigation.goBack()} style={styles.button}>Back</Button>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,padding:20,alignItems:'center'},
  loader:{flex:1,justifyContent:'center',alignItems:'center'},
  section:{alignItems:'center',width:'100%',paddingBottom:20},
  row:{flexDirection:'row',alignItems:'center',marginVertical:5},
  text:{flex:1},
  toggle:{flexDirection:'row',marginVertical:10},
  input:{marginVertical:10},
  button:{marginVertical:5},
});
