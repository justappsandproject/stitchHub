part of 'orders_bloc.dart';

sealed class OrdersState extends Equatable {
  const OrdersState();

  @override
  List<Object?> get props => [];
}

class OrdersInitial extends OrdersState {
  const OrdersInitial();
}

class OrdersLoading extends OrdersState {
  const OrdersLoading();
}

class OrdersLoaded extends OrdersState {
  const OrdersLoaded(this.orders, {this.isOffline = false});

  final List<OrderEntity> orders;
  final bool isOffline;

  @override
  List<Object?> get props => [orders, isOffline];
}

class OrdersFailure extends OrdersState {
  const OrdersFailure(this.message);

  final String message;

  @override
  List<Object?> get props => [message];
}
