import 'dart:async';

import 'package:stitchhub_mobile/core/constants/app_constants.dart';
import 'package:stitchhub_mobile/core/network/api_client.dart';
import 'package:stitchhub_mobile/core/network/network_info.dart';
import 'package:stitchhub_mobile/core/sync/sync_queue.dart';

typedef SyncProgressCallback = void Function(int pending, int synced);

class SyncManager {
  SyncManager({
    required NetworkInfo networkInfo,
    required SyncQueue syncQueue,
    required ApiClient apiClient,
  })  : _networkInfo = networkInfo,
        _syncQueue = syncQueue,
        _apiClient = apiClient;

  final NetworkInfo _networkInfo;
  final SyncQueue _syncQueue;
  final ApiClient _apiClient;
  StreamSubscription<bool>? _connectivitySub;
  bool _isSyncing = false;

  void startListening() {
    _connectivitySub?.cancel();
    _connectivitySub = _networkInfo.onConnectivityChanged.listen((online) {
      if (online) unawaited(syncPending());
    });
  }

  Future<void> dispose() async {
    await _connectivitySub?.cancel();
  }

  Future<int> pendingCount() async => (await _syncQueue.getAll()).length;

  Future<void> syncPending({SyncProgressCallback? onProgress}) async {
    if (_isSyncing || !await _networkInfo.isConnected) return;
    _isSyncing = true;

    try {
      final items = await _syncQueue.getAll();
      var synced = 0;

      for (final item in items) {
        try {
          await _processItem(item);
          await _syncQueue.remove(item.id);
          synced++;
          onProgress?.call(items.length - synced, synced);
        } catch (_) {
          // Keep in queue for next attempt
        }
      }
    } finally {
      _isSyncing = false;
    }
  }

  Future<void> _processItem(SyncQueueItem item) async {
    switch (item.action) {
      case SyncActions.sendMessage:
        await _apiClient.post('/messages', data: item.payload);
      case SyncActions.createOrder:
        await _apiClient.post('/orders', data: item.payload);
      case SyncActions.updateOrderStatus:
        final orderId = item.payload['orderId'] as String;
        await _apiClient.patch(
          '/orders/$orderId/status',
          data: {'status': item.payload['status']},
        );
      case SyncActions.createCustomer:
        await _apiClient.post('/customers', data: item.payload);
      default:
        throw UnsupportedError('Unknown sync action: ${item.action}');
    }
  }
}
