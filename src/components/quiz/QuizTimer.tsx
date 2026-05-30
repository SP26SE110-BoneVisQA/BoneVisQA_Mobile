import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Clock } from 'lucide-react-native';

export interface QuizTimerProps {
  durationMinutes: number;
  startedAt: string;
  onExpire?: () => void;
}

function formatMmSs(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const mm = Math.floor(clamped / 60)
    .toString()
    .padStart(2, '0');
  const ss = (clamped % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

export function QuizTimer({
  durationMinutes,
  startedAt,
  onExpire,
}: QuizTimerProps): React.ReactElement {
  const expiredRef = useRef<boolean>(false);
  const onExpireRef = useRef<QuizTimerProps['onExpire']>(onExpire);
  const [remaining, setRemaining] = useState<number>(() => {
    const startMs = new Date(startedAt).getTime();
    const endMs = startMs + durationMinutes * 60 * 1000;
    return Math.max(0, Math.floor((endMs - Date.now()) / 1000));
  });

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    expiredRef.current = false;
    const startMs = new Date(startedAt).getTime();
    const endMs = startMs + durationMinutes * 60 * 1000;

    const tick = (): void => {
      const diff = Math.max(0, Math.floor((endMs - Date.now()) / 1000));
      setRemaining(diff);
      if (diff <= 0 && onExpireRef.current && !expiredRef.current) {
        expiredRef.current = true;
        onExpireRef.current();
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => {
      clearInterval(id);
    };
  }, [durationMinutes, startedAt]);

  const critical = remaining <= 60;
  const container = critical
    ? 'bg-destructive/10 border border-destructive'
    : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700';
  const textColor = critical ? 'text-destructive' : 'text-slate-900 dark:text-white';

  return (
    <View
      className={['flex-row items-center px-3 py-2 rounded-2xl', container].join(' ')}
    >
      <Clock size={16} color={critical ? '#ef4444' : '#0f172a'} />
      <Text className={['ml-2 font-semibold tabular-nums', textColor].join(' ')}>
        {formatMmSs(remaining)}
      </Text>
    </View>
  );
}

export default QuizTimer;
