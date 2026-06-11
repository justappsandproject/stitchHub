import 'dart:convert';

import 'package:hive_flutter/hive_flutter.dart';
import 'package:stitchhub_mobile/core/constants/app_constants.dart';

class LocalDatabase {
  Box<String>? _cacheBox;
  Box<String>? _ordersBox;
  Box<String>? _customersBox;
  Box<String>? _messagesBox;

  Future<void> init() async {
    await Hive.initFlutter();
    _cacheBox = await Hive.openBox<String>(HiveBoxes.cache);
    await Hive.openBox<String>(HiveBoxes.syncQueue);
    _ordersBox = await Hive.openBox<String>(HiveBoxes.orders);
    _customersBox = await Hive.openBox<String>(HiveBoxes.customers);
    _messagesBox = await Hive.openBox<String>(HiveBoxes.messages);
  }

  Future<void> cacheJson(String key, Map<String, dynamic> data) async {
    await _cacheBox?.put(key, jsonEncode(data));
  }

  Map<String, dynamic>? readCache(String key) {
    final raw = _cacheBox?.get(key);
    if (raw == null) return null;
    return jsonDecode(raw) as Map<String, dynamic>;
  }

  Future<void> cacheList(String key, List<Map<String, dynamic>> items) async {
    await _cacheBox?.put(key, jsonEncode(items));
  }

  List<Map<String, dynamic>> readListCache(String key) {
    final raw = _cacheBox?.get(key);
    if (raw == null) return [];
    final decoded = jsonDecode(raw) as List<dynamic>;
    return decoded.cast<Map<String, dynamic>>();
  }

  Future<void> saveOrders(List<Map<String, dynamic>> orders) async {
    await _ordersBox?.clear();
    for (final order in orders) {
      await _ordersBox?.put(order['id'], jsonEncode(order));
    }
  }

  List<Map<String, dynamic>> readOrders() {
    return _ordersBox?.values
            .map((e) => jsonDecode(e) as Map<String, dynamic>)
            .toList() ??
        [];
  }

  Future<void> saveCustomers(List<Map<String, dynamic>> customers) async {
    await _customersBox?.clear();
    for (final customer in customers) {
      await _customersBox?.put(customer['id'], jsonEncode(customer));
    }
  }

  List<Map<String, dynamic>> readCustomers() =>
      _customersBox?.values
          .map((e) => jsonDecode(e) as Map<String, dynamic>)
          .toList() ??
      [];

  Future<void> saveMessages(String threadKey, List<Map<String, dynamic>> msgs) async {
    await _messagesBox?.put(threadKey, jsonEncode(msgs));
  }

  List<Map<String, dynamic>> readMessages(String threadKey) {
    final raw = _messagesBox?.get(threadKey);
    if (raw == null) return [];
    return (jsonDecode(raw) as List<dynamic>).cast<Map<String, dynamic>>();
  }
}
