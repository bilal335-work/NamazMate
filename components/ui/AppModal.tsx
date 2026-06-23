import { Modal, View, Text, TouchableWithoutFeedback } from 'react-native';
import React from 'react';
import { AppButton } from './AppButton';

interface AppModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm?: () => void;
  variant?: 'info' | 'destructive';
}

export const AppModal: React.FC<AppModalProps> = ({
  visible,
  onClose,
  title,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  variant = 'info',
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/50 justify-center items-center p-6">
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View className="bg-[#f4f1ea] w-full rounded-3xl p-6 space-y-4">
              <View className="space-y-2">
                <Text className="text-xl font-bold text-[#333333] tracking-tight">
                  {title}
                </Text>
                <Text className="text-slate-500 text-sm leading-5">
                  {message}
                </Text>
              </View>

              <View className="flex-row space-x-3">
                <AppButton
                  title="Cancel"
                  variant="outline"
                  onPress={onClose}
                  className="flex-1"
                />
                {onConfirm && (
                  <AppButton
                    title={confirmLabel}
                    variant={variant === 'destructive' ? 'destructive' : 'solid'}
                    onPress={onConfirm}
                    className="flex-1"
                  />
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
