import 'package:uuid/uuid.dart';
import 'package:stitchhub_mobile/core/storage/local_database.dart';

class SyncQueueItem {
  SyncQueueItem({
    required this.id,
    required this.action,
    required this.payload,
    required this.createdAt,
    this.retryCount = 0,
  });

  final String id;
  final String action;
  final Map<String, dynamic> payload;
  final DateTime createdAt;
  final int retryCount;

  Map<String, dynamic> toJson() => {
        'id': id,
        'action': action,
        'payload': payload,
        'createdAt': createdAt.toIso8601String(),
        'retryCount': retryCount,
      };

  factory SyncQueueItem.fromJson(Map<String, dynamic> json) => SyncQueueItem(
        id: json['id'] as String,
        action: json['action'] as String,
        payload: Map<String, dynamic>.from(json['payload'] as Map),
        createdAt: DateTime.parse(json['createdAt'] as String),
        retryCount: json['retryCount'] as int? ?? 0,
      );
}

class SyncQueue {
  SyncQueue(this._db);

  final LocalDatabase _db;
  static const _key = 'sync_queue_items';

  Future<void> enqueue(String action, Map<String, dynamic> payload) async {
    final items = await getAll();
    items.add(
      SyncQueueItem(
        id: const Uuid().v4(),
        action: action,
        payload: payload,
        createdAt: DateTime.now(),
      ),
    );
    await _persist(items);
  }

  Future<List<SyncQueueItem>> getAll() async {
    final raw = _db.readCache(_key);
    if (raw == null) return [];
    final list = raw['items'] as List<dynamic>? ?? [];
    return list
        .map((e) => SyncQueueItem.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  }

  Future<void> remove(String id) async {
    final items = await getAll();
    items.removeWhere((item) => item.id == id);
    await _persist(items);
  }

  Future<void> _persist(List<SyncQueueItem> items) async {
    await _db.cacheJson(_key, {
      'items': items.map((e) => e.toJson()).toList(),
    });
  }
}
