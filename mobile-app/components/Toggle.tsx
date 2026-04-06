import React from 'react';
import { Switch } from 'react-native';
import { C } from './theme';

interface ToggleProps {
  checked: boolean;
  onChange: (val: boolean) => void;
}

export function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <Switch
      value={checked}
      onValueChange={onChange}
      trackColor={{ false: C.gray300, true: C.violet600 }}
      thumbColor={C.white}
    />
  );
}
