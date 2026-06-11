class ApiConstants {
  static const defaultBaseUrl = 'https://stitchhub-gb1w.onrender.com/api/v1';
  static const connectTimeout = Duration(seconds: 30);
  static const receiveTimeout = Duration(seconds: 30);
}

class StorageKeys {
  static const accessToken = 'access_token';
  static const refreshToken = 'refresh_token';
  static const userJson = 'user_json';
  static const fcmToken = 'fcm_token';
}

class HiveBoxes {
  static const cache = 'cache_box';
  static const syncQueue = 'sync_queue_box';
  static const orders = 'orders_box';
  static const customers = 'customers_box';
  static const messages = 'messages_box';
}

class SyncActions {
  static const createOrder = 'CREATE_ORDER';
  static const updateOrderStatus = 'UPDATE_ORDER_STATUS';
  static const sendMessage = 'SEND_MESSAGE';
  static const createCustomer = 'CREATE_CUSTOMER';
}
