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
    <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('CalendarScreen')}>
      <Text style={styles.btnText}>Log New Practice</Text>
    </TouchableOpacity>
    
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

// --- 2. CATEGORY SELECTION ---
const CategorySelect = ({ route, navigation }) => (
  <View style={styles.container}>
    <Text style={styles.title}>What did you work on?</Text>
    {['Batting', 'Bowling', 'Fielding', 'Fitness'].map((cat) => (
      <TouchableOpacity key={cat} style={styles.btn} onPress={() => navigation.navigate('LogForm', { category: cat, date: route.params.date })}>
        <Text style={styles.btnText}>{cat}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

// --- 3. LOG FORM ---
const LogForm = ({ route, navigation }) => {
  const { category, date } = route.params;
  const [mins, setMins] = useState('');
  const [sub, setSub] = useState('');

  const handleSave = async () => {
    try {
      await client.graphql({
        query: createPracticeLog,
        variables: {
          input: {
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
            <Text style={styles.logDate}>{item.date}</Text>
            <Text>{item.category} - {item.subCategory}</Text>
            <Text>{item.duration} mins</Text>
          </View>
        )}
      />
    </View>
  );
};

// --- NAVIGATION WRAPPER ---
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="CalendarScreen" component={CalendarScreen} />
        <Stack.Screen name="CategorySelect" component={CategorySelect} />
        <Stack.Screen name="LogForm" component={LogForm} />
        <Stack.Screen name="History" component={HistoryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
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
  logDate: { fontWeight: 'bold', color: '#555' }
});

registerRootComponent(App);
