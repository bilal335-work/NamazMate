import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Send } from 'lucide-react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';


interface SendReminderSheetProps {
  sheetRef: React.RefObject<BottomSheet | null>;
  prayerName: string;
  onSend: (message: string) => void;
  loading?: boolean;
}

export const SendReminderSheet: React.FC<SendReminderSheetProps> = ({
  sheetRef,
  prayerName,
  onSend,
  loading,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const snapPoints = useMemo(() => ['45%'], []);

  const [customMessage, setCustomMessage] = useState('');

  const quickMessages = [
    `Time for ${prayerName}! Let's pray together. ✨`,
    `Don't forget ${prayerName}. You got this! 💪`,
    `Waiting for you to mark ${prayerName}... ⏳`,
  ];

  const handleSend = (msg: string) => {
    if (!msg.trim()) return;
    onSend(msg.trim());
    setCustomMessage('');
  };

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
      )}
      backgroundStyle={{ backgroundColor: colors.background }}
      handleIndicatorStyle={{ backgroundColor: colors.text + '20' }}
    >
      <BottomSheetView style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Send Reminder</Text>
        <Text style={[styles.subtitle, { color: colors.text + '60' }]}>
          Encourage your partner to pray {prayerName}.
        </Text>

        <View style={styles.quickMessages}>
          {quickMessages.map((msg, index) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.quickMessageBtn, { backgroundColor: colors.text + '05', borderColor: colors.text + '10' }]}
              onPress={() => handleSend(msg)}
            >
              <Text style={[styles.quickMessageText, { color: colors.text }]}>{msg}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.customContainer}>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.text + '10', backgroundColor: colors.text + '05' }]}
            placeholder="Write a custom message..."
            placeholderTextColor={colors.text + '40'}
            maxLength={120}
            value={customMessage}
            onChangeText={setCustomMessage}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendBtn, { backgroundColor: colors.primary }]}
            onPress={() => handleSend(customMessage)}
            disabled={!customMessage.trim() || loading}
          >
            <Send size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={[styles.charCount, { color: colors.text + '40' }]}>
          {customMessage.length}/120
        </Text>
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 24,
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  quickMessages: {
    marginBottom: 24,
  },
  quickMessageBtn: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  quickMessageText: {
    fontSize: 14,
  },
  customContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    paddingRight: 50,
    minHeight: 48,
    fontSize: 14,
  },
  sendBtn: {
    position: 'absolute',
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  charCount: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
  }
});
