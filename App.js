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

// --- 0. AUTH SCREENS ---
const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // TODO: Integrate AWS Amplify Auth.signIn here
    if (username && password) {
      navigation.replace('Home');
    } else {
      Alert.alert('Error', 'Please enter username and password');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sports Logger Login</Text>
      <TextInput placeholder="Username" style={styles.input} value={username} onChangeText={setUsername} autoCapitalize="none" />
      <TextInput placeholder="Password" style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={styles.btn} onPress={handleLogin}>
        <Text style={styles.btnText}>Log In</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.navigate('SignUp')}>
        <Text style={styles.btnText}>New User? Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
};

const SignUpScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');

  const handleSignUp = () => {
    // TODO: Integrate AWS Amplify Auth.signUp here
    Alert.alert('Success', 'Account created! Please log in.');
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <TextInput placeholder="Username" style={styles.input} value={username} onChangeText={setUsername} autoCapitalize="none" />
      <TextInput placeholder="Email" style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput placeholder="Password" style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={styles.btn} onPress={handleSignUp}>
        <Text style={styles.btnText}>Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
};

// --- 1. HOME SCREEN ---
const HomeScreen = ({ navigation }) => (
  <View style={styles.container}>
    <Text style={styles.title}>Cricket Logger</Text>
    <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('CategorySelect')}>
    <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('CalendarScreen')}>
      <Text style={styles.btnText}>Log New Practice</Text>
    </TouchableOpacity>
    
    {/* THIS IS THE BUTTON YOU ARE LOOKING FOR */}
    <TouchableOpacity style={styles.btnHistory} onPress={() => navigation.navigate('History')}>
      <Text style={styles.btnText}>View History</Text>
    </TouchableOpacity>
  </View>
);

// --- 1.5 CALENDAR SCREEN ---
const CalendarScreen = ({ navigation }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const days = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const changeMonth = (offset) => {
    const newDate = new Date(currentDate.setMonth(currentDate.getMonth() + offset));
    setCurrentDate(new Date(newDate));
  };

  const handleDateSelect = (day) => {
    const selectedDate = new Date(year, month, day).toLocaleDateString();
    navigation.navigate('CategorySelect', { date: selectedDate });
  };

  const renderDays = () => {
    const daysArray = [];
    for (let i = 0; i < firstDay; i++) daysArray.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    for (let i = 1; i <= days; i++) {
      daysArray.push(
        <TouchableOpacity key={i} style={styles.calendarDay} onPress={() => handleDateSelect(i)}>
          <Text style={styles.calendarDayText}>{i}</Text>
        </TouchableOpacity>
      );
    }
    return daysArray;
  };

  return (
    <View style={styles.container}>
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={() => changeMonth(-1)}><Text style={styles.navText}>{"<"}</Text></TouchableOpacity>
        <Text style={styles.title}>{monthNames[month]} {year}</Text>
        <TouchableOpacity onPress={() => changeMonth(1)}><Text style={styles.navText}>{">"}</Text></TouchableOpacity>
      </View>
      <View style={styles.calendarGrid}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <Text key={d} style={styles.dayLabel}>{d}</Text>)}
        {renderDays()}
      </View>
    </View>
  );
};

// --- 1.6 BATTING SUB SELECT ---
const BattingSubSelect = ({ route, navigation }) => {
  const { date } = route.params;
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Batting Drill</Text>
      {['Nets', 'Shadow Practice', 'Hanging Ball'].map((opt) => (
        <TouchableOpacity key={opt} style={styles.btn} onPress={() => navigation.navigate('BattingLogForm', { category: 'Batting', subCategory: opt, date })}>
          <Text style={styles.btnText}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// --- 1.7 BATTING LOG FORM ---
const BattingLogForm = ({ route, navigation }) => {
  const { category, subCategory, date } = route.params;
  const [whereVal, setWhereVal] = useState('');
  const [whenVal, setWhenVal] = useState('');

  const handleSave = async () => {
    try {
      await client.graphql({
        query: createPracticeLog,
        variables: {
          input: {
            date: date,
            category: category,
            subCategory: `${subCategory} - Where: ${whereVal}, When: ${whenVal}`,
            duration: 0
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
      <Text style={styles.title}>{subCategory}</Text>
      <Text style={styles.label}>Where?</Text>
      <TextInput placeholder="Enter location" style={styles.input} onChangeText={setWhereVal} />
      <Text style={styles.label}>When?</Text>
      <TextInput placeholder="Enter time" style={styles.input} onChangeText={setWhenVal} />
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.btnText}>Save to Cloud</Text>
      </TouchableOpacity>
    </View>
  );
};

// --- 2. CATEGORY SELECTION ---
const CategorySelect = ({ navigation }) => (
const CategorySelect = ({ route, navigation }) => (
  <View style={styles.container}>
    <Text style={styles.title}>What did you work on?</Text>
    {['Batting', 'Bowling', 'Fielding', 'Fitness'].map((cat) => (
      <TouchableOpacity key={cat} style={styles.btn} onPress={() => navigation.navigate('LogForm', { category: cat })}>
      <TouchableOpacity 
        key={cat} 
        style={styles.btn} 
        onPress={() => {
          if (cat === 'Batting') {
            navigation.navigate('BattingSubSelect', { date: route.params.date });
          } else {
            navigation.navigate('LogForm', { category: cat, date: route.params.date });
          }
        }}
      >
        <Text style={styles.btnText}>{cat}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

// --- 3. LOG FORM ---
const LogForm = ({ route, navigation }) => {
  const { category } = route.params;
  const { category, date } = route.params;
  const [mins, setMins] = useState('');
  const [sub, setSub] = useState('');

  const handleSave = async () => {
    try {
      await client.graphql({
        query: createPracticeLog,
        variables: {
          input: {
            date: new Date().toLocaleDateString(),
            date: date,
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
            <Text style={styles.logDate}>{item.date}</Text>
            <Text>{item.category} - {item.subCategory}</Text>
            <Text>{item.duration} mins</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={{textAlign: 'center'}}>No logs found yet!</Text>}
      />
    </View>
  );
};

// --- MAIN NAVIGATOR ---
// --- NAVIGATION WRAPPER ---
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerStyle: { backgroundColor: '#3498db' }, headerTintColor: '#fff' }}>
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: 'Sign Up' }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'My Cricket App' }} />
        <Stack.Screen name="CategorySelect" component={CategorySelect} options={{ title: 'Select Activity' }} />
        <Stack.Screen name="LogForm" component={LogForm} options={{ title: 'Enter Details' }} />
        <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'Past Sessions' }} />
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="CalendarScreen" component={CalendarScreen} />
        <Stack.Screen name="CategorySelect" component={CategorySelect} />
        <Stack.Screen name="BattingSubSelect" component={BattingSubSelect} options={{ title: 'Select Drill' }} />
        <Stack.Screen name="BattingLogForm" component={BattingLogForm} options={{ title: 'Log Batting' }} />
        <Stack.Screen name="LogForm" component={LogForm} />
        <Stack.Screen name="History" component={HistoryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f0f3f5' },
  title: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginVertical: 20, color: '#2c3e50' },
  btn: { backgroundColor: '#3498db', padding: 18, borderRadius: 12, marginVertical: 8, elevation: 2 },
  btnSecondary: { backgroundColor: '#7f8c8d', padding: 18, borderRadius: 12, marginVertical: 8, elevation: 2 },
  btnHistory: { backgroundColor: '#2ecc71', padding: 18, borderRadius: 12, marginVertical: 8, elevation: 2 },
  btnText: { color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 16 },
  input: { backgroundColor: 'white', padding: 15, borderRadius: 8, marginVertical: 10, borderWidth: 1, borderColor: '#dcdde1' },
  saveBtn: { backgroundColor: '#27ae60', padding: 20, borderRadius: 12, marginTop: 20 },
  logCard: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 12, borderLeftWidth: 6, borderLeftColor: '#3498db', elevation: 3 },
  cardDate: { fontSize: 12, color: '#7f8c8d', marginBottom: 4 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
  cardSub: { fontSize: 14, color: '#34495e' },
  cardMins: { fontSize: 14, fontWeight: 'bold', color: '#27ae60', marginTop: 5 }
  container: { flex: 1, padding: 20, backgroundColor: '#fff', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5, marginBottom: 15 },
  btn: { backgroundColor: '#007AFF', padding: 15, borderRadius: 5, marginBottom: 10 },
  btnSecondary: { backgroundColor: '#6c757d', padding: 15, borderRadius: 5 },
  btnHistory: { backgroundColor: '#28a745', padding: 15, borderRadius: 5, marginTop: 10 },
  saveBtn: { backgroundColor: '#FF9500', padding: 15, borderRadius: 5, marginTop: 10 },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarDay: { width: '14.2%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderWeight: 0.5, borderColor: '#eee' },
  calendarDayText: { fontSize: 16 },
  dayLabel: { width: '14.2%', textAlign: 'center', fontWeight: 'bold', marginBottom: 5 },
  navText: { fontSize: 24, color: '#007AFF', padding: 10 },
  logCard: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  logDate: { fontWeight: 'bold', color: '#555' },
  label: { fontWeight: 'bold', marginBottom: 5, color: '#333' }
});

registerRootComponent(App);