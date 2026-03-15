import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useAppContext } from "@/context/AppContext";

export function ProfileButton() {
  const { user } = useAppContext();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <Pressable style={styles.avatarBtn} onPress={() => setMenuOpen(true)}>
        {user ? (
          <Text style={styles.avatarText}>
            {(user.username || "U")[0].toUpperCase()}
          </Text>
        ) : (
          <Feather name="user" size={16} color={Colors.textSecondary} />
        )}
      </Pressable>
      <ProfileDrawer visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

function ProfileDrawer({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { user, logout, savedStrategies, openTrades } = useAppContext();
  const [editMode, setEditMode] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || user?.username || "");

  const handleLogout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          onClose();
        },
      },
    ]);
  };

  const openCount = openTrades.filter((t) => t.status === "open").length;
  const closedCount = openTrades.filter((t) => t.status === "closed").length;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onClose}>
        <View />
      </Pressable>
      <View style={styles.drawer}>
        <View style={styles.drawerHandle} />

        <View style={styles.profileSection}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {user ? (user.username || "U")[0].toUpperCase() : "G"}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            {editMode ? (
              <TextInput
                style={styles.editInput}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Display name"
                placeholderTextColor={Colors.textMuted}
                autoFocus
                onBlur={() => setEditMode(false)}
              />
            ) : (
              <Pressable onPress={() => user && setEditMode(true)}>
                <Text style={styles.profileName}>
                  {user ? (user.displayName || user.username) : "Guest"}
                </Text>
              </Pressable>
            )}
            <Text style={styles.profileHandle}>
              {user ? `@${user.username}` : "Not signed in"}
            </Text>
          </View>
          {user && (
            <Pressable style={styles.editBtn} onPress={() => setEditMode(!editMode)}>
              <Feather name="edit-2" size={14} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{savedStrategies.length}</Text>
            <Text style={styles.statLabel}>Strategies</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{openCount}</Text>
            <Text style={styles.statLabel}>Open</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{closedCount}</Text>
            <Text style={styles.statLabel}>Closed</Text>
          </View>
        </View>

        <View style={styles.menuSection}>
          <MenuItem icon="settings" label="Preferences" onPress={() => {}} />
          <MenuItem icon="bell" label="Notifications" onPress={() => {}} />
          <MenuItem icon="help-circle" label="Help & Support" onPress={() => {}} />
          <MenuItem icon="info" label="About OptionViz" onPress={() => {}} />
        </View>

        {user && (
          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <Feather name="log-out" size={16} color={Colors.red} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </Pressable>
        )}

        <Pressable style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>Close</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

function MenuItem({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <Feather name={icon as any} size={18} color={Colors.textSecondary} />
      <Text style={styles.menuItemText}>{label}</Text>
      <Feather name="chevron-right" size={16} color={Colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  avatarBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.glassElevated,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: Colors.accent,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  drawer: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderBottomWidth: 0,
  },
  drawerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textMuted,
    alignSelf: "center",
    marginBottom: 20,
    opacity: 0.4,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.accentDim,
    borderWidth: 1,
    borderColor: Colors.accent + "30",
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarText: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.accent,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
  },
  profileHandle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    marginTop: 2,
  },
  editBtn: {
    padding: 8,
  },
  editInput: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.accent,
    paddingBottom: 4,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: Colors.glassElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: 16,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.glassBorder,
  },
  menuSection: {
    gap: 2,
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  menuItemText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: Colors.textPrimary,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.redDim,
    borderWidth: 1,
    borderColor: Colors.red + "20",
    marginBottom: 12,
  },
  logoutText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.red,
  },
  closeBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: Colors.glassElevated,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  closeBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
});
