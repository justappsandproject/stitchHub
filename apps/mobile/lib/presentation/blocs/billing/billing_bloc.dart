import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:stitchhub_mobile/core/payments/paystack_service.dart';
import 'package:stitchhub_mobile/domain/entities/app_entities.dart';
import 'package:stitchhub_mobile/domain/repositories/repositories.dart';

part 'billing_event.dart';
part 'billing_state.dart';

class BillingBloc extends Bloc<BillingEvent, BillingState> {
  BillingBloc({
    required SubscriptionRepository subscriptionRepository,
    required PaystackService paystackService,
  })  : _subscriptionRepository = subscriptionRepository,
        _paystackService = paystackService,
        super(const BillingInitial()) {
    on<BillingLoadRequested>(_onLoad);
    on<BillingPaystackInitialize>(_onInitialize);
    on<BillingPaystackVerify>(_onVerify);
    on<BillingChangePlan>(_onChangePlan);
  }

  final SubscriptionRepository _subscriptionRepository;
  final PaystackService _paystackService;

  Future<void> _onLoad(
    BillingLoadRequested event,
    Emitter<BillingState> emit,
  ) async {
    emit(const BillingLoading());
    try {
      final subscription = await _subscriptionRepository.getCurrent();
      final plans = await _subscriptionRepository.getPlans();
      final config = await _paystackService.getConfig();
      emit(BillingLoaded(
        subscription: subscription,
        plans: plans,
        paystackEnabled: config.enabled,
      ));
    } catch (e) {
      emit(BillingFailure(e.toString()));
    }
  }

  Future<void> _onInitialize(
    BillingPaystackInitialize event,
    Emitter<BillingState> emit,
  ) async {
    emit(const BillingProcessing());
    try {
      final result = await _paystackService.initialize(event.plan);
      emit(BillingCheckoutReady(result));
    } catch (e) {
      emit(BillingFailure(e.toString()));
    }
  }

  Future<void> _onVerify(
    BillingPaystackVerify event,
    Emitter<BillingState> emit,
  ) async {
    emit(const BillingProcessing());
    try {
      final result = await _paystackService.verify(event.reference);
      if (result.status == 'SUCCESS') {
        add(const BillingLoadRequested());
      } else {
        emit(const BillingFailure('Payment verification failed'));
      }
    } catch (e) {
      emit(BillingFailure(e.toString()));
    }
  }

  Future<void> _onChangePlan(
    BillingChangePlan event,
    Emitter<BillingState> emit,
  ) async {
    emit(const BillingProcessing());
    try {
      await _paystackService.changePlan(event.plan);
      add(const BillingLoadRequested());
    } catch (e) {
      emit(BillingFailure(e.toString()));
    }
  }
}
