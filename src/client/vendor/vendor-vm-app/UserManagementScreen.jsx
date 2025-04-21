import React, { useState } from 'react';
import { StyleSheet, Alert, ScrollView } from 'react-native';
import { Layout, Select, SelectItem, IndexPath, Button, Text, Input, List, ListItem, Card, Divider } from '@ui-kitten/components';
import api from './apiCommunicator';

export default function UserManagementScreen({ route, navigation }) {
  const { user, orgId, groups, users: initialUsers, onUsersUpdated } = route.params;
  const [users, setUsers] = useState(initialUsers);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteGroupIdx, setInviteGroupIdx] = useState(null);
  const [inviteRoleIdx, setInviteRoleIdx] = useState(new IndexPath(1)); // Default: maintainer
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const groupNames = groups.map(g => g.group_name);

  // Invite member
  const inviteMember = async () => {
    if (!inviteEmail.trim()) {
      setError('Please enter a valid email address');
      return;
    }
    
    if (inviteGroupIdx === null) {
      setError('Please select a group for the new member');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const role = inviteRoleIdx.row === 0 ? 'admin' : 'maintainer';
      const groupId = groups[inviteGroupIdx.row].group_id;
      
      await api.addUserToOrg(orgId, inviteEmail.trim(), user.email, role, groupId);
      
      // Update local state
      const newUser = {
        email: inviteEmail.trim(),
        u_name: inviteEmail.trim().split('@')[0], // Simple placeholder
        u_role: role,
        group_id: groupId
      };
      
      setUsers(prev => [...prev, newUser]);
      setInviteEmail('');
      setInviteGroupIdx(null);
      
      Alert.alert('Success', `${inviteEmail} added as ${role}`);
      
      // Callback to refresh parent
      if (onUsersUpdated) onUsersUpdated();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Assign member to group
  const assignMember = async (email, role, userIdx, groupIdx) => {
    setLoading(true);
    try {
      const groupId = groups[groupIdx.row].group_id;
      await api.addUserToOrg(orgId, email, user.email, role, groupId);
      
      // Update local state
      const updatedUsers = [...users];
      updatedUsers[userIdx].group_id = groupId;
      setUsers(updatedUsers);
      
      Alert.alert('Success', `${email} assigned to ${groups[groupIdx.row].group_name}`);
      
      // Callback to refresh parent
      if (onUsersUpdated) onUsersUpdated();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={styles.container}>
      <Text category="h4">Manage Organization Users</Text>
      
      {error ? <Text status="danger" style={styles.error}>{error}</Text> : null}
      
      {/* Add New User Section */}
      <Card style={styles.card}>
        <Text category="h6" style={styles.cardHeader}>Invite New Member</Text>
        <Input
          placeholder="User Email"
          value={inviteEmail}
          onChangeText={setInviteEmail}
          style={styles.input}
        />
        <Select
          placeholder="Select Group"
          selectedIndex={inviteGroupIdx}
          value={inviteGroupIdx !== null ? groupNames[inviteGroupIdx.row] : 'Select Group'}
          onSelect={setInviteGroupIdx}
          style={styles.input}
        >
          {groupNames.map((name, index) => (
            <SelectItem key={index} title={name} />
          ))}
        </Select>
        <Select
          placeholder="Select Role"
          selectedIndex={inviteRoleIdx}
          value={inviteRoleIdx.row === 0 ? 'admin' : 'maintainer'}
          onSelect={setInviteRoleIdx}
          style={styles.input}
        >
          <SelectItem title="admin" />
          <SelectItem title="maintainer" />
        </Select>
        <Button 
          onPress={inviteMember} 
          disabled={loading || !inviteEmail.trim() || inviteGroupIdx === null}
          style={styles.button}
        >
          Add Member
        </Button>
      </Card>
      
      {/* Existing Users Section */}
      <Card style={styles.card}>
        <Text category="h6" style={styles.cardHeader}>Organization Members</Text>
        <ScrollView style={styles.scrollView}>
          {users.map((u, userIdx) => {
            const currentGroupIdx = groups.findIndex(g => g.group_id === u.group_id);
            const idxPath = currentGroupIdx !== -1 ? new IndexPath(currentGroupIdx) : null;
            
            return (
              <React.Fragment key={userIdx}>
                <Layout style={styles.userRow}>
                  <Layout style={styles.userInfo}>
                    <Text category="s1">{u.u_name || u.email}</Text>
                    <Text appearance="hint">Role: {u.u_role}</Text>
                  </Layout>
                  <Select
                    disabled={user.u_role !== 'admin'}
                    label="Group"
                    selectedIndex={idxPath}
                    value={idxPath !== null ? groupNames[idxPath.row] : 'No Group'}
                    onSelect={idx => assignMember(u.email, u.u_role, userIdx, idx)}
                    style={styles.groupSelect}
                  >
                    {groupNames.map((name, index) => (
                      <SelectItem key={index} title={name} />
                    ))}
                  </Select>
                </Layout>
                {userIdx < users.length - 1 && <Divider />}
              </React.Fragment>
            );
          })}
        </ScrollView>
      </Card>
      
      <Button appearance="ghost" onPress={() => navigation.goBack()} style={styles.button}>
        Back
      </Button>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  card: {
    marginVertical: 10,
    width: '100%',
  },
  cardHeader: {
    marginBottom: 10,
  },
  input: {
    marginVertical: 8,
  },
  button: {
    marginVertical: 8,
  },
  error: {
    marginVertical: 10,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  userInfo: {
    flex: 1,
  },
  groupSelect: {
    width: '40%',
  },
  scrollView: {
    maxHeight: 300,
  }
});