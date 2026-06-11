part of 'billing_bloc.dart';

sealed class BillingState extends Equatable {
  const BillingState();

  @override
  List<Object?> get props => [];
}

class BillingInitial extends BillingState {
  const BillingInitial();
}

class BillingLoading extends BillingState {
  const BillingLoading();
}

class BillingProcessing extends BillingState {
  const BillingProcessing();
}

class BillingLoaded extends BillingState {
  const BillingLoaded({
    required this.subscription,
    required this.plans,
    required this.paystackEnabled,
  });

  final SubscriptionEntity subscription;
  final List<Map<String, dynamic>> plans;
  final bool paystackEnabled;

  @override
  List<Object?> get props => [subscription, plans, paystackEnabled];
}

class BillingCheckoutReady extends BillingState {
  const BillingCheckoutReady(this.checkout);

  final PaystackInitializeResult checkout;

  @override
  List<Object?> get props => [checkout];
}

class BillingFailure extends BillingState {
  const BillingFailure(this.message);

  final String message;

  @override
  List<Object?> get props => [message];
}
