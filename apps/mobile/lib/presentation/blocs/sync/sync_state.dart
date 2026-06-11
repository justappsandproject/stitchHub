part of 'sync_bloc.dart';

class SyncState extends Equatable {
  const SyncState({
    required this.isOnline,
    required this.pendingCount,
    this.isSyncing = false,
    this.syncedCount = 0,
  });

  final bool isOnline;
  final int pendingCount;
  final bool isSyncing;
  final int syncedCount;

  SyncState copyWith({
    bool? isOnline,
    int? pendingCount,
    bool? isSyncing,
    int? syncedCount,
  }) =>
      SyncState(
        isOnline: isOnline ?? this.isOnline,
        pendingCount: pendingCount ?? this.pendingCount,
        isSyncing: isSyncing ?? this.isSyncing,
        syncedCount: syncedCount ?? this.syncedCount,
      );

  @override
  List<Object?> get props => [isOnline, pendingCount, isSyncing, syncedCount];
}
