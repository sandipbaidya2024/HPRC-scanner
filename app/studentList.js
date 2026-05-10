import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { deleteStudent, getStudents } from '../utils/database';
import { CLASS_OPTIONS } from '../utils/reportCard';

export default function StudentList() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const classes = ['All', ...CLASS_OPTIONS]; //

  const loadData = async () => {
    setLoading(true);
    const data = await getStudents(); //
    setStudents(data);
    applyFilters(data, searchQuery, selectedClass);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const applyFilters = (data, query, cls) => {
    let filtered = data;
    if (query) {
      filtered = filtered.filter(s => 
        s.name?.toLowerCase().includes(query.toLowerCase()) || 
        s.roll?.toString().includes(query)
      );
    }
    if (cls !== 'All') {
      filtered = filtered.filter(s => s.class === cls);
    }
    setFilteredStudents(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDelete = (id, name) => {
    Alert.alert("মুছে ফেলুন", `আপনি কি "${name}"-এর ডেটা মুছে ফেলতে চান?`, [
      { text: "না", style: "cancel" },
      { text: "হ্যাঁ, মুছে দিন", style: "destructive", onPress: async () => {
        await deleteStudent(id); //
        loadData();
      }}
    ]);
  };

  const renderStudent = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => router.push({ pathname: '/editData', params: { data: JSON.stringify([item]) } })}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.name?.charAt(0)}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.details}>Roll: {item.roll} | Class: {item.class} | Section: {item.section}</Text>
      </View>
      <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={styles.deleteIcon}>
        <Ionicons name="trash-outline" size={20} color="#ff5252" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a73e8', '#0d47a1']} style={styles.header}>
        <Text style={styles.title}>Student Directory</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput 
            placeholder="নাম বা রোল দিয়ে খুঁজুন..." 
            style={styles.input}
            value={searchQuery}
            onChangeText={(t) => { setSearchQuery(t); applyFilters(students, t, selectedClass); }}
          />
        </View>
      </LinearGradient>

      <View style={styles.filterContainer}>
        <FlatList 
          horizontal 
          data={classes} 
          keyExtractor={item => item}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity 
              onPress={() => { setSelectedClass(item); applyFilters(students, searchQuery, item); }}
              style={[styles.chip, selectedClass === item && styles.chipActive]}
            >
              <Text style={[styles.chipText, selectedClass === item && styles.chipTextActive]}>
                {item === 'All' ? 'সব ক্লাস' : `Class ${item}`}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1a73e8" style={{ marginTop: 50 }} />
      ) : (
        <FlatList 
          data={filteredStudents}
          keyExtractor={item => item.id.toString()}
          renderItem={renderStudent}
          contentContainerStyle={{ padding: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={styles.empty}>কোনো স্টুডেন্ট পাওয়া যায়নি</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 25, paddingTop: 50, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  title: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  searchBar: { flexDirection: 'row', backgroundColor: 'white', padding: 10, borderRadius: 15, alignItems: 'center' },
  input: { flex: 1, marginLeft: 10 },
  filterContainer: { paddingVertical: 15, paddingLeft: 20 },
  chip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e0e0e0', marginRight: 10 },
  chipActive: { backgroundColor: '#1a73e8' },
  chipText: { fontSize: 12, color: '#666' },
  chipTextActive: { color: 'white', fontWeight: 'bold' },
  card: { flexDirection: 'row', backgroundColor: 'white', padding: 15, borderRadius: 20, marginBottom: 12, alignItems: 'center', elevation: 2 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#e3f2fd', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#1a73e8' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  details: { fontSize: 12, color: '#777', marginTop: 4 },
  deleteIcon: { padding: 5 },
  empty: { textAlign: 'center', marginTop: 50, color: '#999' }
});