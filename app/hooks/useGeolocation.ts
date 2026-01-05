/**
 * 位置情報取得カスタムフック
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}

export interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean; // 継続的に位置を監視するか
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 40000,
    maximumAge = 0,
    watch = false,
  } = options;

  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: false,
  });

  const watchIdRef = useRef<number | null>(null);

  /**
   * 位置情報取得成功時のコールバック
   */
  const onSuccess = useCallback((position: GeolocationPosition) => {
    setState({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      error: null,
      loading: false,
    });
  }, []);

  /**
   * 位置情報取得失敗時のコールバック
   */
  const onError = useCallback((error: GeolocationPositionError) => {
    let errorMessage: string;

    switch (error.code) {
      case 1: // PERMISSION_DENIED
        errorMessage = '位置情報の取得が拒否されました';
        break;
      case 2: // POSITION_UNAVAILABLE
        errorMessage = '位置情報を取得できませんでした';
        break;
      case 3: // TIMEOUT
        errorMessage = '位置情報の取得がタイムアウトしました';
        break;
      default:
        errorMessage = error.message || 'エラーが発生しました';
    }

    setState((prev) => ({
      ...prev,
      error: errorMessage,
      loading: false,
    }));
  }, []);

  /**
   * 位置情報を一度だけ取得
   */
  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: 'このブラウザは位置情報に対応していません',
        loading: false,
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy,
      timeout,
      maximumAge,
    });
  }, [enableHighAccuracy, timeout, maximumAge, onSuccess, onError]);

  /**
   * 位置情報の監視を開始
   */
  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: 'このブラウザは位置情報に対応していません',
      }));
      return;
    }

    // 既存の監視を停止
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    const id = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy,
      timeout,
      maximumAge,
    });

    watchIdRef.current = id;
  }, [enableHighAccuracy, timeout, maximumAge, onSuccess, onError]);

  /**
   * 位置情報の監視を停止
   */
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  /**
   * 監視モードの場合は自動開始
   */
  useEffect(() => {
    if (watch) {
      startWatching();
      return () => {
        stopWatching();
      };
    }
  }, [watch, startWatching, stopWatching]);

  return {
    ...state,
    getCurrentPosition,
    startWatching,
    stopWatching,
    isWatching: watchIdRef.current !== null,
  };
}
