import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { registerRootComponent } from 'expo';
import { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import 'react-native-gesture-handler';
import 'react-native-get-random-values';

// AWS Imports
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import awsconfig from './src/aws-exports';
import { createPracticeLog } from './src/graphql/mutations';
import { listPracticeLogs } from './src/graphql/queries';

Amplify.configure(awsconfig);
const client = generateClient();
const Stack = createStackNavigator();

// --- 1. HOME SCREEN ---
const HomeScreen = ({ navigation }) => (
  <View style={styles.container}>
    <Text style={styles.title}>Cricket Logger</Text>
    <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('CategorySelect')}>
      <Text style={styles.btnText}>Log New Practice</Text>
    </TouchableOpacity>
    
    {/* THIS IS THE BUTTON YOU ARE LOOKING FOR */}
    <TouchableOpacity style={styles.btnHistory} onPress={() => navigation.navigate('History')}>
      <Text style={styles.btnText}>View History</Text>
    </TouchableOpacity>
  </View>
);

// --- 2. CATEGORY SELECTION ---
const CategorySelect = ({ navigation }) => (
  <View style={styles.container}>
    <Text style={styles.title}>What did you work on?</Text>
    {['Batting', 'Bowling', 'Fielding', 'Fitness'].map((cat) => (
      <TouchableOpacity key={cat} style={styles.btn} onPress={() => navigation.navigate('LogForm', { category: cat })}>
        <Text style={styles.btnText}>{cat}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

// --- 3. LOG FORM ---
const LogForm = ({ route, navigation }) => {
  const { category } = route.params;
  const [mins, setMins] = useState('');
  const [sub, setSub] = useState('');

  const handleSave = async () => {
    try {
      await client.graphql({
        query: createPracticeLog,
        variables: {
          input: {
            date: new Date().toLocaleDateString(),
            category: category,
            subCategory: sub,
            duration: parseInt(mins) || 0
          }
        }
      });
      Alert.alert("Success", "Saved to Cloud!");
      navigation.popToTop();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not save. Check terminal.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log {category}</Text>
      <TextInput placeholder="Activity (e.g. Nets)" style={styles.input} onChangeText={setSub} />
      <TextInput placeholder="Minutes" style={styles.input} keyboardType="numeric" onChangeText={setMins} />
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.btnText}>Save to Cloud</Text>
      </TouchableOpacity>
    </View>
  );
};

// --- 4. HISTORY SCREEN ---
const HistoryScreen = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const result = await client.graphql({ query: listPracticeLogs });
      // Sort logs so newest is at the top
      const sortedLogs = result.data.listPracticeLogs.items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setLogs(sortedLogs);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your History</Text>
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.logCard}>
            <Text style={styles.cardDate}>{item.date}</Text>
            <Text style={styles.cardTitle}>{item.category}</Text>
            <Text style={styles.cardSub}>{item.subCategory}</Text>
            <Text style={styles.cardMins}>{item.duration} mins</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={{textAlign: 'center'}}>No logs found yet!</Text>}
      />
    </View>
  );
};

// --- MAIN NAVIGATOR ---
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#3498db' }, headerTintColor: '#fff' }}>
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'My Cricket App' }} />
        <Stack.Screen name="CategorySelect" component={CategorySelect} options={{ title: 'Select Activity' }} />
        <Stack.Screen name="LogForm" component={LogForm} options={{ title: 'Enter Details' }} />
        <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'Past Sessions' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f0f3f5' },
  title: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginVertical: 20, color: '#2c3e50' },
  btn: { backgroundColor: '#3498db', padding: 18, borderRadius: 12, marginVertical: 8, elevation: 2 },
  btnHistory: { backgroundColor: '#2ecc71', padding: 18, borderRadius: 12, marginVertical: 8, elevation: 2 },
  btnText: { color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 16 },
  input: { backgroundColor: 'white', padding: 15, borderRadius: 8, marginVertical: 10, borderWidth: 1, borderColor: '#dcdde1' },
  saveBtn: { backgroundColor: '#27ae60', padding: 20, borderRadius: 12, marginTop: 20 },
  logCard: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 12, borderLeftWidth: 6, borderLeftColor: '#3498db', elevation: 3 },
  cardDate: { fontSize: 12, color: '#7f8c8d', marginBottom: 4 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
  cardSub: { fontSize: 14, color: '#34495e' },
  cardMins: { fontSize: 14, fontWeight: 'bold', color: '#27ae60', marginTop: 5 }
});

registerRootComponent(App);