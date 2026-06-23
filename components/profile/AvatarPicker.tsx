import React, { useMemo, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList, 
  Image, 
  Dimensions,
  Animated,
  ViewToken,
  Platform
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { DEFAULT_AVATARS, AvatarConfig } from '@/constants/avatars';

const { width: WINDOW_WIDTH } = Dimensions.get('window');

interface AvatarPickerProps {
  gender?: 'male' | 'female' | 'prefer_not_to_say';
  selectedAvatarKey: string | null;
  onSelect: (avatar: AvatarConfig) => void;
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  gender = 'prefer_not_to_say',
  selectedAvatarKey,
  onSelect,
}) => {
  const [containerWidth, setContainerWidth] = React.useState(WINDOW_WIDTH - 48);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  const ITEM_SIZE = Math.round(containerWidth * 0.72);
  const ITEM_SPACING = Math.round((containerWidth - ITEM_SIZE) / 2);

  // Filter and sort avatars based on gender
  const filteredAvatars = useMemo(() => {
    const maleAvatars = DEFAULT_AVATARS.filter(a => a.genderGroup === 'male');
    const femaleAvatars = DEFAULT_AVATARS.filter(a => a.genderGroup === 'female');
    
    if (gender === 'male') return maleAvatars;
    if (gender === 'female') return femaleAvatars;
    return DEFAULT_AVATARS;
  }, [gender]);

  // Pre-load images
  useEffect(() => {
    filteredAvatars.forEach(avatar => {
      const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${avatar.storagePath}`;
      Image.prefetch(url);
    });
  }, [filteredAvatars]);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50
  }).current;

  // Entry Animation - animate back to the center/selected item on mount
  useEffect(() => {
    if (filteredAvatars.length > 0) {
      const targetIndex = selectedAvatarKey 
        ? filteredAvatars.findIndex(a => a.storagePath === selectedAvatarKey) 
        : 0;
      
      // Delay slightly more to ensure layout is complete and images are pre-fetching
      const timer = setTimeout(() => {
        if (!flatListRef.current) return;
        
        const index = targetIndex === -1 ? 0 : targetIndex;
        flatListRef.current.scrollToIndex({ 
          index, 
          animated: true, 
          viewPosition: 0.5 
        });
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [gender]); 

  // Find index of selected avatar to scroll to (for subsequent changes)
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (selectedAvatarKey) {
      const index = filteredAvatars.findIndex(a => a.storagePath === selectedAvatarKey);
      if (index !== -1) {
        flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
      }
    }
  }, [selectedAvatarKey]);

  // Track scroll for haptics
  const lastIndex = useRef(0);
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      const centerItem = viewableItems[0];
      if (centerItem.index !== null && centerItem.index !== lastIndex.current) {
        lastIndex.current = centerItem.index;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }).current;

  const renderItem = ({ item, index }: { item: AvatarConfig, index: number }) => {
    const isSelected = selectedAvatarKey === item.storagePath;
    
    // Scale animation based on scroll position
    const inputRange = [
      (index - 1) * ITEM_SIZE,
      index * ITEM_SIZE,
      (index + 1) * ITEM_SIZE,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.6, 1, 0.6],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.2, 1, 0.2],
      extrapolate: 'clamp',
    });

    const publicUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${item.storagePath}`;

    return (
      <Animated.View style={[
        styles.itemContainer,
        { width: ITEM_SIZE, transform: [{ scale }], opacity }
      ]}>
        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={() => {
            Haptics.selectionAsync();
            onSelect(item);
            // Directly scroll to the item when pressed
            flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
          }}
          style={[
            styles.avatarWrapper,
            { 
              width: Math.round(ITEM_SIZE * 0.85), 
              height: Math.round(ITEM_SIZE * 0.85),
              borderRadius: Math.round((ITEM_SIZE * 0.85) / 2)
            },
            isSelected && styles.avatarWrapperSelected
          ]}
        >
          <Image 
            source={{ uri: publicUrl }}
            style={styles.avatarImage}
          />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View 
      style={styles.container}
      onLayout={(e) => {
        const { width } = e.nativeEvent.layout;
        if (width > 0 && Math.abs(width - containerWidth) > 1) {
          setContainerWidth(width);
        }
      }}
    >
      <Animated.FlatList
        ref={flatListRef}
        data={filteredAvatars}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={filteredAvatars.length > 0 ? filteredAvatars.length - 1 : 0}
        snapToInterval={ITEM_SIZE}
        snapToAlignment="start"
        decelerationRate="fast"
        contentContainerStyle={[
          styles.flatListContent,
          { paddingHorizontal: ITEM_SPACING }
        ]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        onScrollToIndexFailed={() => {}}
        getItemLayout={(_, index) => ({
          length: ITEM_SIZE,
          offset: ITEM_SPACING + (ITEM_SIZE * index),
          index,
        })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    width: '100%',
  },
  flatListContent: {
    alignItems: 'center',
    paddingVertical: 32, // Add vertical space to prevent clipping
  },
  itemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrapper: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: 'rgba(51, 51, 51, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarWrapperSelected: {
    borderColor: '#333333',
    borderWidth: 3,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
});
