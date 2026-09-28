import React, { useCallback } from "react";
import { Platform, StyleSheet, TextInput, type NativeSyntheticEvent, type TextInputChangeEventData, type TextInputProps } from "react-native";
import { colors, motion, space } from "../../lib/theme";

type Props = TextInputProps & {
  isLast?: boolean;
};

function syncText(
  onChangeText: TextInputProps["onChangeText"],
  text: string,
  onChange?: TextInputProps["onChange"]
) {
  onChangeText?.(text);
  if (onChange) {
    const synthetic = { nativeEvent: { text } } as NativeSyntheticEvent<TextInputChangeEventData>;
    onChange(synthetic);
  }
}

/**
 * Single-line field inside a `GroupedSection` panel.
 * On Android (Fabric), controlled `value=""` can wipe keystrokes before JS updates — use native buffer + sync callbacks.
 */
export function GroupedTextField({
  isLast,
  style,
  placeholderTextColor = colors.textFaint,
  value,
  defaultValue,
  onChangeText,
  onChange,
  onEndEditing,
  ...rest
}: Props) {
  const handleChangeText = useCallback(
    (text: string) => syncText(onChangeText, text, onChange),
    [onChangeText, onChange]
  );

  const handleEndEditing = useCallback<NonNullable<TextInputProps["onEndEditing"]>>(
    (e) => {
      syncText(onChangeText, e.nativeEvent.text, onChange);
      onEndEditing?.(e);
    },
    [onChangeText, onChange, onEndEditing]
  );

  const androidUncontrolled = Platform.OS === "android";
  const initial = defaultValue ?? (typeof value === "string" ? value : undefined);

  return (
    <TextInput
      {...rest}
      {...(androidUncontrolled ? { defaultValue: initial ?? "" } : { value, defaultValue })}
      onChangeText={handleChangeText}
      onChange={onChange}
      onEndEditing={handleEndEditing}
      placeholderTextColor={placeholderTextColor}
      editable={rest.editable ?? true}
      showSoftInputOnFocus={Platform.OS === "android" ? true : rest.showSoftInputOnFocus}
      disableFullscreenUI={Platform.OS === "android" ? true : rest.disableFullscreenUI}
      underlineColorAndroid="transparent"
      textAlignVertical="center"
      style={[styles.input, !isLast && styles.divider, style]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: motion.minTouch + 4,
    paddingHorizontal: space.card,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
});
