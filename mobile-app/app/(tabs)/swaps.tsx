import React, { useState, useCallback } from 'react';
import { Clock } from 'lucide-react-native';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { useToast } from '../../components/modals/AppToast';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useSwaps, filterSwaps, SwapFilter } from '../../hooks/useSwaps';
import { chatService } from '../../services/chatService';
import { InlineGuestLoginPrompt } from '../../components/InlineGuestLoginPrompt';
import { SwapCard } from '../../components/cards/SwapCard';
import { RatingModal } from '../../components/modals/RatingModal';
import { VerifySwapModal } from '../../components/modals/VerifySwapModal';
import { C } from '../../components/theme';



export default function SwapsScreen() {
  const router = useRouter();
  const { isLoggedIn, token, setShowLoginPrompt } = useAuth();
  const { swaps, isLoading, error, fetchSwaps, acceptSwap, rejectSwap, markFinished, rateSwap } = useSwaps();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<SwapFilter>('all');
  const [ratingSwapId, setRatingSwapId] = useState<number | null>(null);
  const [isRating, setIsRating] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [pendingAcceptId, setPendingAcceptId] = useState<number | null>(null);

  // Always fetch all swaps and filter client-side for better UX reactive state
  useFocusEffect(
    useCallback(() => {
      if (isLoggedIn) fetchSwaps('all');
    }, [isLoggedIn, fetchSwaps])
  );

  const handleAccept = async (id: number) => {
    setPendingAcceptId(id);
    setShowVerify(true);
  };

  const handleAcceptConfirmed = async () => {
    if (!pendingAcceptId) return;
    setShowVerify(false);
    try {
      await acceptSwap(pendingAcceptId);
    } catch (e: any) {
      showToast(e.message ?? 'Failed to accept swap', 'error');
    } finally {
      setPendingAcceptId(null);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await rejectSwap(id);
    } catch (e: any) {
      showToast(e.message ?? 'Failed to reject swap', 'error');
    }
  };

  const handleMarkFinished = async (id: number) => {
    try {
      await markFinished(id);
    } catch (e: any) {
      showToast(e.message ?? 'Failed to mark as finished', 'error');
    }
  };

  const handleRateSubmit = async (rating: number, comment: string) => {
    if (!ratingSwapId) return;
    setIsRating(true);
    try {
      await rateSwap(ratingSwapId, { rating, comment: comment || undefined });
      setRatingSwapId(null);
      showToast('Rating submitted successfully!', 'success');
    } catch (e: any) {
      showToast(e.message ?? 'Failed to submit rating', 'error');
    } finally {
      setIsRating(false);
    }
  };

  const handleChat = async (otherUserId: number) => {
    try {
      if (!token) { setShowLoginPrompt(true); return; }
      const conv = await chatService.startConversation(otherUserId, token);
      router.push(`/(tabs)/chat?openId=${conv.id}`);
    } catch (e: any) {
      showToast(e.message ?? 'Failed to start conversation', 'error');
    }
  };

  const displayed = filterSwaps(swaps, filter);

  return (
    <ScrollView
      style={s.screen}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={() => fetchSwaps(filter)}
          colors={[C.violet600]}
          tintColor={C.violet600}
        />
      }
    >
      <View style={s.body}>
        <Text style={s.title}>My Swaps</Text>
        <Text style={s.subtitle}>{displayed.length} swap{displayed.length !== 1 ? 's' : ''}</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll}>
          {(['all', 'pending', 'active', 'completed', 'rejected'] as const).map(f => (
            <TouchableOpacity
              key={f}
              style={[s.filterPill, filter === f && s.filterPillActive]}
              onPress={() => {
                if (!isLoggedIn) { setShowLoginPrompt(true); return; }
                setFilter(f);
              }}
            >
              <Text style={[s.filterTxt, filter === f && s.filterTxtActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {!isLoggedIn && <InlineGuestLoginPrompt featureName="Swaps" />}

        {isLoggedIn && isLoading && (
          <ActivityIndicator size="large" color={C.violet600} style={{ marginTop: 32 }} />
        )}

        {isLoggedIn && !isLoading && error && (
          <Text style={s.errorTxt}>{error}</Text>
        )}

        {isLoggedIn && !isLoading && displayed.map(swap => (
          <SwapCard
            key={swap.id}
            swap={swap}
            onAccept={handleAccept}
            onReject={handleReject}
            onFinish={handleMarkFinished}
            onRate={setRatingSwapId}
            onChat={handleChat}
            onViewProfile={(uid) => router.push(`/profile?userId=${uid}`)}
          />
        ))}

        {isLoggedIn && !isLoading && displayed.length === 0 && !error && (
          <View style={s.empty}>
            <Clock size={48} color={C.gray300} />
            <Text style={s.emptyTxt}>No {filter !== 'all' ? filter : ''} swaps yet</Text>
          </View>
        )}
      </View>

      {/* Rating Modal */}
      <RatingModal
        isVisible={ratingSwapId !== null}
        onClose={() => setRatingSwapId(null)}
        onSubmit={handleRateSubmit}
        isSubmitting={isRating}
      />

      <VerifySwapModal
        isVisible={showVerify}
        onClose={() => setShowVerify(false)}
        onConfirm={handleAcceptConfirmed}
        onLearnMore={() => { setShowVerify(false); router.push('/profile'); }}
      />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.gray50 },
  body: { padding: 16, gap: 12, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '700', color: C.gray900 },
  subtitle: { fontSize: 13, color: C.gray500, marginTop: -8 },
  filterScroll: { marginBottom: 4 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: C.white, borderWidth: 1, borderColor: C.gray200, marginRight: 8 },
  filterPillActive: { backgroundColor: C.violet600, borderColor: C.violet600 },
  filterTxt: { fontSize: 13, fontWeight: '500', color: C.gray700 },
  filterTxtActive: { color: C.white, fontWeight: '600' },
  errorTxt: { color: '#DC2626', textAlign: 'center', fontSize: 13, paddingVertical: 16 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyTxt: { color: C.gray500, fontSize: 14 },
});
