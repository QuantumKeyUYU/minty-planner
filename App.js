import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

const STORAGE_KEY = 'minty_planner_state_v1';

const getToday = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};

const rankLabel = (streak) => {
  if (!streak || streak <= 0) return 'сонный огурчик';
  if (streak <= 3) return 'мятный новичок';
  if (streak <= 7) return 'устойчивый мятныш';
  if (streak <= 14) return 'мятный исследователь';
  if (streak <= 21) return 'хранитель привычки';
  return 'легендарный мятный маг';
};

export default function App() {
  const [activeTab, setActiveTab] = useState('tasks');
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [taskText, setTaskText] = useState('');
  const [habitText, setHabitText] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.tasks) setTasks(parsed.tasks);
          if (parsed.habits) setHabits(parsed.habits);
        }
      } catch (e) {
        console.log('Failed to load state', e);
      } finally {
        setIsLoaded(true);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const save = async () => {
      try {
        const data = JSON.stringify({ tasks, habits });
        await AsyncStorage.setItem(STORAGE_KEY, data);
      } catch (e) {
        console.log('Failed to save state', e);
      }
    };
    save();
  }, [tasks, habits, isLoaded]);

  const addTask = () => {
    const text = taskText.trim();
    if (!text) return;
    setTasks((prev) => [
      ...prev,
      { id: Date.now().toString(), text, done: false },
    ]);
    setTaskText('');
  };

  const toggleTask = (id) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, done: !t.done } : t
      )
    );
  };

  const clearDoneTasks = () => {
    setTasks((prev) => prev.filter((t) => !t.done));
  };

  const addHabit = () => {
    const text = habitText.trim();
    if (!text) return;
    setHabits((prev) => [
      ...prev,
      { id: Date.now().toString(), name: text, streak: 0, lastDoneDate: null },
    ]);
    setHabitText('');
  };

  const markHabitToday = (id) => {
    const today = getToday();
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        if (h.lastDoneDate === today) return h;
        return {
          ...h,
          streak: (h.streak || 0) + 1,
          lastDoneDate: today,
        };
      })
    );
  };

  const resetHabit = (id) => {
    setHabits((prev) =>
      prev.map((h) =>
        h.id === id ? { ...h, streak: 0, lastDoneDate: null } : h
      )
    );
  };

  const renderTask = ({ item }) => (
    <TouchableOpacity
      style={styles.taskRow}
      onPress={() => toggleTask(item.id)}
    >
      <View style={[styles.checkbox, item.done && styles.checkboxDone]}>
        {item.done && <Text style={styles.checkboxMark}>✓</Text>}
      </View>
      <Text style={[styles.taskText, item.done && styles.taskTextDone]}>
        {item.text}
      </Text>
    </TouchableOpacity>
  );

  const renderHabit = ({ item }) => {
    const today = getToday();
    const doneToday = item.lastDoneDate === today;
    return (
      <View style={styles.habitCard}>
        <Text style={styles.habitName}>{item.name}</Text>
        <Text style={styles.habitInfo}>
          Дней подряд: <Text style={styles.habitBold}>{item.streak || 0}</Text>
        </Text>
        <Text style={styles.habitRank}>
          Статус: <Text style={styles.habitBold}>{rankLabel(item.streak)}</Text>
        </Text>
        <View style={styles.habitButtonsRow}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              doneToday && styles.primaryButtonDisabled,
            ]}
            onPress={() => markHabitToday(item.id)}
            disabled={doneToday}
          >
            <Text style={styles.primaryButtonText}>
              {doneToday ? 'Сегодня уже мятно ✨' : 'Сегодня сделал(а) 🌿'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.habitResetButton}
            onPress={() => resetHabit(item.id)}
          >
            <Text style={styles.habitResetText}>Сбросить</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text style={styles.title}>Мятный планерюшка</Text>
        <Text style={styles.subtitle}>
          Немножко мятных дел на сегодня 🌿
        </Text>

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'tasks' && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab('tasks')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'tasks' && styles.tabTextActive,
              ]}
            >
              Задачки
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'habits' && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab('habits')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'habits' && styles.tabTextActive,
              ]}
            >
              Привычечки
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'tasks' ? (
          <View style={styles.tabContent}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Маленькая мятная задачка..."
                placeholderTextColor="#9ca3af"
                value={taskText}
                onChangeText={setTaskText}
                onSubmitEditing={addTask}
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.addButton} onPress={addTask}>
                <Text style={styles.addButtonText}>+</Text>
              </TouchableOpacity>
            </View>
            {tasks.length === 0 ? (
              <Text style={styles.emptyText}>
                Тут пока пусто. Добавь хотя бы одну мишенюньку 💚
              </Text>
            ) : (
              <>
                <FlatList
                  data={tasks}
                  keyExtractor={(item) => item.id}
                  renderItem={renderTask}
                  contentContainerStyle={styles.listContent}
                />
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={clearDoneTasks}
                >
                  <Text style={styles.secondaryButtonText}>
                    Убрать выполненные
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : (
          <View style={styles.tabContent}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Мятная привычечка (сон, вода, прогулка)..."
                placeholderTextColor="#9ca3af"
                value={habitText}
                onChangeText={setHabitText}
                onSubmitEditing={addHabit}
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.addButton} onPress={addHabit}>
                <Text style={styles.addButtonText}>+</Text>
              </TouchableOpacity>
            </View>
            {habits.length === 0 ? (
              <Text style={styles.emptyText}>
                Добавь первую привычку — и будем растить мятный стрик 💫
              </Text>
            ) : (
              <FlatList
                data={habits}
                keyExtractor={(item) => item.id}
                renderItem={renderHabit}
                contentContainerStyle={styles.listContent}
              />
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 12,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    borderRadius: 999,
    padding: 4,
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#22c55e',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#ecfdf3',
  },
  tabContent: {
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    color: '#111827',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  addButtonText: {
    fontSize: 24,
    color: '#ecfdf3',
    marginTop: -2,
  },
  emptyText: {
    marginTop: 24,
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  listContent: {
    paddingVertical: 8,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#9ca3af',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxDone: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  checkboxMark: {
    color: '#ecfdf3',
    fontSize: 16,
  },
  taskText: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  taskTextDone: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  habitCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 8,
  },
  habitName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  habitInfo: {
    fontSize: 13,
    color: '#4b5563',
  },
  habitRank: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 8,
  },
  habitBold: {
    fontWeight: '600',
    color: '#111827',
  },
  habitButtonsRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#22c55e',
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  primaryButtonDisabled: {
    backgroundColor: '#bbf7d0',
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ecfdf3',
  },
  habitResetButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitResetText: {
    fontSize: 12,
    color: '#4b5563',
  },
  secondaryButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  secondaryButtonText: {
    fontSize: 13,
    color: '#4b5563',
  },
});
