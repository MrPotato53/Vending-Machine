import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { Layout, Select, SelectItem, IndexPath, Button, Text, Input } from '@ui-kitten/components';
import api from './apiCommunicator';

const { width } = Dimensions.get('window');
const sectionWidth = width * 0.5;
const inputWidth   = width * 0.2;

export default function OrganizationScreen({ route, navigation }) {
  const [user, setUser]               = useState(route.params.user);
  const [data, setData]               = useState({ users: [], groups: [], vms: [] });
  const [orgName, setOrgName]         = useState('');
  const [orgInput, setOrgInput]       = useState('');
  const [mode, setMode]               = useState('i'); // 'i'=join, 'c'=create
  const [groupName, setGroupName]     = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteGroup, setInviteGroup] = useState(null);
  const [memberAssignments, setMemberAssignments] = useState({});
  const [vmAssignments, setVmAssignments]         = useState({});
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    if (user.org_id && user.org_id !== 1000001) {
      loadOrgName();
      loadDisplay();
    }
  }, [user.org_id]);

  const loadOrgName = async () => {
    try {
      const orgArr = await api.getOrganization(user.org_id);
      if (Array.isArray(orgArr) && orgArr.length) {
        setOrgName(orgArr[0].org_name);
      }
    } catch {}
  };

  const loadDisplay = async () => {
    setLoading(true);
    setError('');
    try {
      const disp = await api.getOrgDisplay(user.org_id);
      setData(disp);

      // initialize member assignments
      const memInit = {};
      disp.users.forEach(u => { memInit[u.email] = u.group_id; });
      setMemberAssignments(memInit);

      // initialize VM ↔ groups assignments
      const vmInit = {};
      await Promise.all(
        disp.vms.map(async vm => {
          const grpList = await api.getVmGroups(vm.vm_id);
          vmInit[vm.vm_id] = grpList.map(g => g.group_id);
        })
      );
      setVmAssignments(vmInit);

    } catch (e) {
      setError(e.message.includes('404') ? 'Organization not found' : e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignMember = async (email, idx) => {
    const grp = data.groups[idx.row];
    if (!grp) return;
    try {
      await api.assignUserToGroup(email, grp.group_id, user.email);
      setMemberAssignments(prev => ({ ...prev, [email]: grp.group_id }));
      Alert.alert('Success', `${email} → ${grp.group_name}`);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || inviteGroup == null) {
      return Alert.alert('Error', 'Enter email and select a group');
    }
    try {
      // invite flow: add to org, then group
      await api.addUserToOrg(user.org_id, inviteEmail.trim());
      await api.assignUserToGroup(
        inviteEmail.trim(),
        data.groups[inviteGroup.row].group_id,
        user.email
      );
      setInviteEmail('');
      setInviteGroup(null);
      loadDisplay();
      Alert.alert('Invited', `${inviteEmail} added to org & group`);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const handleAssignVm = async (vmId, idxes) => {
    const selected = idxes.map(i => data.groups[i.row].group_id);
    const prev     = vmAssignments[vmId] || [];
    // add new
    for (let id of selected.filter(x => !prev.includes(x))) {
      try { await api.addVmToGroup(vmId, id); } catch {}
    }
    // remove old
    for (let id of prev.filter(x => !selected.includes(x))) {
      try { await api.removeVmFromGroup(vmId, id); } catch {}
    }
    setVmAssignments(prev => ({ ...prev, [vmId]: selected }));
    Alert.alert('VM updated');
  };

  const handleCreateOrJoin = async () => {
    if (!orgInput.trim()) { setError('Enter org name'); return; }
    setError('');
    try {
      if (mode === 'c') {
        const { admin_user, org_name: newName } =
          await api.createOrganization(orgInput, user.email);
        setUser(admin_user);
        setOrgName(newName);
      } else {
        const { org_id } = await api.getOrgByName(orgInput);
        await api.updateUser(user.email, { org_id });
        setUser(u => ({ ...u, org_id }));
      }
      setOrgInput('');
      setMode('i');
    } catch (e) {
      setError(e.message);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return Alert.alert('Error', 'Enter a group name');
    try {
      await api.createGroup(user.org_id, groupName, user.email);
      setGroupName('');
      loadDisplay();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const handleLeaveOrg = async () => {
    try {
      await api.leaveOrganization(user.org_id, user.email);
      setUser(u => ({ ...u, org_id: 1000001, u_role: 'maintainer' }));
      setData({ users: [], groups: [], vms: [] });
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  if (loading) {
    return <Layout style={styles.loader}><ActivityIndicator/></Layout>;
  }

  const invalidOrg = !user.org_id || user.org_id === 1000001 || error;
  if (invalidOrg) {
    return (
      <Layout style={styles.container}>
        {error
          ? <Text status='danger'>{error}</Text>
          : <Text>You are not in an organization.</Text>
        }

        {user.u_role === 'admin' && (
          <>
            <Layout style={styles.toggle}>
              <Button
                onPress={() => setMode('c')}
                appearance={mode === 'c' ? 'filled' : 'outline'}
              >
                Create
              </Button>
              <Button
                onPress={() => setMode('i')}
                appearance={mode === 'i' ? 'filled' : 'outline'}
              >
                Join
              </Button>
            </Layout>
            <Input
              placeholder='Organization Name'
              value={orgInput}
              onChangeText={setOrgInput}
              style={[styles.input, { width: inputWidth }]}
            />
            <Button onPress={handleCreateOrJoin} style={styles.button}>
              {mode === 'c' ? 'Create Org' : 'Join Org'}
            </Button>
          </>
        )}

        {user.u_role === 'maintainer' && (
          <>
            <Text>You can create a new organization:</Text>
            <Input
              placeholder='Organization Name'
              value={orgInput}
              onChangeText={setOrgInput}
              style={[styles.input, { width: inputWidth }]}
            />
            <Button onPress={handleCreateOrJoin} style={styles.button}>
              Create Org
            </Button>
          </>
        )}

        <Button
          appearance='ghost'
          onPress={() => navigation.goBack()}
          style={styles.button}
        >
          Cancel
        </Button>
      </Layout>
    );
  }

  const groupNames = data.groups.map(g => g.group_name);

  return (
    <Layout style={styles.container}>
      <Text category='h4'>
        {orgName ? `${orgName} ` : ''}#{user.org_id}
      </Text>

      <ScrollView contentContainerStyle={styles.section}>
        {user.u_role === 'admin' && (
          <>
            <Text category='s2' style={{ marginTop: 10 }}>
              Invite Member
            </Text>
            <Input
              placeholder='User Email'
              value={inviteEmail}
              onChangeText={setInviteEmail}
              style={[styles.input, { width: inputWidth }]}
            />
            <Select
              placeholder='Select Group'
              selectedIndex={inviteGroup}
              value={
                inviteGroup
                  ? data.groups[inviteGroup.row].group_name
                  : 'Select Group'
              }
              onSelect={i => setInviteGroup(i)}
              style={{ width: sectionWidth / 2, marginVertical: 10 }}
            >
              {data.groups.map((g, i) => (
                <SelectItem key={i} title={g.group_name} />
              ))}
            </Select>
            <Button onPress={handleInvite} style={styles.button}>
              Add Member
            </Button>
          </>
        )}

        <Text category='s2' style={{ marginTop: 20 }}>
          Members
        </Text>
        {data.users.map(u => {
          const gid = memberAssignments[u.email];
          const grp = data.groups.find(g => g.group_id === gid);
          const idx = grp ? groupNames.indexOf(grp.group_name) : -1;
          return (
            <Layout key={u.u_id} style={styles.row}>
              <Text style={styles.text}>{u.u_name}</Text>
              <Select
                disabled={user.u_role !== 'admin'}
                selectedIndex={idx >= 0 ? new IndexPath(idx) : null}
                value={grp ? grp.group_name : 'Select Group'}
                onSelect={i => handleAssignMember(u.email, i)}
                style={{ width: sectionWidth / 3 }}
              >
                {groupNames.map((n, i) => (
                  <SelectItem key={i} title={n} />
                ))}
              </Select>
            </Layout>
          );
        })}

        <Text category='s2' style={{ marginTop: 20 }}>
          Vending Machines
        </Text>
        {data.vms.map(vm => {
          const gids = vmAssignments[vm.vm_id] || [];
          const sel = gids
            .map(id => data.groups.find(g => g.group_id === id))
            .filter(g => g)
            .map(g =>
              new IndexPath(groupNames.indexOf(g.group_name))
            );
          return (
            <Layout key={vm.vm_id} style={styles.row}>
              <Text style={styles.text}>{vm.vm_name}</Text>
              <Select
                multiSelect
                disabled={user.u_role !== 'admin'}
                selectedIndex={sel}
                value={
                  gids
                    .map(id => {
                      const g = data.groups.find(
                        gr => gr.group_id === id
                      );
                      return g ? g.group_name : null;
                    })
                    .filter(x => x)
                    .join(', ')
                }
                onSelect={i => handleAssignVm(vm.vm_id, i)}
                style={{ width: sectionWidth }}
              >
                {groupNames.map((n, i) => (
                  <SelectItem key={i} title={n} />
                ))}
              </Select>
            </Layout>
          );
        })}

        <Text category='s2' style={{ marginTop: 20 }}>
          Create New Group
        </Text>
        <Input
          placeholder='Group Name'
          value={groupName}
          onChangeText={setGroupName}
          style={[styles.input, { width: inputWidth }]}
        />
        <Button onPress={handleCreateGroup} style={styles.button}>
          Create Group
        </Button>

        <Button
          status='danger'
          onPress={handleLeaveOrg}
          style={styles.button}
        >
          Leave Organization
        </Button>
      </ScrollView>

      <Button
        appearance='ghost'
        onPress={() => navigation.goBack()}
        style={styles.button}
      >
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
  toggle:    { flexDirection: 'row', marginVertical: 10 },
  input:     { marginVertical: 10 },
  button:    { marginVertical: 5 }
});
