import React from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Search, X } from 'lucide-react-native';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSubmit?: (text: string) => void;
  autoFocus?: boolean;
  className?: string;
  testID?: string;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder,
  onSubmit,
  autoFocus,
  className,
  testID,
}: SearchBarProps): React.ReactElement {
  const handleClear = (): void => {
    onChangeText('');
  };

  return (
    <View
      testID={testID}
      className={[
        'flex-row items-center bg-slate-100 dark:bg-slate-800 rounded-full px-4',
        'h-11',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Search size={18} color="#64748b" />
      <TextInput
        className="flex-1 ml-2 text-slate-900 dark:text-white text-base"
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={() => onSubmit?.(value)}
        returnKeyType="search"
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 ? (
        <Pressable
          onPress={handleClear}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          <X size={18} color="#64748b" />
        </Pressable>
      ) : null}
    </View>
  );
}

export default SearchBar;
