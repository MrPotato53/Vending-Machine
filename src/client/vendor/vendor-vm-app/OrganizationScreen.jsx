import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, StyleSheet, Dimensions, ActivityIndicator, Alert, Keyboard } from 'react-native';
import { Layout, Select, SelectItem, IndexPath, Button, Text, Input } from '@ui-kitten/components';
import api from './apiCommunicator';

const { width } = Dimensions.get('window');
const sectionWidth = width * 0.5;
const inputWidth = width * 0.6;

export default function OrganizationScreen({ route, navigation }) {
  const { user: initialUser } = route.params;
  const [user, setUser] = useState(initialUser);
  const [orgName, setOrgName] = useState('');
  const [data, setData] = useState({ users: [], groups: [], vms: [] });
  const [inputs, setInputs] = useState({ org: '', group: '', inviteEmail: '' });
  const [inviteGroupIdx, setInviteGroupIdx] = useState(null);
  const [inviteRoleIdx, setInviteRoleIdx] = useState(new IndexPath(1));
  const [memberAssignments, setMemberAssignments] = useState({});
  const [vmAssignments, setVmAssignments] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch organization name
  const fetchOrgName = useCallback(async () => {
    try {
      const { org_name } = await api.getOrgName(user.org_id);
      setOrgName(org_name);
    } catch (err) {
      console.error('Failed to fetch org name', err);
    }
  }, [user.org_id]);

  // Fetch organization display data
  const fetchOrg = useCallback(async () => {
    setLoading(true);
    try {
      // get org name
      await fetchOrgName();
      // display data
      const display = await api.getOrgDisplay(user.org_id);
      setData(display);
      // init member assignments
      setMemberAssignments(
        Object.fromEntries(display.users.map(u => [u.email, u.group_id]))
      );
      // init vm assignments
      const vmMap = {};
      await Promise.all(
        display.vms.map(async vm => {
          const grps = await api.getVmGroups(vm.vm_id);
          vmMap[vm.vm_id] = grps.map(g => g.group_id);
        })
      );
      setVmAssignments(vmMap);
      setError('');
    } catch (e) {
      setError(e.message.includes('404') ? 'Organization not found' : e.message);
    } finally {
      setLoading(false);
    }
  }, [user.org_id, fetchOrgName]);

  useEffect(() => {
    if (user.org_id && user.org_id !== 1000001) {
      fetchOrg();
    }
  }, [user.org_id, fetchOrg]);

  // Create or leave organization
  const createOrLeave = async action => {
    setLoading(true);
    try {
      if (action === 'create') {
        if (!inputs.org.trim()) throw new Error('Enter organization name');
        const { admin_user, org_name } = await api.createOrganization(inputs.org.trim(), user.email);
        setUser(admin_user);
        setOrgName(org_name);
      } else {
        await api.leaveOrganization(user.org_id, user.email);
        setUser(u => ({ ...u, org_id: 1000001, u_role: 'maintainer' }));
        setData({ users: [], groups: [], vms: [] });
        setOrgName('');
      }
      setInputs({ org: '', group: '', inviteEmail: '' });
      await fetchOrg();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Create group
  const createGroup = async () => {
    try {
      if (!inputs.group.trim()) throw new Error('Enter a group name');
      await api.createGroup(user.org_id, inputs.group.trim(), user.email);
      setInputs(prev => ({ ...prev, group: '' }));
      await fetchOrg();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  // Invite member
  const inviteMember = async () => {
    try {
      if (!inputs.inviteEmail.trim() || inviteGroupIdx == null) {
        throw new Error('Enter email and select a group');
      }
      const role = inviteRoleIdx.row === 0 ? 'admin' : 'maintainer';
      const groupId = data.groups[inviteGroupIdx.row].group_id;
      await api.addUserToOrg(user.org_id, inputs.inviteEmail.trim(), user.email, role, groupId);
      setInputs(prev => ({ ...prev, inviteEmail: '' }));
      Alert.alert('Invited', `${inputs.inviteEmail} added as ${role}`);
      fetchOrg();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  // Assign member to group
  const assignMember = async (email, role, idx) => {
    try {
      const groupId = data.groups[idx.row].group_id;
      await api.addUserToOrg(user.org_id, email, user.email, role, groupId);
      setMemberAssignments(prev => ({ ...prev, [email]: groupId }));
      Alert.alert('Success', `${email} → ${data.groups[idx.row].group_name}`);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  // Assign VM to groups
  const assignVm = async (vmId, selectedIdx) => {
    const newGroups = selectedIdx.map(i => data.groups[i.row].group_id);
    const prev = vmAssignments[vmId] || [];
    await Promise.all([
      ...newGroups.filter(id => !prev.includes(id)).map(id => api.addVmToGroup(vmId, id)),
      ...prev.filter(id => !newGroups.includes(id)).map(id => api.removeVmFromGroup(vmId, id)),
    ]);
    setVmAssignments(prevState => ({ ...prevState, [vmId]: newGroups }));
    Alert.alert('VM updated');
  };

  if (loading) return <Layout style={styles.loader}><ActivityIndicator /></Layout>;

  // No org or error state
  if (error || user.org_id === 1000001) {
    return (
      <Layout style={styles.container}>
        {error && <Text status='danger'>{error}</Text>}
        <Input
          placeholder='Organization Name'
          value={inputs.org}
          onChangeText={text => setInputs(prev => ({ ...prev, org: text }))}
          style={[styles.input, { width: inputWidth }]}
        />
        <Button onPress={() => createOrLeave('create')} style={styles.button}>
          Create Organization
        </Button>
        <Button appearance='ghost' onPress={() => navigation.goBack()} style={styles.button}>
          Cancel
        </Button>
      </Layout>
    );
  }

  const groupNames = data.groups.map(g => g.group_name);

  return (
    <Layout style={styles.container}>
      <Text category='h4'>{orgName} #{user.org_id}</Text>
      <ScrollView contentContainerStyle={styles.section}>
        {user.u_role === 'admin' && (
          <>
            <Text category='s2' style={{ marginTop: 10 }}>Invite Member</Text>
            <Input
              placeholder='User Email'
              value={inputs.inviteEmail}
              onChangeText={text => setInputs(prev => ({ ...prev, inviteEmail: text }))}
              style={[styles.input, { width: inputWidth }]}
            />
            <Select
              placeholder='Select Group'
              selectedIndex={inviteGroupIdx}
              value={inviteGroupIdx != null ? groupNames[inviteGroupIdx.row] : 'Select Group'}
              onSelect={setInviteGroupIdx}
              style={{ width: sectionWidth, marginVertical: 10 }}
            >
              {groupNames.map((n, i) => <SelectItem key={i} title={n} />)}
            </Select>
            <Select
              placeholder='Select Role'
              selectedIndex={inviteRoleIdx}
              value={inviteRoleIdx.row === 0 ? 'admin' : 'maintainer'}
              onSelect={setInviteRoleIdx}
              style={{ width: sectionWidth, marginVertical: 10 }}
            >
              <SelectItem title='admin' />
              <SelectItem title='maintainer' />
            </Select>
            <Button onPress={inviteMember} style={styles.button}>
              Add Member
            </Button>
          </>
        )}

        <Text category='s2' style={{ marginTop: 20 }}>Members</Text>
        {data.users.map(u => {
          const selIdx = data.groups.findIndex(g => g.group_id === memberAssignments[u.email]);
          const idxPath = selIdx !== -1 ? new IndexPath(selIdx) : null;
          return (
            <Layout key={u.u_id} style={styles.row}>
              <Text style={styles.text}>{u.u_name}</Text>
              <Select
                disabled={user.u_role !== 'admin'}
                selectedIndex={idxPath}
                value={idxPath ? groupNames[idxPath.row] : 'Select Group'}
                onSelect={i => assignMember(u.email, u.u_role, i)}
                style={{ width: sectionWidth / 3 }}
              >
                {groupNames.map((n, i) => <SelectItem key={i} title={n} />)}
              </Select>
            </Layout>
          );
        })}

        <Text category='s2' style={{ marginTop: 20 }}>Vending Machines</Text>
        {data.vms.map(vm => {
          const selIdx = (vmAssignments[vm.vm_id] || []).map(id => new IndexPath(data.groups.findIndex(g => g.group_id === id)));
          const value = (vmAssignments[vm.vm_id] || []).map(id => data.groups.find(g => g.group_id === id).group_name).join(', ');
          return (
            <Layout key={vm.vm_id} style={styles.row}>
              <Text style={styles.text}>{vm.vm_name}</Text>
              <Select
                multiSelect
                disabled={user.u_role !== 'admin'}
                selectedIndex={selIdx}
                value={value}
                onSelect={i => assignVm(vm.vm_id, i)}
                style={{ width: sectionWidth }}
              >
                {groupNames.map((n, i) => <SelectItem key={i} title={n} />)}
              </Select>
            </Layout>
          );
        })}

        {/* Create New Group: only admins */}
        {user.u_role === 'admin' && (
          <>
            <Text category='s2' style={{ marginTop: 20 }}>Create New Group</Text>
            <Input
              placeholder='Group Name'
              value={inputs.group}
              onChangeText={text => setInputs(prev => ({ ...prev, group: text }))}
              style={[styles.input, { width: inputWidth }]}
            />
            <Button onPress={createGroup} style={styles.button}>
              Create Group
            </Button>
          </>
        )}

        <Button status='danger' onPress={() => createOrLeave('leave')} style={styles.button}>
          Leave Organization
        </Button>
      </ScrollView>
      <Button appearance='ghost' onPress={() => navigation.goBack()} style={styles.button}>
        Back
      </Button>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, alignItems: 'center' },
  loader:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section:   { alignItems: 'center', width: '100%', paddingBottom: 20 },
  row:       { flexDirection: 'row', alignItems: 'center', marginVertical: 5 },
  text:      { flex: 1 },
  input:     { marginVertical: 10 },
  button:    { marginVertical: 5 },
});
