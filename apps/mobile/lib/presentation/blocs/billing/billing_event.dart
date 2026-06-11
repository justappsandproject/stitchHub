part of 'billing_bloc.dart';

sealed class BillingEvent extends Equatable {
  const BillingEvent();

  @override
  List<Object?> get props => [];
}

class BillingLoadRequested extends BillingEvent {
  const BillingLoadRequested();
}

class BillingPaystackInitialize extends BillingEvent {
  const BillingPaystackInitialize(this.plan);

  final String plan;

  @override
  List<Object?> get props => [plan];
}

class BillingPaystackVerify extends BillingEvent {
  const BillingPaystackVerify(this.reference);

  final String reference;

  @override
  List<Object?> get props => [reference];
}

class BillingChangePlan extends BillingEvent {
  const BillingChangePlan(this.plan);

  final String plan;

  @override
  List<Object?> get props => [plan];
}
