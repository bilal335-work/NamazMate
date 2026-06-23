import React, { useMemo, forwardRef } from 'react';
import { Text } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';

interface AppBottomSheetProps {
  title?: string;
  children: React.ReactNode;
  snapPoints?: string[];
}

export const AppBottomSheet = forwardRef<BottomSheet, AppBottomSheetProps>(
  ({ title, children, snapPoints = ['25%', '50%'] }, ref) => {
    const memoSnapPoints = useMemo(() => snapPoints, [snapPoints]);

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={memoSnapPoints}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            opacity={0.5}
          />
        )}
        backgroundStyle={{ backgroundColor: '#f4f1ea', borderRadius: 32 }}
        handleIndicatorStyle={{ backgroundColor: '#333333', width: 40 }}
      >
        <BottomSheetView className="p-6 space-y-4">
          {title && (
            <Text className="text-xl font-bold text-[#333333] tracking-tight mb-2">
              {title}
            </Text>
          )}
          {children}
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

AppBottomSheet.displayName = 'AppBottomSheet';
