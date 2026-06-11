part of 'orders_bloc.dart';

sealed class OrdersEvent extends Equatable {
  const OrdersEvent();

  @override
  List<Object?> get props => [];
}

class OrdersLoadRequested extends OrdersEvent {
  const OrdersLoadRequested({this.status, this.fromCache = false});

  final String? status;
  final bool fromCache;

  @override
  List<Object?> get props => [status, fromCache];
}

class OrderStatusUpdateRequested extends OrdersEvent {
  const OrderStatusUpdateRequested({
    required this.orderId,
    required this.status,
  });

  final String orderId;
  final String status;

  @override
  List<Object?> get props => [orderId, status];
}
