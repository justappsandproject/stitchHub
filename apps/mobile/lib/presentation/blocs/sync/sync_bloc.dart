import 'dart:async';

import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:stitchhub_mobile/core/network/network_info.dart';
import 'package:stitchhub_mobile/core/sync/sync_manager.dart';

part 'sync_event.dart';
part 'sync_state.dart';

class SyncBloc extends Bloc<SyncEvent, SyncState> {
  SyncBloc(this._syncManager, this._networkInfo)
      : super(const SyncState(isOnline: true, pendingCount: 0)) {
    on<SyncStarted>(_onStarted);
    on<SyncNowRequested>(_onSyncNow);
    on<SyncConnectivityChanged>(_onConnectivity);
  }

  final SyncManager _syncManager;
  final NetworkInfo _networkInfo;
  StreamSubscription<bool>? _sub;

  Future<void> _onStarted(SyncStarted event, Emitter<SyncState> emit) async {
    _syncManager.startListening();
    _sub = _networkInfo.onConnectivityChanged.listen((online) {
      add(SyncConnectivityChanged(online));
    });
    final online = await _networkInfo.isConnected;
    final pending = await _syncManager.pendingCount();
    emit(state.copyWith(isOnline: online, pendingCount: pending));
    if (online) add(const SyncNowRequested());
  }

  Future<void> _onSyncNow(
    SyncNowRequested event,
    Emitter<SyncState> emit,
  ) async {
    emit(state.copyWith(isSyncing: true));
    await _syncManager.syncPending(
      onProgress: (pending, synced) {
        emit(state.copyWith(pendingCount: pending, syncedCount: synced));
      },
    );
    final pending = await _syncManager.pendingCount();
    emit(state.copyWith(isSyncing: false, pendingCount: pending));
  }

  Future<void> _onConnectivity(
    SyncConnectivityChanged event,
    Emitter<SyncState> emit,
  ) async {
    emit(state.copyWith(isOnline: event.isOnline));
    if (event.isOnline) add(const SyncNowRequested());
  }

  @override
  Future<void> close() {
    _sub?.cancel();
    _syncManager.dispose();
    return super.close();
  }
}
