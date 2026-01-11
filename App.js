import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { registerRootComponent } from 'expo';
import { useEffect, useState } from 'react';
import { Alert, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
    if (username && password) { navigation.replace('Home'); } 
    else { Alert.alert('Error', 'Enter username and password'); }
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sports Logger Login</Text>
      <TextInput placeholder="Username" style={styles.input} value={username} onChangeText={setUsername} autoCapitalize="none" />
      <TextInput placeholder="Password" style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={styles.btn} onPress={handleLogin}><Text style={styles.btnText}>Log In</Text></TouchableOpacity>
      <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.navigate('SignUp')}><Text style={styles.btnText}>Sign Up</Text></TouchableOpacity>
    </View>
  );
};

const SignUpScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const handleSignUp = () => { Alert.alert('Success', 'Account created!'); navigation.navigate('Login'); };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <TextInput placeholder="Username" style={styles.input} value={username} onChangeText={setUsername} autoCapitalize="none" />
      <TextInput placeholder="Email" style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" />
      <TextInput placeholder="Password" style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={styles.btn} onPress={handleSignUp}><Text style={styles.btnText}>Sign Up</Text></TouchableOpacity>
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
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const changeMonth = (offset) => {
    const d = new Date(currentDate.setMonth(currentDate.getMonth() + offset));
    setCurrentDate(new Date(d));
  };

  const renderDays = () => {
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const daysArray = [];
    for (let i = 0; i < firstDay; i++) daysArray.push(<View key={`e-${i}`} style={styles.calendarDay} />);
    for (let i = 1; i <= days; i++) {
      daysArray.push(
        <TouchableOpacity key={i} style={styles.calendarDay} onPress={() => navigation.navigate('CategorySelect', { date: new Date(year, month, i).toLocaleDateString() })}>
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
      <View style={styles.calendarGrid}>{renderDays()}</View>
    </View>
  );
};

// --- 2. LOGGING SCREENS ---
const BattingLogScreen = ({ route, navigation }) => {
  const { date } = route.params;
  const [data, setData] = useState({
    'Shadow practice': { m: '', w: '' },
    'Batting in nets': { m: '', w: '' },
    'Batting drills': { m: '', w: '' }
  });

  const update = (k, f, v) => setData(p => ({ ...p, [k]: { ...p[k], [f]: v } }));
  const save = async () => {
    const promises = Object.entries(data).filter(([_, v]) => v.m || v.w).map(([k, v]) => 
      client.graphql({ query: createPracticeLog, variables: { input: { date, category: 'Batting', subCategory: `${k} @ ${v.w}`, duration: parseInt(v.m)||0 } } })
    );
    if(!promises.length) return Alert.alert('Empty', 'Please fill details');
    await Promise.all(promises); Alert.alert('Saved'); navigation.popToTop();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Batting - {date}</Text>
      {Object.keys(data).map(k => (
        <View key={k} style={styles.logGroup}>
          <Text style={styles.label}>{k}</Text>
          <View style={styles.row}>
            <TextInput placeholder="Mins" keyboardType="numeric" style={[styles.input, styles.half]} value={data[k].m} onChangeText={t=>update(k,'m',t)} />
            <TextInput placeholder="Where" style={[styles.input, styles.half]} value={data[k].w} onChangeText={t=>update(k,'w',t)} />
          </View>
        </View>
      ))}
      <TouchableOpacity style={styles.saveBtn} onPress={save}><Text style={styles.btnText}>Save</Text></TouchableOpacity>
    </ScrollView>
  );
};

const BowlingLogScreen = ({ route, navigation }) => {
  const { date } = route.params;
  const [data, setData] = useState({
    'Bowling in nets': { m: '', w: '' },
    'Bowling drills': { m: '', w: '' }
  });

  const update = (k, f, v) => setData(p => ({ ...p, [k]: { ...p[k], [f]: v } }));
  const save = async () => {
    const promises = Object.entries(data).filter(([_, v]) => v.m || v.w).map(([k, v]) => 
      client.graphql({ query: createPracticeLog, variables: { input: { date, category: 'Bowling', subCategory: `${k} @ ${v.w}`, duration: parseInt(v.m)||0 } } })
    );
    if(!promises.length) return Alert.alert('Empty', 'Please fill details');
    await Promise.all(promises); Alert.alert('Saved'); navigation.popToTop();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Bowling - {date}</Text>
      {Object.keys(data).map(k => (
        <View key={k} style={styles.logGroup}>
          <Text style={styles.label}>{k}</Text>
          <View style={styles.row}>
            <TextInput placeholder="Mins" keyboardType="numeric" style={[styles.input, styles.half]} value={data[k].m} onChangeText={t=>update(k,'m',t)} />
            <TextInput placeholder="Where" style={[styles.input, styles.half]} value={data[k].w} onChangeText={t=>update(k,'w',t)} />
          </View>
        </View>
      ))}
      <TouchableOpacity style={styles.saveBtn} onPress={save}><Text style={styles.btnText}>Save</Text></TouchableOpacity>
    </ScrollView>
  );
};

const FieldingLogScreen = ({ route, navigation }) => {
  const { date } = route.params;
  const [data, setData] = useState({
    'Fielding drills': { m: '', w: '' },
    'Catching practice': { m: '', w: '' }
  });

  const update = (k, f, v) => setData(p => ({ ...p, [k]: { ...p[k], [f]: v } }));
  const save = async () => {
    const promises = Object.entries(data).filter(([_, v]) => v.m || v.w).map(([k, v]) => 
      client.graphql({ query: createPracticeLog, variables: { input: { date, category: 'Fielding', subCategory: `${k} @ ${v.w}`, duration: parseInt(v.m)||0 } } })
    );
    if(!promises.length) return Alert.alert('Empty', 'Please fill details');
    await Promise.all(promises); Alert.alert('Saved'); navigation.popToTop();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Fielding - {date}</Text>
      {Object.keys(data).map(k => (
        <View key={k} style={styles.logGroup}>
          <Text style={styles.label}>{k}</Text>
          <View style={styles.row}>
            <TextInput placeholder="Mins" keyboardType="numeric" style={[styles.input, styles.half]} value={data[k].m} onChangeText={t=>update(k,'m',t)} />
            <TextInput placeholder="Where" style={[styles.input, styles.half]} value={data[k].w} onChangeText={t=>update(k,'w',t)} />
          </View>
        </View>
      ))}
      <TouchableOpacity style={styles.saveBtn} onPress={save}><Text style={styles.btnText}>Save</Text></TouchableOpacity>
    </ScrollView>
  );
};

const FitnessLogScreen = ({ route, navigation }) => {
  const { date } = route.params;
  const [lines, setLines] = useState(['', '', '', '', '']);
  const update = (i, t) => { const n = [...lines]; n[i] = t; setLines(n); };
  const save = async () => {
    const promises = lines.filter(l => l.trim()).map(l => 
      client.graphql({ query: createPracticeLog, variables: { input: { date, category: 'Fitness', subCategory: l, duration: 0 } } })
    );
    if(!promises.length) return Alert.alert('Empty', 'Please fill details');
    await Promise.all(promises); Alert.alert('Saved'); navigation.popToTop();
  };
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>List all the fitness exercises done today</Text>
      {lines.map((l, i) => (
        <TextInput key={i} placeholder={`Exercise ${i+1}`} style={styles.input} value={l} onChangeText={t=>update(i,t)} />
      ))}
      <TouchableOpacity style={styles.saveBtn} onPress={save}><Text style={styles.btnText}>Save</Text></TouchableOpacity>
    </ScrollView>
  );
};

const CategorySelect = ({ route, navigation }) => (
  <View style={styles.container}>
    <Text style={styles.title}>Select Category</Text>
    {['Batting', 'Bowling', 'Fielding', 'Fitness'].map(cat => (
      <TouchableOpacity key={cat} style={styles.btn} onPress={() => navigation.navigate(`${cat}Log`, { date: route.params.date })}>
        <Text style={styles.btnText}>{cat}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

const HistoryScreen = () => {
  const [logs, setLogs] = useState([]);
  useEffect(() => {
    const fetch = async () => {
      const res = await client.graphql({ query: listPracticeLogs });
      setLogs(res.data.listPracticeLogs.items);
    };
    fetch();
  }, []);
  return (
    <View style={styles.container}>
      <FlatList data={logs} keyExtractor={item => item.id} renderItem={({item}) => (
        <View style={styles.logCard}><Text>{item.date}: {item.category} ({item.duration}m)</Text></View>
      )} />
    </View>
  );
};

// --- APP ---
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="CalendarScreen" component={CalendarScreen} />
        <Stack.Screen name="CategorySelect" component={CategorySelect} />
        <Stack.Screen name="BattingLog" component={BattingLogScreen} />
        <Stack.Screen name="BowlingLog" component={BowlingLogScreen} />
        <Stack.Screen name="FieldingLog" component={FieldingLogScreen} />
        <Stack.Screen name="FitnessLog" component={FitnessLogScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginVertical: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5, marginBottom: 10 },
  btn: { backgroundColor: '#007AFF', padding: 15, borderRadius: 5, marginBottom: 10 },
  btnSecondary: { backgroundColor: '#6c757d', padding: 15, borderRadius: 5 },
  btnHistory: { backgroundColor: '#28a745', padding: 15, borderRadius: 5 },
  saveBtn: { backgroundColor: '#FF9500', padding: 15, borderRadius: 5 },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarDay: { width: '14%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center' },
  calendarDayText: { fontSize: 14 },
  navText: { fontSize: 24, color: '#007AFF', padding: 10 },
  logCard: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  logGroup: { marginBottom: 10 },
  label: { fontWeight: 'bold', marginBottom: 5 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  half: { width: '48%' }
});

registerRootComponent(App);
