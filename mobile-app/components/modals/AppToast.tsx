import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react-native';
import { C } from '../theme';

type ToastType = 'success' | 'error' | 'info';

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const opacity = useState(new Animated.Value(0))[0];

  const hideToast = useCallback(() => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setToast(null));
  }, [opacity]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type });
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setTimeout(hideToast, 4000);
  }, [opacity, hideToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View style={[s.container, { opacity }]}>
          <View style={[s.toast, s[`toast_${toast.type}`]]}>
            <View style={s.iconWrap}>
              {toast.type === 'success' && <CheckCircle2 size={20} color={C.white} />}
              {toast.type === 'error' && <AlertCircle size={20} color={C.white} />}
              {toast.type === 'info' && <Info size={20} color={C.white} />}
            </View>
            <Text style={s.message}>{toast.message}</Text>
            <TouchableOpacity onPress={hideToast} style={s.closeBtn}>
              <X size={18} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    gap: 12,
  },
  toast_success: { backgroundColor: '#6200EE' },
  toast_error: { backgroundColor: '#311B92' },
  toast_info: { backgroundColor: '#4527A0' },
  iconWrap: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  message: { flex: 1, color: C.white, fontSize: 14, fontWeight: '600' },
  closeBtn: { padding: 4 },
});
