import React, { useState, useEffect } from 'react';
import { StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { 
  Layout,
  Select,
  SelectItem,
  IndexPath,
  Button,
  Text,
  Input,
  Card,
  Divider
} from '@ui-kitten/components';
import api from './apiCommunicator';

export default function UserManagementScreen({ route, navigation }) {
  const { user, orgId, onUsersUpdated } = route.params;

  const [loading, setLoading]       = useState(true);
  const [error,   setError]         = useState('');
  const [users,   setUsers]         = useState([]);
  const [groups,  setGroups]        = useState([]);

  // Invite form state
  const [inviteEmail,    setInviteEmail]    = useState('');
  const [inviteGroupIdx, setInviteGroupIdx] = useState(null);
  const [inviteRoleIdx,  setInviteRoleIdx]  = useState(new IndexPath(1));

  const groupNames = groups.map(g => g.group_name);
  const isAdmin    = user.u_role === 'admin';

  // Fetch users + groups via /orgs/:id/display
  const loadDisplay = async () => {
    try {
      setLoading(true);
      const { users: u, groups: g } = await api.getOrgDisplay(orgId);
      setUsers(u);
      setGroups(g);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // On mount, redirect non-admins or load data
  useEffect(() => {
    if (!isAdmin) {
      Alert.alert(
        'Access Denied',
        'Only administrators can manage users.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
        { cancelable: false }
      );
    } else {
      loadDisplay();
    }
  }, [isAdmin, orgId]);

  // Invite new member
  const inviteMember = async () => {
    if (!inviteEmail.trim()) {
      setError('Please enter a valid email address');
      return;
    }
    if (inviteGroupIdx === null) {
      setError('Please select a group for the new member');
      return;
    }

    setError('');
    try {
      const role    = inviteRoleIdx.row === 0 ? 'admin' : 'maintainer';
      const groupId = groups[inviteGroupIdx.row].group_id;

      await api.addUserToOrg(orgId, inviteEmail.trim(), user.email, role, groupId);
      await loadDisplay();
      onUsersUpdated?.();
      Alert.alert('Success', `${inviteEmail.trim()} added as ${role}`);

      // Reset form
      setInviteEmail('');
      setInviteGroupIdx(null);
      setInviteRoleIdx(new IndexPath(1));
    } catch (e) {
      setError(e.message);
    }
  };

// Assign member to group
const assignMember = async (email, role, userIdx, groupIdx) => {
  // Check if groupIdx is valid
  if (!groupIdx || typeof groupIdx.row !== 'number') {
    setError('Invalid group selection');
    return;
  }
  
  setLoading(true);
  try {
    const groupId = groups[groupIdx.row].group_id;
    await api.addUserToOrg(orgId, email, user.email, role, groupId);
    
    // Update local state with proper structure
    const updatedUsers = [...users];
    if (updatedUsers[userIdx]) {
      updatedUsers[userIdx] = {
        ...updatedUsers[userIdx],
        group_id: groupId
      };
      setUsers(updatedUsers);
    }
    
    Alert.alert('Success', `${email} assigned to ${groups[groupIdx.row].group_name}`);
    
    // Callback to refresh parent
    if (onUsersUpdated) onUsersUpdated();
  } catch (e) {
    setError(e.message);
  } finally {
    setLoading(false);
  }
};

  // Render
  if (!isAdmin) {
    return (
      <Layout style={styles.container}>
        <Text status="danger">Access Denied. Redirecting…</Text>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout style={styles.container}>
        <ActivityIndicator size="large" />
      </Layout>
    );
  }

  return (
    <Layout style={styles.container}>
      <Text category="h4">Manage Organization Users</Text>
      {error ? <Text status="danger" style={styles.error}>{error}</Text> : null}

      {/* Invite New Member Section */}
      <Card style={styles.card}>
        <Text category="h6" style={styles.cardHeader}>Invite New Member</Text>
        <Input
          placeholder="User Email"
          value={inviteEmail}
          onChangeText={setInviteEmail}
          style={styles.input}
        />
        <Select
          label="Group"
          selectedIndex={idxPath}
          value={idxPath !== null ? groupNames[idxPath.row] : 'No Group'}
          onSelect={(index) => {
            // Make sure index is a valid IndexPath object
            if (index && typeof index.row === 'number') {
              assignMember(u.email, u.u_role, userIdx, index);
            } else {
              setError('Invalid group selection');
            }
          }}
          style={styles.groupSelect}
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
                    selectedIndex={idxPath}
                    value={idxPath !== null ? groupNames[idxPath.row] : 'No Group'}
                    onSelect={idx => assignMember(u.email, u.u_role, idx)}
                    style={styles.groupSelect}
                  >
                    {groupNames.map((name, i) => (
                      <SelectItem key={i} title={name} />
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
  },
});
