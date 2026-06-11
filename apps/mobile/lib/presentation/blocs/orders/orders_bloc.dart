import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:stitchhub_mobile/domain/entities/app_entities.dart';
import 'package:stitchhub_mobile/domain/repositories/repositories.dart';

part 'orders_event.dart';
part 'orders_state.dart';

class OrdersBloc extends Bloc<OrdersEvent, OrdersState> {
  OrdersBloc(this._repository) : super(const OrdersInitial()) {
    on<OrdersLoadRequested>(_onLoad);
    on<OrderStatusUpdateRequested>(_onUpdateStatus);
  }

  final OrdersRepository _repository;

  Future<void> _onLoad(
    OrdersLoadRequested event,
    Emitter<OrdersState> emit,
  ) async {
    emit(const OrdersLoading());
    try {
      final orders = await _repository.getOrders(status: event.status);
      emit(OrdersLoaded(orders, isOffline: event.fromCache));
    } catch (e) {
      emit(OrdersFailure(e.toString()));
    }
  }

  Future<void> _onUpdateStatus(
    OrderStatusUpdateRequested event,
    Emitter<OrdersState> emit,
  ) async {
    try {
      await _repository.updateStatus(event.orderId, event.status);
      add(const OrdersLoadRequested());
    } catch (e) {
      emit(OrdersFailure(e.toString()));
    }
  }
}
